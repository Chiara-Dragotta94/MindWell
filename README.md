# MindWell

MindWell e una web-app full stack dedicata al benessere psicologico quotidiano.
Il progetto include autenticazione utenti, API REST e una SPA moderna lato frontend.

## Tecnologie

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL

## Funzionalita principali

- Registrazione, login e logout utenti
- Profilo utente con modifica dati personali
- Diario personale con prompt guidati
- Monitoraggio umore con storico e grafici
- Obiettivi personali e sistema badge
- Community con post, commenti e like
- Chat di supporto

## Avvio in locale

### 1) Database

Assicurati che MySQL sia attivo, poi crea il database:

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

## Deploy

- Frontend: pubblicabile su GitHub Pages
- Backend: deploy su un hosting Node.js con supporto a MySQL
