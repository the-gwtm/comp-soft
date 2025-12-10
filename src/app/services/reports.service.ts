import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface RevenueExpenseData {
    date: string;
    revenue: number;
    expense: number;
}

export interface ServiceDistribution {
    service: string;
    amount: number;
    color: string;
}

export interface ReportsData {
    revenueExpense: RevenueExpenseData[];
    serviceDistribution: ServiceDistribution[];
    kpis: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        totalTransactions: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ReportsService {

    constructor() { }

    /**
     * Fetches complete reports data including charts and KPIs
     * Returns mock data for Revenue vs Expenses and Service Distribution
     */
    getReportsData(): Observable<ReportsData> {
        return forkJoin({
            revenueExpense: this.getRevenueExpenseData(),
            serviceDistribution: this.getServiceDistributionData(),
            kpis: this.getKpiData()
        }).pipe(
            delay(600) // Simulate API delay
        );
    }

    /**
     * Generates Revenue vs Expense comparison data for the last 7 days
     * Returns data for dual-axis bar chart
     */
    getRevenueExpenseData(): Observable<RevenueExpenseData[]> {
        const data: RevenueExpenseData[] = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Generate realistic revenue and expense data
            const baseRevenue = 3500 + Math.random() * 2000;
            const baseExpense = 1200 + Math.random() * 800;
            const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.6 : 1;
            
            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: Math.round(baseRevenue * weekendMultiplier),
                expense: Math.round(baseExpense * weekendMultiplier)
            });
        }
        
        return of(data);
    }

    /**
     * Generates service distribution data for pie chart
     * Returns breakdown by service type with colors
     */
    getServiceDistributionData(): Observable<ServiceDistribution[]> {
        const data: ServiceDistribution[] = [
            {
                service: 'Xerox & Print',
                amount: 15000,
                color: '#3b82f6' // Blue
            },
            {
                service: 'Lamination',
                amount: 8500,
                color: '#10b981' // Emerald
            },
            {
                service: 'Binding',
                amount: 6200,
                color: '#f59e0b' // Amber
            },
            {
                service: 'Scanning',
                amount: 4800,
                color: '#8b5cf6' // Purple
            },
            {
                service: 'Typing Service',
                amount: 3200,
                color: '#ef4444' // Red
            },
            {
                service: 'Others',
                amount: 2500,
                color: '#6b7280' // Gray
            }
        ];
        
        return of(data);
    }

    /**
     * Generates KPI summary data
     * Returns calculated totals and percentages
     */
    private getKpiData(): Observable<any> {
        const kpis = {
            totalRevenue: 40200,
            totalExpenses: 12850,
            netProfit: 27350,
            totalTransactions: 1842
        };
        
        return of(kpis);
    }
}