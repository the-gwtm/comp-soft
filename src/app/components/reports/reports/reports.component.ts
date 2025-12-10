import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { ReportsService, ReportsData } from '../../../services/reports.service';
import {
    Chart,
    ChartConfiguration,
    ChartType,
    registerables
} from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('revenueExpenseCanvas', { static: false }) revenueExpenseCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('serviceDistributionCanvas', { static: false }) serviceDistributionCanvas!: ElementRef<HTMLCanvasElement>;

    reportsData$!: Observable<ReportsData>;
    reportsData: ReportsData | null = null;
    isLoading = true;

    // Chart instances for proper cleanup
    private revenueExpenseChart?: Chart;
    private serviceDistributionChart?: Chart;

    constructor(
        private reportsService: ReportsService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadReportsData();
    }

    ngAfterViewInit(): void {
        // Charts will be initialized after data loads
    }

    ngOnDestroy(): void {
        this.destroyCharts();
    }

    /**
     * Loads reports data and initializes charts after data is received
     * Handles loading state and error scenarios
     */
    private loadReportsData(): void {
        this.reportsData$ = this.reportsService.getReportsData();
        this.reportsData$.subscribe({
            next: (data) => {
                this.reportsData = data;
                this.isLoading = false;
                this.cdr.detectChanges();
                // Initialize charts after view and data are ready
                setTimeout(() => this.initializeCharts(), 100);
            },
            error: (error) => {
                console.error('Error loading reports data:', error);
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
        if (!this.reportsData) return;

        this.createRevenueExpenseChart();
        this.createServiceDistributionChart();
    }

    /**
     * Creates a dual-bar chart comparing revenue vs expenses
     * Features side-by-side bars with different colors
     */
    private createRevenueExpenseChart(): void {
        if (!this.revenueExpenseCanvas?.nativeElement || !this.reportsData?.revenueExpense) return;

        const ctx = this.revenueExpenseCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const config: any = {
            type: 'bar' as ChartType,
            data: {
                labels: this.reportsData.revenueExpense.map(item => item.date),
                datasets: [
                    {
                        label: 'Revenue',
                        data: this.reportsData.revenueExpense.map(item => item.revenue),
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 0,
                        borderRadius: 6,
                        borderSkipped: false,
                        barThickness: 20
                    },
                    {
                        label: 'Expenses',
                        data: this.reportsData.revenueExpense.map(item => item.expense),
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 0,
                        borderRadius: 6,
                        borderSkipped: false,
                        barThickness: 20
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: '#374151',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
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
                            label: (context: any) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
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
                            callback: (value: any) => this.formatCurrency(value as number)
                        }
                    }
                }
            }
        };

        this.revenueExpenseChart = new Chart(ctx, config);
    }

    /**
     * Creates a modern donut chart for service distribution
     * Features custom colors and center total display
     */
    private createServiceDistributionChart(): void {
        if (!this.serviceDistributionCanvas?.nativeElement || !this.reportsData?.serviceDistribution) return;

        const ctx = this.serviceDistributionCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const totalRevenue = this.reportsData.serviceDistribution
            .reduce((sum, item) => sum + item.amount, 0);

        const config: any = {
            type: 'doughnut' as ChartType,
            data: {
                labels: this.reportsData.serviceDistribution.map(item => item.service),
                datasets: [{
                    data: this.reportsData.serviceDistribution.map(item => item.amount),
                    backgroundColor: this.reportsData.serviceDistribution.map(item => item.color),
                    borderWidth: 0,
                    cutout: '65%'
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
                            label: (context: any) => {
                                const percentage = ((context.parsed / totalRevenue) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: (chart: any) => {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();
                    
                    const centerX = width / 2;
                    const centerY = height / 2;
                    
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Total revenue text
                    ctx.fillStyle = '#1f2937';
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillText(this.formatCurrency(totalRevenue), centerX, centerY - 8);
                    
                    // Label text
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '11px sans-serif';
                    ctx.fillText('Total Revenue', centerX, centerY + 12);
                    
                    ctx.restore();
                }
            }]
        };

        this.serviceDistributionChart = new Chart(ctx, config);
    }

    /**
     * Formats numeric values as Indian Rupee currency
     * Handles large numbers with K suffix for clean display
     */
    private formatCurrency(amount: number): string {
        if (amount >= 1000) {
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
        if (this.revenueExpenseChart) {
            this.revenueExpenseChart.destroy();
            this.revenueExpenseChart = undefined;
        }
        if (this.serviceDistributionChart) {
            this.serviceDistributionChart.destroy();
            this.serviceDistributionChart = undefined;
        }
    }

    /**
     * Gets service distribution data for legend display
     * Returns formatted data for template consumption
     */
    getServiceLegendData() {
        if (!this.reportsData?.serviceDistribution) return [];
        
        const total = this.reportsData.serviceDistribution
            .reduce((sum, item) => sum + item.amount, 0);
        
        return this.reportsData.serviceDistribution.map(item => ({
            ...item,
            percentage: ((item.amount / total) * 100).toFixed(1),
            formattedAmount: this.formatCurrency(item.amount)
        }));
    }

    /**
     * Formats KPI values with proper currency formatting
     */
    formatKpiValue(amount: number): string {
        return this.formatCurrency(amount);
    }
}
