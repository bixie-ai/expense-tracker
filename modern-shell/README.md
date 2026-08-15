# Modern Shell

React/Vite shell application for the expense-tracker, migrating incrementally from the legacy Angular app using the Strangler Fig pattern.

## Local Development Setup

### Prerequisites

- Node.js 18+
- The legacy Angular backend running locally

### Running Both Applications

1. **Start the Angular backend** (in the root directory):

   ```bash
   ng serve --port 4200
   ```

   If the Angular app uses a different port, update `VITE_API_PROXY_TARGET` in `.env.development`.

2. **Start the React shell** (in `modern-shell/`):

   ```bash
   npm install
   npm run dev
   ```

   The React shell starts on port 4200 by default. If the Angular backend is also on 4200, start one on a different port and update the proxy target accordingly.

### API Proxy Configuration

The Vite dev server proxies all `/api/*` requests to the Angular backend. This eliminates CORS issues during local development and allows the React shell to consume existing API endpoints without backend changes.

**How it works:**

- Requests to `/api/...` are forwarded to the target specified in `VITE_API_PROXY_TARGET`
- Auth cookies and `Authorization` headers are forwarded automatically
- Non-`/api` routes are served by Vite (React app)

**Configuration:**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_PROXY_TARGET` | `http://localhost:4200` | URL of the running Angular backend |

Override the default by editing `.env.development`:

```bash
VITE_API_PROXY_TARGET=http://localhost:3000
```

### Troubleshooting

**Proxy errors in the console** (`Proxy error: Could not proxy request /api/...`):
- Ensure the Angular backend is running on the configured port
- Check that `VITE_API_PROXY_TARGET` matches the actual backend URL

**CORS errors:**
- The proxy handles CORS for `/api` routes — if you still see CORS errors, the request path may not start with `/api`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript type check |
