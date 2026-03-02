# MindWell

MindWell e una web-app full stack con autenticazione utenti (registrazione, login, logout) e API REST.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL

## Funzionalita principali

- Registrazione, login e logout utenti
- Profilo utente modificabile
- Diario personale con prompt guidati
- Monitoraggio umore con grafici
- Obiettivi e badge progresso
- Community con post, commenti e like
- Chat di supporto

## Avvio in locale

### 1) Database

Avvia MySQL (es. da XAMPP) e crea il database:

```sql
CREATE DATABASE mindwell;
```

### 2) Backend

```bash
cd server
npm install
npm run dev
```

Backend disponibile su `http://localhost:4000`.

### 3) Frontend

```bash
cd client
npm install
npm run dev
```

Frontend disponibile su `http://localhost:5173`.

## Test e verifiche

### Test backend

```bash
cd server
npm test
```

### Build frontend

```bash
cd client
npm run build
```

## Note deploy

Il frontend puo essere pubblicato su GitHub Pages.
Per usare l'app anche con PC spento, il backend deve essere online su un hosting server (non localhost/XAMPP).
