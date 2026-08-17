import { Navigate } from 'react-router-dom';

export function Home() {
  const modernUiEnabled = import.meta.env.VITE_FF_ENABLE_MODERN_UI_V1 === 'true';

  if (modernUiEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <h1>Expense Tracker</h1>
      <p>Welcome to the modern shell.</p>
    </div>
  );
}
