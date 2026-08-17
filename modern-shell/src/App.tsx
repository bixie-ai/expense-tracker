import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { ErrorBoundary } from './components';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/shared/NotificationProvider';
import { theme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NotificationProvider>
                <RouterProvider router={router} />
              </NotificationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
