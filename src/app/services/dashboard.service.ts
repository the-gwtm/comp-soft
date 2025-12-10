import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { 
    DashboardData, 
    KpiCard, 
    RecentActivity, 
    DailyRevenue, 
    MonthlyRevenue, 
    ServiceBreakdown,
    ChartDataSets 
} from '../models/dashboard.model';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    constructor() { }

    /**
     * Fetches complete dashboard data including KPIs, activities, and chart datasets
     * Uses forkJoin to combine all data sources and simulate API delay
     */
    getDashboardData(): Observable<DashboardData> {
        return forkJoin({
            kpis: this.getKpiData(),
            recentActivities: this.getRecentActivities(),
            charts: this.getChartData()
        }).pipe(
            delay(800) // Simulate API delay for loading state
        );
    }

    /**
     * Generates daily revenue data for the last 15 days
     * Returns mock data structured for line chart consumption
     */
    getDailyRevenue(): Observable<DailyRevenue[]> {
        const dailyData: DailyRevenue[] = [];
        const today = new Date();
        
        for (let i = 14; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Generate realistic revenue data with some variance
            const baseAmount = 3000 + Math.random() * 2000;
            const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.7 : 1;
            
            dailyData.push({
                date: date.toISOString().split('T')[0],
                amount: Math.round(baseAmount * weekendMultiplier)
            });
        }
        
        return of(dailyData);
    }

    /**
     * Generates monthly revenue data for the last 3 months
     * Returns mock data structured for bar chart consumption
     */
    getMonthlyRevenue(): Observable<MonthlyRevenue[]> {
        const monthlyData: MonthlyRevenue[] = [];
        const currentDate = new Date();
        
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        for (let i = 2; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);
            
            // Generate seasonal revenue patterns
            const baseAmount = 35000 + Math.random() * 10000;
            const seasonalMultiplier = [11, 0, 1].includes(date.getMonth()) ? 1.2 : 1; // Holiday season boost
            
            monthlyData.push({
                month: months[date.getMonth()],
                total: Math.round(baseAmount * seasonalMultiplier)
            });
        }
        
        return of(monthlyData);
    }

    /**
     * Generates service breakdown data for pie/donut chart
     * Returns mock data with predefined service categories and colors
     */
    getServiceBreakdown(): Observable<ServiceBreakdown[]> {
        const serviceData: ServiceBreakdown[] = [
            {
                service: 'Xerox & Print',
                amount: 18000,
                color: '#3b82f6' // Blue
            },
            {
                service: 'Lamination',
                amount: 12000,
                color: '#10b981' // Emerald
            },
            {
                service: 'Binding',
                amount: 8000,
                color: '#f59e0b' // Amber
            },
            {
                service: 'Scanning',
                amount: 6000,
                color: '#8b5cf6' // Purple
            },
            {
                service: 'Others',
                amount: 4000,
                color: '#6b7280' // Gray
            }
        ];
        
        return of(serviceData);
    }

    /**
     * Combines all chart data sources using forkJoin for parallel loading
     * Structures data for component consumption
     */
    private getChartData(): Observable<ChartDataSets> {
        return forkJoin({
            dailyRevenue: this.getDailyRevenue(),
            monthlyRevenue: this.getMonthlyRevenue(),
            serviceBreakdown: this.getServiceBreakdown()
        });
    }

    /**
     * Generates KPI card data for dashboard header
     * Returns mock data with trend indicators
     */
    private getKpiData(): Observable<KpiCard[]> {
        const kpiData: KpiCard[] = [
            {
                title: "Today's Income",
                value: '₹4,250',
                subtext: '+15% vs yesterday',
                trend: 'up',
                icon: 'currency-rupee',
                colorClass: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
            },
            {
                title: "Today's Expenses",
                value: '₹1,800',
                subtext: '-5% vs yesterday',
                trend: 'down',
                icon: 'shopping-cart',
                colorClass: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
            },
            {
                title: "Today's Profit",
                value: '₹2,450',
                subtext: '+22% vs yesterday',
                trend: 'up',
                icon: 'trending-up',
                colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
            },
            {
                title: "Month's Income",
                value: '₹48,500',
                subtext: '+8% vs last month',
                trend: 'up',
                icon: 'calendar',
                colorClass: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
            }
        ];
        
        return of(kpiData);
    }

    /**
     * Generates recent activity feed data
     * Returns mock transaction and alert data
     */
    private getRecentActivities(): Observable<RecentActivity[]> {
        const activities: RecentActivity[] = [
            {
                id: '1',
                type: 'sale',
                description: 'Xerox copies - 200 pages',
                amount: '₹400',
                date: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
                status: 'completed'
            },
            {
                id: '2',
                type: 'expense',
                description: 'Paper purchase - A4 sheets',
                amount: '₹1,200',
                date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                status: 'completed'
            },
            {
                id: '3',
                type: 'sale',
                description: 'Document binding service',
                amount: '₹150',
                date: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
                status: 'completed'
            },
            {
                id: '4',
                type: 'alert',
                description: 'Low stock alert - A4 paper',
                date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
                status: 'warning'
            },
            {
                id: '5',
                type: 'sale',
                description: 'Lamination - 5 documents',
                amount: '₹250',
                date: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
                status: 'completed'
            }
        ];
        
        return of(activities);
    }
}
//                 {
//                     id: '1',
//                     type: 'sale',
//                     description: 'Xerox & Printout (50 pages)',
//                     amount: '₹250',
//                     date: new Date(),
//                     status: 'completed'
//                 },
//                 {
//                     id: '2',
//                     type: 'expense',
//                     description: 'Paper Bundle Purchase (A4)',
//                     amount: '₹1,200',
//                     date: new Date(),
//                     status: 'completed'
//                 },
//                 {
//                     id: '3',
//                     type: 'sale',
//                     description: 'Lamination (5 docs)',
//                     amount: '₹150',
//                     date: new Date(),
//                     status: 'completed'
//                 },
//                 {
//                     id: '4',
//                     type: 'alert',
//                     description: 'Low Ink Warning (Black Cartridge)',
//                     date: new Date(),
//                     status: 'warning'
//                 },
//                 {
//                     id: '5',
//                     type: 'sale',
//                     description: 'Typing Service (Resume)',
//                     amount: '₹100',
//                     date: new Date(),
//                     status: 'completed'
//                 }
//             ],
//             chartDataPlaceholder: true
//         };

//         // Simulate network delay
//         return of(mockData).pipe(delay(500));
//     }
// }
