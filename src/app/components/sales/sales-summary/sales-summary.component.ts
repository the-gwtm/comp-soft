import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesService } from '../../../services/sales.service';
import { Sale } from '../../../models/sale.model';
import { ServiceType } from '../../../models/service-type.model';
import { SalesKPI, ServiceSummary } from '../../../models/service-summary.model';
import { combineLatest, startWith } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule, NgSelectComponent],
  templateUrl: './sales-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesSummaryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesService = inject(SalesService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  // Chart instances
  private serviceDistributionChart?: Chart;
  private salesTrendChart?: Chart;

  filterForm!: FormGroup;
  serviceTypes = signal<ServiceType[]>([]);
  isLoading = signal<boolean>(true);

  // Data Signals
  kpis = signal<SalesKPI>({
    totalSalesCount: 0,
    totalRevenue: 0,
    averageSaleValue: 0,
    highestSaleValue: 0
  });

  serviceSummaries = signal<ServiceSummary[]>([]);

  // Raw Data
  private allSales: Sale[] = [];

  ngOnInit(): void {
    // Register Chart.js components
    Chart.register(...registerables);
    
    this.initFilterForm();
    this.loadData();
    this.setupFilters();
  }

  private initFilterForm(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm = this.fb.group({
      dateFrom: [this.formatDate(firstDay)],
      dateTo: [this.formatDate(today)],
      serviceType: [null],
      search: ['']
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadData(): void {
    this.isLoading.set(true);

    combineLatest([
      this.salesService.getServiceTypes(),
      this.salesService.getSalesList()
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([types, sales]) => {
          this.serviceTypes.set(types);
          this.allSales = sales;
          this.applyFilters(this.filterForm.value);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.isLoading.set(false);
        }
      });
  }

  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(filters => {
        this.applyFilters(filters);
      });
  }

  setQuickFilter(type: 'today' | 'week' | 'month'): void {
    const today = new Date();
    let fromDate = new Date();
    const toDate = new Date();

    switch (type) {
      case 'today':
        fromDate = today;
        break;
      case 'week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        fromDate = new Date(today.setDate(diff));
        break;
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }

    this.filterForm.patchValue({
      dateFrom: this.formatDate(fromDate),
      dateTo: this.formatDate(toDate)
    });
  }

  private applyFilters(filters: any): void {
    let filteredSales = [...this.allSales];

    // Date Range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filteredSales = filteredSales.filter(s => new Date(s.dateCreated) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredSales = filteredSales.filter(s => new Date(s.dateCreated) <= toDate);
    }

    // Service Type
    if (filters.serviceType) {
      filteredSales = filteredSales.filter(s => s.serviceType.id === filters.serviceType);
    }

    // Search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filteredSales = filteredSales.filter(s =>
        s.serviceType.name.toLowerCase().includes(term) ||
        (s.notes && s.notes.toLowerCase().includes(term))
      );
    }

    this.calculateMetrics(filteredSales);
    
    // Update charts after data changes
    setTimeout(() => {
      this.createCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  getServiceTypeColor(serviceName: string): string {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-gray-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) {
      hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  private calculateMetrics(sales: Sale[]): void {
    // 1. Calculate KPIs
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCount = sales.length;
    const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0;
    const highestValue = sales.reduce((max, s) => Math.max(max, s.total), 0);

    this.kpis.set({
      totalSalesCount: totalCount,
      totalRevenue: totalRevenue,
      averageSaleValue: avgValue,
      highestSaleValue: highestValue
    });

    // 2. Calculate Service Summaries
    const summaryMap = new Map<string, ServiceSummary>();

    sales.forEach(sale => {
      const serviceName = sale.serviceType.name;
      if (!summaryMap.has(serviceName)) {
        summaryMap.set(serviceName, {
          serviceName,
          totalQuantity: 0,
          totalRevenue: 0,
          averageRate: 0,
          contributionPercentage: 0
        });
      }

      const summary = summaryMap.get(serviceName)!;
      summary.totalQuantity += sale.quantity;
      summary.totalRevenue += sale.total;
    });

    const summaries = Array.from(summaryMap.values()).map(s => ({
      ...s,
      averageRate: s.totalQuantity > 0 ? s.totalRevenue / s.totalQuantity : 0,
      contributionPercentage: totalRevenue > 0 ? (s.totalRevenue / totalRevenue) * 100 : 0
    }));

    // Sort by revenue descending
    summaries.sort((a, b) => b.totalRevenue - a.totalRevenue);

    this.serviceSummaries.set(summaries);
  }

  private createCharts(): void {
    this.createServiceDistributionChart();
    this.createSalesTrendChart();
  }

  private createServiceDistributionChart(): void {
    const canvas = document.getElementById('serviceDistributionChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    if (this.serviceDistributionChart) {
      this.serviceDistributionChart.destroy();
    }

    const summaries = this.serviceSummaries();
    if (summaries.length === 0) return;

    const ctx = canvas.getContext('2d')!;
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: summaries.map(s => s.serviceName),
        datasets: [{
          data: summaries.map(s => s.totalRevenue),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',   // Blue
            'rgba(16, 185, 129, 0.8)',   // Green
            'rgba(139, 92, 246, 0.8)',   // Purple
            'rgba(245, 101, 101, 0.8)',  // Red
            'rgba(251, 191, 36, 0.8)',   // Yellow
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(14, 165, 233, 0.8)',   // Light Blue
            'rgba(34, 197, 94, 0.8)',    // Light Green
            'rgba(168, 85, 247, 0.8)',   // Light Purple
            'rgba(156, 163, 175, 0.8)'   // Gray
          ],
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 2,
          hoverBackgroundColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(245, 101, 101, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(156, 163, 175, 1)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const total = summaries.reduce((sum, s) => sum + s.totalRevenue, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        },
        // cutout: '60%'
      }
    };

    this.serviceDistributionChart = new Chart(ctx, config);
  }

  private createSalesTrendChart(): void {
    const canvas = document.getElementById('salesTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    if (this.salesTrendChart) {
      this.salesTrendChart.destroy();
    }

    const ctx = canvas.getContext('2d')!;
    
    // Get trend data from filtered sales
    const trendData = this.getSalesTrendData();
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [{
          label: 'Sales Revenue',
          data: trendData.revenue,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }, {
          label: 'Sales Count',
          data: trendData.count,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y1'
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
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context:any) => {
                if (context.datasetIndex === 0) {
                  return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
                } else {
                  return `Count: ${context.parsed.y} sales`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '₹' + Number(value).toLocaleString();
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Sales Count'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    };

    this.salesTrendChart = new Chart(ctx, config);
  }

  private getSalesTrendData(): { labels: string[], revenue: number[], count: number[] } {
    const filters = this.filterForm.value;
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
    
    // Calculate the number of days between dates
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyData = new Map<string, { revenue: number, count: number }>();
    
    // Initialize all days with zero values
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(fromDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, { revenue: 0, count: 0 });
    }
    
    // Aggregate sales data by day
    this.allSales.forEach(sale => {
      const saleDate = new Date(sale.dateCreated);
      if (saleDate >= fromDate && saleDate <= toDate) {
        const dateStr = saleDate.toISOString().split('T')[0];
        const existing = dailyData.get(dateStr) || { revenue: 0, count: 0 };
        existing.revenue += sale.total;
        existing.count += 1;
        dailyData.set(dateStr, existing);
      }
    });
    
    const sortedEntries = Array.from(dailyData.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    return {
      labels: sortedEntries.map(([date]) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      revenue: sortedEntries.map(([, data]) => data.revenue),
      count: sortedEntries.map(([, data]) => data.count)
    };
  }

  ngOnDestroy(): void {
    if (this.serviceDistributionChart) {
      this.serviceDistributionChart.destroy();
    }
    if (this.salesTrendChart) {
      this.salesTrendChart.destroy();
    }
  }
}
