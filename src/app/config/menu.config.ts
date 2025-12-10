import { MenuItem } from '../models/menu.model';

export const MENU_ITEMS: MenuItem[] = [
    {
        label: 'Dashboard',
        icon: 'ri-home-line',
        route: '/dashboard'
    },
    {
        label: 'Sales',
        icon: 'ri-money-dollar-circle-line',
        children: [
            { label: 'Add Sale', icon: 'ri-add-line', route: '/sales/add' },
            { label: 'Sales List', icon: 'ri-file-list-3-line', route: '/sales/list' },
            { label: 'Sales Summary', icon: 'ri-bar-chart-line', route: '/sales/summary' }
        ]
    },
    {
        label: 'Expenses',
        icon: 'ri-bank-card-line',
        children: [
            { label: 'Add Expense', icon: 'ri-add-line', route: '/expenses/add' },
            { label: 'Expense List', icon: 'ri-file-list-3-line', route: '/expenses/list' },
            { label: 'Expense Summary', icon: 'ri-pie-chart-line', route: '/expenses/summary' }
        ]
    },
    {
        label: 'Inventory',
        icon: 'ri-archive-line',
        children: [
            { label: 'Inventory List', icon: 'ri-file-list-3-line', route: '/inventory/list' },
            { label: 'Update Inventory', icon: 'ri-edit-line', route: '/inventory/edit/:id' },
            { label: 'Alerts', icon: 'ri-notification-3-line', route: '/inventory/alerts' }
        ]
    },
    {
        label: 'Reports',
        icon: 'ri-file-chart-line',
        route: '/reports'
    },
    {
        label: 'Settings',
        icon: 'ri-settings-3-line',
        route: '/settings'
    }
];
