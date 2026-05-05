# H2G

H2G is a real-time synchronized video watching app. Users can create or join rooms, share a queue, chat, and keep playback in sync across multiple clients.

## Features

- Multi-source playback support through React Player
- Shared room state with Firebase Realtime Database
- Anonymous Firebase Auth
- Real-time chat and participant presence
- React, TypeScript, Vite, and Tailwind CSS

## Public Release Safety Notes

This folder is a sanitized source export for a separate public repository.

- Real `.env` values are intentionally not included.
- `.firebaserc` is intentionally not included because it can expose a real Firebase project id.
- `node_modules/`, `dist/`, and other generated files are intentionally not included.
- `database.rules.json` requires Firebase Auth and is still only a starter rule set. Review and harden it before deploying a real public instance.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in your own Firebase web app config:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## License

MIT
