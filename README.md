# Expense Tracker

A dual-frontend expense management application using the **Strangler Fig** migration pattern: a legacy Angular app and a modern React shell running side-by-side against a shared mock backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Machine                      │
│                                                          │
│  ┌──────────────────┐       ┌──────────────────────┐    │
│  │  Angular App      │       │  React Shell          │    │
│  │  (src/)           │       │  (modern-shell/)      │    │
│  │  Port 4201        │       │  Port 5173            │    │
│  │  ng serve         │       │  npm run dev          │    │
│  └────────┬─────────┘       └──────────┬───────────┘    │
│           │                             │                 │
│           │  ┌──────────────────────┐   │                 │
│           └──┤  Shared Mock Backend  ├──┘                 │
│              │  (localStorage-based) │                    │
│              └──────────────────────┘                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Parity Tests (tests/parity/)                     │   │
│  │  Playwright: visual + structural comparison       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

Both apps use a **localStorage-based mock authentication** system — no real Firebase backend or emulator is needed for local development.

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 8+ | `npm -v` |
| Angular CLI | 21+ | `npx ng version` |

## Quick Start: Side-by-Side Development

Follow these steps to run both applications simultaneously for visual parity testing.

```
┌────────────────────────────────────────────────────────┐
│  1. Install deps     npm install (root)                 │
│                      cd modern-shell && npm install     │
│                                                         │
│  2. Configure env    modern-shell/.env.development      │
│                                                         │
│  3. Start Angular    ng serve --port 4201  (Terminal 1) │
│                                                         │
│  4. Start React      npm run dev           (Terminal 2) │
│                      (from modern-shell/)               │
│                                                         │
│  5. Verify           Angular → localhost:4201           │
│                      React   → localhost:5173           │
└────────────────────────────────────────────────────────┘
```

### Step 1: Install Dependencies

```bash
# Root directory (Angular app)
npm install

# React shell
cd modern-shell
npm install
cd ..
```

### Step 2: Configure Environment Variables

Create or verify `modern-shell/.env.development`:

```bash
VITE_API_PROXY_TARGET=http://localhost:4201
VITE_ANGULAR_BASE_URL=http://localhost:4201
VITE_FF_LOG_EXPENSE_REACT=true
```

See [modern-shell/README.md](modern-shell/README.md) for the full variable reference.

### Step 3: Start the Angular App (Terminal 1)

```bash
ng serve --port 4201
```

The Angular app serves on `http://localhost:4201`.

See [src/README.md](src/README.md) for Angular-specific details.

### Step 4: Start the React Shell (Terminal 2)

```bash
cd modern-shell
npm run dev
```

The React shell serves on `http://localhost:5173` (Vite default) and proxies `/angular` routes to the Angular app at port 4201.

See [modern-shell/README.md](modern-shell/README.md) for React-specific details.

### Step 5: Verify Both Apps Are Running

| App | URL | Expected |
|-----|-----|----------|
| Angular | http://localhost:4201 | Login page loads with Material Design UI |
| React | http://localhost:5173 | Login page loads with MUI-based UI |

Both apps share the same localStorage-based mock auth — logging in on either app uses the same local credentials.

## Running Parity Tests

With both apps running:

```bash
npx playwright test --config=tests/parity/playwright.config.ts
```

The parity tests expect:
- Angular at `http://localhost:4200` (override with `ANGULAR_URL` env var)
- React at `http://localhost:5173` (override with `REACT_URL` env var)

To match the test defaults, start Angular on port 4200 instead:

```bash
# For parity tests specifically:
ng serve --port 4200
```

Or override the test URLs:

```bash
ANGULAR_URL=http://localhost:4201 REACT_URL=http://localhost:5173 \
  npx playwright test --config=tests/parity/playwright.config.ts
```

## Project Structure

```
expense-tracker/
├── src/                    # Angular application (legacy)
├── modern-shell/           # React/Vite application (migration target)
├── tests/parity/           # Playwright visual parity tests
├── public/                 # Angular static assets
├── angular.json            # Angular workspace config
├── firebase.json           # Firebase hosting config
└── package.json            # Root (Angular) dependencies & scripts
```

## Available Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm start` | Start Angular dev server (port 4200) |
| `ng serve --port 4201` | Start Angular on alternate port |
| `npm run build` | Production build (Angular) |
| `npm test` | Run Angular unit tests (Karma) |
| `npm run test:parity` | Run Playwright parity tests |
| `npm run lint` | Lint Angular source |

## Technologies

| Layer | Angular (src/) | React (modern-shell/) |
|-------|---------------|----------------------|
| Framework | Angular 21 | React 18 + Vite |
| UI Library | Angular Material (MD3) | MUI 9 |
| State | RxJS + Services | React Query + Context |
| Auth | Mock (localStorage) | Mock (localStorage) |
| Testing | Karma/Jasmine | Vitest + Testing Library |

## Troubleshooting

**Port conflict on 4200**: Both apps default to port 4200. For side-by-side development, always start Angular on 4201 and let Vite use 5173.

**Proxy errors in React shell**: Ensure Angular is running on the port specified in `VITE_API_PROXY_TARGET`.

**Parity tests fail to connect**: Verify both apps are running on the expected ports before running tests. Check `tests/parity/playwright.config.ts` for the current URL defaults.
