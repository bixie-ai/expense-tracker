# React Shell (modern-shell/)

React/Vite shell application for the expense-tracker, migrating incrementally from the legacy Angular app using the Strangler Fig pattern.

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 8+ | `npm -v` |

## Setup

### Install Dependencies

```bash
cd modern-shell
npm install
```

### Environment Configuration

Copy the example environment or create `.env.development`:

```bash
# modern-shell/.env.development
VITE_API_PROXY_TARGET=http://localhost:4201
VITE_ANGULAR_BASE_URL=http://localhost:4201
VITE_FF_LOG_EXPENSE_REACT=true
```

#### Environment Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_PROXY_TARGET` | `http://localhost:4200` | URL of the running Angular backend for `/api` proxy |
| `VITE_ANGULAR_BASE_URL` | `http://localhost:4201` | Angular app URL for legacy route iframe/redirects |
| `VITE_API_BASE_URL` | (empty) | Base URL for API client; empty uses relative paths |
| `VITE_FF_LOG_EXPENSE_REACT` | `true` | Feature flag: enable React log-expense route |
| `VITE_FF_IMPORT_EXPENSES_REACT` | — | Feature flag: enable React import-expenses route |

Feature flags follow the pattern `VITE_FF_<FLAG_NAME>=true`. The router checks `import.meta.env[VITE_FF_${flag.toUpperCase()}]` at runtime.

#### `.env.development` Template

```bash
# Proxy target — must point to the running Angular app
VITE_API_PROXY_TARGET=http://localhost:4201

# Angular base URL for legacy route delegation
VITE_ANGULAR_BASE_URL=http://localhost:4201

# Feature flags (set to "true" to enable migrated React routes)
VITE_FF_LOG_EXPENSE_REACT=true
# VITE_FF_IMPORT_EXPENSES_REACT=true
```

## Running the React Shell

### Standalone (requires Angular backend)

```bash
npm run dev
```

Serves at `http://localhost:5173` (Vite default port).

### Side-by-side with Angular

1. Start Angular on port 4201 (from repo root): `ng serve --port 4201`
2. Ensure `.env.development` points to `http://localhost:4201`
3. Start React: `npm run dev`
4. Open `http://localhost:5173`

## Proxy Configuration

The Vite dev server proxies requests to the Angular backend:

| Path | Target | Description |
|------|--------|-------------|
| `/api/*` | `VITE_API_PROXY_TARGET` | API requests forwarded to Angular backend |
| `/angular/*` | `http://localhost:4201` | Legacy Angular routes (path rewrite: strips `/angular` prefix) |

Auth cookies and `Authorization` headers are forwarded automatically on proxied requests.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format `src/**/*` |

## Project Structure

```
modern-shell/
├── src/
│   ├── api/            # API client functions
│   ├── app/            # Feature modules (manage-options, etc.)
│   ├── components/     # Shared UI components
│   ├── config/         # App config (firebase, proxy, routes)
│   ├── contexts/       # React contexts (Auth, Layout)
│   ├── core/           # Core utilities, repositories
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page-level components
│   ├── router.tsx      # App router with feature-flag gating
│   ├── schemas/        # Zod validation schemas
│   ├── theme.ts        # MUI theme configuration
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── .env.development    # Local environment config
├── vite.config.ts      # Vite + proxy configuration
└── package.json        # Dependencies and scripts
```

## Mock Authentication

The React shell uses the same localStorage-based mock auth as Angular (`contexts/AuthContext.tsx`):

- Mock user stored under `localStorage` key: `mock_user`
- UID generated deterministically from email (identical algorithm to Angular)
- No real Firebase auth calls — sign-up/login are instant

This shared mock backend means both apps read/write the same `mock_user` localStorage key, enabling shared session state when testing in the same browser.

## Route Migration Status

Routes are configured in `src/config/route-config.ts`:

| Route | Status | Notes |
|-------|--------|-------|
| `/login` | legacy | Delegated to Angular |
| `/dashboard` | legacy | Delegated to Angular |
| `/settings` | legacy | Delegated to Angular |
| `/new-expense` | legacy | Delegated to Angular |
| `/log-expense` | migrated | Feature flag: `VITE_FF_LOG_EXPENSE_REACT` |
| `/import-expenses` | migrated | Feature flag: `VITE_FF_IMPORT_EXPENSES_REACT` |

## Troubleshooting

**`Proxy error: Could not proxy request /api/...`**
- Ensure Angular is running on the port specified in `VITE_API_PROXY_TARGET`

**CORS errors**
- The proxy handles CORS for `/api` and `/angular` routes. If you see CORS errors, the request path may not match these prefixes.

**Port 5173 already in use**
- Another Vite instance may be running. Kill it or let Vite auto-increment to 5174.

**Feature-flagged route not appearing**
- Check that the corresponding `VITE_FF_*` variable is set to `"true"` in `.env.development`
- Restart the dev server after changing env vars (Vite caches env at startup)

## Success Criteria

After starting the React shell:

1. `http://localhost:5173` loads without errors
2. The login page renders with MUI-based UI
3. Sign up/login works (mock auth via localStorage)
4. Migrated routes (e.g., `/log-expense`) render React components
5. Legacy routes redirect to the Angular app at the configured `VITE_ANGULAR_BASE_URL`
6. No proxy errors in the terminal when Angular is running
