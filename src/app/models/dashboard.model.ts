export interface KpiCard {
    title: string;
    value: string;
    subtext: string;
    trend: 'up' | 'down' | 'neutral';
    icon: string;
    colorClass: string;
}

export interface RecentActivity {
    id: string;
    type: 'sale' | 'expense' | 'alert';
    description: string;
    amount?: string;
    date: Date;
    status?: 'completed' | 'pending' | 'warning';
}

export interface DailyRevenue {
    date: string;
    amount: number;
}

export interface MonthlyRevenue {
    month: string;
    total: number;
}

export interface ServiceBreakdown {
    service: string;
    amount: number;
    color: string;
}

export interface ChartDataSets {
    dailyRevenue: DailyRevenue[];
    monthlyRevenue: MonthlyRevenue[];
    serviceBreakdown: ServiceBreakdown[];
}

export interface DashboardData {
    kpis: KpiCard[];
    recentActivities: RecentActivity[];
    charts: ChartDataSets;
}
