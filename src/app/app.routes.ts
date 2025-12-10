import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent },
    {
        path: 'sales/add',
        loadComponent: () => import('./components/sales/add-sale/add-sale.component').then(m => m.AddSaleComponent)
    },
    {
        path: 'sales/list',
        loadComponent: () => import('./components/sales/sales-list/sales-list.component').then(m => m.SalesListComponent)
    },
    {
        path: 'sales/summary',
        loadComponent: () => import('./components/sales/sales-summary/sales-summary.component').then(m => m.SalesSummaryComponent)
    },
    {
        path: 'expenses/add',
        loadComponent: () => import('./components/expenses/add-expense/add-expense.component').then(m => m.AddExpenseComponent)
    },
    {
        path: 'expenses/list',
        loadComponent: () => import('./components/expenses/expense-list/expense-list.component').then(m => m.ExpenseListComponent)
    },
    {
        path: 'expenses/summary',
        loadComponent: () => import('./components/expenses/expense-summary/expense-summary.component').then(m => m.ExpenseSummaryComponent)
    },
    {
        path: 'inventory/add',
        loadComponent: () => import('./components/inventory/update-inventory/update-inventory.component').then(m => m.UpdateInventoryComponent)
    },
    {
        path: 'inventory/list',
        loadComponent: () => import('./components/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
    },
    {
        path: 'inventory/edit/:id',
        loadComponent: () => import('./components/inventory/update-inventory/update-inventory.component').then(m => m.UpdateInventoryComponent)
    },
    {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports/reports.component').then(m => m.ReportsComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./components/settings/general-settings/general-settings.component').then(m => m.GeneralSettingsComponent)
    },
    {
        path: 'settings/general',
        loadComponent: () => import('./components/settings/general-settings/general-settings.component').then(m => m.GeneralSettingsComponent)
    }
];
