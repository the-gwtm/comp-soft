import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData } from '../../models/dashboard.model';
import {
    Chart,
    ChartConfiguration,
    ChartType,
    registerables
} from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('dailyRevenueCanvas', { static: false }) dailyRevenueCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('monthlyRevenueCanvas', { static: false }) monthlyRevenueCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('serviceBreakdownCanvas', { static: false }) serviceBreakdownCanvas!: ElementRef<HTMLCanvasElement>;

    dashboardData$!: Observable<DashboardData>;
    dashboardData: DashboardData | null = null;
    isLoading = true;
    currentDate = new Date();

    // Chart instances for proper cleanup
    private dailyRevenueChart?: Chart;
    private monthlyRevenueChart?: Chart;
    private serviceBreakdownChart?: Chart;

    constructor(
        private dashboardService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngAfterViewInit(): void {
        // Charts will be initialized after data loads
    }

    ngOnDestroy(): void {
        this.destroyCharts();
    }

    /**
     * Loads dashboard data and initializes charts after data is received
     * Handles loading state and error scenarios
     */
    private loadDashboardData(): void {
        this.dashboardData$ = this.dashboardService.getDashboardData();
        this.dashboardData$.subscribe({
            next: (data) => {
                this.dashboardData = data;
                this.isLoading = false;
                // Trigger change detection to update the view
                this.cdr.detectChanges();
                // Initialize charts after view and data are ready
                setTimeout(() => this.initializeCharts(), 100);
            },
            error: (error) => {
                console.error('Error loading dashboard data:', error);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Initializes all Chart.js instances with responsive configuration
     * Uses modern Chart.js v4 syntax and clean styling
     */
    private initializeCharts(): void {
        if (!this.dashboardData) return;

        this.createDailyRevenueChart();
        this.createMonthlyRevenueChart();
        this.createServiceBreakdownChart();
    }

    /**
     * Creates a smooth line chart for daily revenue trends
     * Features curved lines, gradient fills, and responsive design
     */
    private createDailyRevenueChart(): void {
        if (!this.dailyRevenueCanvas?.nativeElement || !this.dashboardData?.charts.dailyRevenue) return;

        const ctx = this.dailyRevenueCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

        const config: any = {
            type: 'line' as ChartType,
            data: {
                labels: this.dashboardData.charts.dailyRevenue.map(item => {
                    const date = new Date(item.date);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Daily Revenue',
                    data: this.dashboardData.charts.dailyRevenue.map(item => item.amount),
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#3b82f6',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#f9fafb',
                        bodyColor: '#f9fafb',
                        borderColor: '#374151',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context:any) => `Revenue: ${this.formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#f3f4f6',
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11
                            },
                            callback: (value:any) => this.formatCurrency(value as number)
                        }
                    }
                }
            }
        };

        this.dailyRevenueChart = new Chart(ctx, config);
    }

    /**
     * Creates a modern bar chart for monthly revenue comparison
     * Features rounded bars and clean styling
     */
    private createMonthlyRevenueChart(): void {
        if (!this.monthlyRevenueCanvas?.nativeElement || !this.dashboardData?.charts.monthlyRevenue) return;

        const ctx = this.monthlyRevenueCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const config: any = {
            type: 'bar' as ChartType,
            data: {
                labels: this.dashboardData.charts.monthlyRevenue.map(item => item.month),
                datasets: [{
                    label: 'Monthly Revenue',
                    data: this.dashboardData.charts.monthlyRevenue.map(item => item.total),
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 0,
                    borderRadius: 3,
                    borderSkipped: true,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#f9fafb',
                        bodyColor: '#f9fafb',
                        borderColor: '#374151',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context:any) => `Revenue: ${this.formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#f3f4f6',
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11
                            },
                            callback: (value:any) => this.formatCurrency(value as number)
                        }
                    }
                }
            }
        };

        this.monthlyRevenueChart = new Chart(ctx, config);
    }

    /**
     * Creates a modern donut chart for service breakdown with center total
     * Features custom colors and clean legend styling
     */
    private createServiceBreakdownChart(): void {
        if (!this.serviceBreakdownCanvas?.nativeElement || !this.dashboardData?.charts.serviceBreakdown) return;

        const ctx = this.serviceBreakdownCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const totalRevenue = this.dashboardData.charts.serviceBreakdown
            .reduce((sum, item) => sum + item.amount, 0);

        const config: any = {
            type: 'doughnut' as ChartType,
            data: {
                labels: this.dashboardData.charts.serviceBreakdown.map(item => item.service),
                datasets: [{
                    data: this.dashboardData.charts.serviceBreakdown.map(item => item.amount),
                    backgroundColor: this.dashboardData.charts.serviceBreakdown.map(item => item.color),
                    borderWidth: 0,
                    // cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#f9fafb',
                        bodyColor: '#f9fafb',
                        borderColor: '#374151',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: (context:any) => {
                                const percentage = ((context.parsed / totalRevenue) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: (chart:any) => {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();
                    
                    const centerX = width / 2;
                    const centerY = height / 2;
                    
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Total revenue text
                    ctx.fillStyle = '#1f2937';
                    ctx.font = 'bold 18px sans-serif';
                    ctx.fillText(this.formatCurrency(totalRevenue), centerX, centerY - 10);
                    
                    // Label text
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '12px sans-serif';
                    ctx.fillText('Total Revenue', centerX, centerY + 15);
                    
                    ctx.restore();
                }
            }]
        };

        this.serviceBreakdownChart = new Chart(ctx, config);
    }

    /**
     * Formats numeric values as Indian Rupee currency
     * Handles large numbers with K/L suffixes for clean display
     */
    private formatCurrency(amount: number): string {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(0)}K`;
        } else {
            return `₹${amount.toFixed(0)}`;
        }
    }

    /**
     * Safely destroys all Chart.js instances to prevent memory leaks
     * Called during component cleanup
     */
    private destroyCharts(): void {
        if (this.dailyRevenueChart) {
            this.dailyRevenueChart.destroy();
            this.dailyRevenueChart = undefined;
        }
        if (this.monthlyRevenueChart) {
            this.monthlyRevenueChart.destroy();
            this.monthlyRevenueChart = undefined;
        }
        if (this.serviceBreakdownChart) {
            this.serviceBreakdownChart.destroy();
            this.serviceBreakdownChart = undefined;
        }
    }

    /**
     * Gets service breakdown data for legend display
     * Returns formatted data for template consumption
     */
    getServiceLegendData() {
        if (!this.dashboardData?.charts.serviceBreakdown) return [];
        
        const total = this.dashboardData.charts.serviceBreakdown
            .reduce((sum, item) => sum + item.amount, 0);
        
        return this.dashboardData.charts.serviceBreakdown.map(item => ({
            ...item,
            percentage: ((item.amount / total) * 100).toFixed(1),
            formattedAmount: this.formatCurrency(item.amount)
        }));
    }

    // Action handlers for quick action buttons
    onAddSale() { console.log('Add Sale Clicked'); }
    onAddExpense() { console.log('Add Expense Clicked'); }
    onUpdateInventory() { console.log('Update Inventory Clicked'); }
    onAddCustomer() { console.log('Add Customer Clicked'); }
}
