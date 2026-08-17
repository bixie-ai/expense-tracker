# Angular App (src/)

The legacy Angular expense tracker application. Serves as the baseline for visual parity testing against the React shell migration.

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 18+ | `node -v` |
| Angular CLI | 21+ | `npx ng version` |

The Angular CLI is available via the root `package.json` devDependencies — no global install required.

## Setup

### Install Dependencies

From the **repository root**:

```bash
npm install
```

### Environment Configuration

The Angular app uses a **localStorage-based mock backend** — no Firebase credentials or environment files are required for local development.

Authentication is handled by `src/app/core/services/auth.service.ts` which stores mock user sessions in `localStorage` under the key `mock_user`.

No `.env` file or `src/environments/` configuration is needed for the mock setup.

## Running the Angular App

### Default (standalone)

```bash
ng serve
```

Serves at `http://localhost:4200`.

### Side-by-side with React shell

```bash
ng serve --port 4201
```

Serves at `http://localhost:4201`. The React shell's proxy and route config expect Angular on this port when both run together.

## Available Scripts

All scripts run from the **repository root**.

| Command | Description |
|---------|-------------|
| `npm start` / `ng serve` | Dev server on port 4200 |
| `ng serve --port 4201` | Dev server on alternate port (for dual-app mode) |
| `npm run build` / `ng build` | Production build → `dist/expense-tracker/` |
| `npm test` / `ng test` | Unit tests via Karma/Jasmine |
| `npm run lint` / `ng lint` | ESLint check |
| `npm run format` | Prettier format `src/**/*` |

## Project Structure

```
src/
├── app/
│   ├── core/               # Services, guards, interceptors, interfaces
│   │   ├── guards/         # Auth guards (mock-auth.guard.ts)
│   │   ├── interfaces/     # TypeScript models (expense, user)
│   │   ├── repositories/   # Data access layer
│   │   └── services/       # Auth, database, user services
│   ├── features/           # Feature modules (dashboard, expenses, settings)
│   └── shared/             # Shared components, pipes, directives
├── assets/                 # Static assets
└── styles/                 # Global SCSS styles
```

## Mock Authentication

The mock auth system (`auth.service.ts`) provides:

- `signUp(email, password)` — creates a deterministic mock user in localStorage
- `logIn(email, password)` — retrieves or creates a mock user
- `logOut()` — clears the `mock_user` localStorage key
- `getCurrentUser()` — returns the stored mock user or `null`

The mock user UID is derived deterministically from the email, ensuring both Angular and React apps generate the same UID for the same credentials.

## Success Criteria

After starting the Angular app, verify:

1. `http://localhost:4201` loads the login page
2. You can sign up with any email/password
3. After login, the dashboard renders with expense management UI
4. No errors in the browser console related to Firebase connections
