import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// In questo modulo centralizzo tutta la logica DB: connessione, bootstrap tabelle e query helper.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mindwell",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function initDb() {
  // All'avvio inizializzo lo schema, così il progetto resta avviabile anche su ambiente nuovo.
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        birth_date DATE,
        bio TEXT DEFAULT NULL,
        avatar_color VARCHAR(20) DEFAULT '#00B4A0',
        streak_days INT DEFAULT 0,
        last_active DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS moods (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        mood_score INT NOT NULL,
        mood_label VARCHAR(50) NOT NULL,
        energy_level INT,
        anxiety_level INT,
        sleep_quality INT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        prompt_id VARCHAR(100),
        situation TEXT,
        automatic_thought TEXT,
        emotions VARCHAR(255),
        cognitive_distortion VARCHAR(255),
        rational_response TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'generale',
        target_days INT DEFAULT 7,
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS goal_completions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        completed_at DATE NOT NULL,
        UNIQUE(goal_id, completed_at),
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        badge_type VARCHAR(100) NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_type),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'generale',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        PRIMARY KEY (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Database tables initialized");
  } finally {
    conn.release();
  }
}

export async function dbGet(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

export async function dbAll(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function dbRun(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return { lastID: result.insertId, changes: result.affectedRows };
}

export default pool;
