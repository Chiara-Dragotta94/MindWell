# Test plan minimo

## Test automatici (backend)

Esegui:

```bash
npm test
```

Copertura attuale:
- `generateToken()` produce un JWT valido
- `authRequired` blocca richieste senza token (`401`)
- `authRequired` accetta token valido e valorizza `req.user`

## Test manuali essenziali (end-to-end)

1. Registrazione:
   - crea un nuovo account da frontend
   - verifica risposta positiva e accesso alla dashboard
2. Login:
   - prova credenziali corrette e errate
   - verifica messaggi di errore e successo
3. Logout:
   - clicca `Esci`
   - verifica ritorno alla home e rimozione sessione
4. Rotte protette:
   - prova ad aprire `/dashboard` da utente non loggato
   - verifica redirect al login
5. API salute:
   - apri `GET /api/health`
   - verifica `{"status":"ok","app":"MindWell"}`
