# Deploy frontend su GitHub Pages

## 1) Configura l'URL delle API in produzione

1. Duplica il file `.env.production.example` in `.env.production`
2. Imposta il backend pubblico:

`VITE_API_BASE_URL=https://tuo-backend-pubblico/api`

> GitHub Pages ospita solo il frontend statico. Il backend Node/MySQL va pubblicato su un servizio server (Render, Railway, ecc.).

## 2) Installa dipendenze

```bash
npm install
```

## 3) Pubblica

```bash
npm run deploy
```

Questo comando:
- esegue la build con base relativa (`npm run build:gh`)
- pubblica la cartella `dist` sul branch `gh-pages`

## 4) Abilita GitHub Pages

Nel repository GitHub:
- **Settings** -> **Pages**
- **Source**: `Deploy from a branch`
- **Branch**: `gh-pages` / root

## Note routing

Il progetto usa `HashRouter` per evitare problemi di refresh su GitHub Pages.
Esempio URL:

`https://utente.github.io/repo/#/dashboard`
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
