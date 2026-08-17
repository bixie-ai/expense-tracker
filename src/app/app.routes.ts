import { Routes } from '@angular/router';
import { ExpenseFilterControlsComponent } from '@core/components/expense-filter-controls/expense-filter-controls.component';
import { CloseAndRedirectComponent } from '@core/components/close-and-redirect/close-and-redirect.component';
import { mockAuthGuard, mockLoginGuard } from '@core/guards/mock-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    pathMatch: 'full',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [mockLoginGuard],
  },
  {
    path: 'dashboard',
    pathMatch: 'full',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [mockAuthGuard],
    title: 'Dashboard',
    data: {
      title: 'Dashboard',
      pageActions: ExpenseFilterControlsComponent,
    },
  },
  {
    path: 'settings',
    pathMatch: 'full',
    loadComponent: () =>
      import('./expense-settings/expense-settings.component').then((m) => m.ExpenseSettingsComponent),
    canActivate: [mockAuthGuard],
    data: {
      title: 'Settings',
      pageActions: CloseAndRedirectComponent,
      fixedContainer: true,
    },
  },
  {
    path: 'new-expense',
    pathMatch: 'full',
    loadComponent: () => import('./log-expense/log-expense.component').then((m) => m.LogExpenseComponent),
    canActivate: [mockAuthGuard],
    data: {
      title: 'New Expense',
      pageActions: CloseAndRedirectComponent,
      fixedContainer: true,
    },
  },

  {
    path: 'import-expenses',
    pathMatch: 'full',
    loadComponent: () => import('./import-expenses/import-expenses.component').then((m) => m.ImportExpensesComponent),
    canActivate: [mockAuthGuard],
    data: {
      title: 'Import Expenses',
      pageActions: CloseAndRedirectComponent,
      fixedContainer: true,
    },
  },
];
