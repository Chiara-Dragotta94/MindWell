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

## Deploy demo funzionante (backend pubblico + Netlify)

### 1) Deploy backend su una piattaforma Node.js + MySQL

1. Crea un servizio backend da repository GitHub sulla piattaforma che preferisci (es. Render, Fly.io, ecc.).
2. Collega o crea un database MySQL.
3. Nelle variabili del servizio backend imposta:
   - `PORT=4000`
   - `JWT_SECRET=<una chiave lunga e sicura>`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` con i valori del database MySQL
   - `CORS_ORIGINS=http://localhost:5173,https://tuo-sito.netlify.app`
4. Avvia il deploy e verifica `https://tuo-backend.example.com/api/health`.

### 2) Deploy frontend su Netlify

Il repository include il file `netlify.toml` (gia pronto) con:
- `base = client`
- `command = npm run build`
- `publish = dist`

1. Su Netlify crea un nuovo sito da repository GitHub.
2. Netlify leggera automaticamente `netlify.toml`.
3. In `Site settings > Environment variables` crea:
   - `VITE_API_BASE_URL = https://tuo-backend.example.com/api`
4. Esegui deploy (o triggera un redeploy dopo aver inserito la variabile).
5. Apri il sito: `https://tuo-sito.netlify.app`.

### 3) Verifica finale demo

- Registrazione e login funzionanti dal link pubblico
- Creazione voce diario
- Inserimento mood
- Apertura community e chat di supporto
- Nessun errore CORS o `Failed to fetch` in console
