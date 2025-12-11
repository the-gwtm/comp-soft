import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpenseService } from '../../../services/expense.service';
import { Expense, ExpenseCategory } from '../../../models/expense.model';
import { ExpenseCategorySummary, ExpenseKPI } from '../../../models/expense-summary.model';
import { startWith } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-expense-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule, NgSelectComponent],
  templateUrl: './expense-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseSummaryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  // Chart instances
  private categoryDistributionChart?: Chart;
  private expenseTrendChart?: Chart;

  filterForm!: FormGroup;
  isLoading = signal<boolean>(true);

  // Data Signals
  kpis = signal<ExpenseKPI>({
    totalCount: 0,
    totalAmount: 0,
    highestAmount: 0,
    averageAmount: 0
  });

  categorySummaries = signal<ExpenseCategorySummary[]>([]);

  readonly categories: ExpenseCategory[] = [
    'Rent',
    'Electricity',
    'Internet',
    'Printing Materials',
    'Maintenance',
    'Staff Salary',
    'Miscellaneous'
  ];

  private allExpenses: Expense[] = [];

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
      category: [null],
      search: ['']
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.expenseService.getExpenses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allExpenses = data;
          this.applyFilters(this.filterForm.value);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading expenses', err);
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
    let filtered = [...this.allExpenses];

    // Date Range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => new Date(e.expenseDate) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => new Date(e.expenseDate) <= toDate);
    }

    // Category
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    // Search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        (e.notes && e.notes.toLowerCase().includes(term))
      );
    }

    this.calculateMetrics(filtered);
    
    // Update charts after data changes
    setTimeout(() => {
      this.createCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Rent': 'bg-blue-500',
      'Electricity': 'bg-yellow-500',
      'Internet': 'bg-purple-500',
      'Printing Materials': 'bg-green-500',
      'Maintenance': 'bg-orange-500',
      'Staff Salary': 'bg-indigo-500',
      'Miscellaneous': 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  }

  getCategoryBadgeColor(category: string): string {
    const colors: Record<string, string> = {
      'Rent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'Electricity': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      'Internet': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      'Printing Materials': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      'Maintenance': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      'Staff Salary': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      'Miscellaneous': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
  }

  private calculateMetrics(expenses: Expense[]): void {
    // 1. Calculate KPIs
    const totalCount = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    const highestAmount = expenses.reduce((max, e) => Math.max(max, e.amount), 0);

    this.kpis.set({
      totalCount,
      totalAmount,
      averageAmount,
      highestAmount
    });

    // 2. Calculate Category Summaries
    const summaryMap = new Map<string, ExpenseCategorySummary>();

    expenses.forEach(e => {
      if (!summaryMap.has(e.category)) {
        summaryMap.set(e.category, {
          category: e.category,
          count: 0,
          totalAmount: 0,
          averageAmount: 0,
          percentage: 0
        });
      }

      const summary = summaryMap.get(e.category)!;
      summary.count++;
      summary.totalAmount += e.amount;
    });

    const summaries = Array.from(summaryMap.values()).map(s => ({
      ...s,
      averageAmount: s.count > 0 ? s.totalAmount / s.count : 0,
      percentage: totalAmount > 0 ? (s.totalAmount / totalAmount) * 100 : 0
    }));

    // Sort by total amount descending
    summaries.sort((a, b) => b.totalAmount - a.totalAmount);

    this.categorySummaries.set(summaries);
  }

  private createCharts(): void {
    this.createCategoryDistributionChart();
    this.createExpenseTrendChart();
  }

  private createCategoryDistributionChart(): void {
    const canvas = document.getElementById('categoryDistributionChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    if (this.categoryDistributionChart) {
      this.categoryDistributionChart.destroy();
    }

    const summaries = this.categorySummaries();
    if (summaries.length === 0) return;

    const ctx = canvas.getContext('2d')!;
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: summaries.map(s => s.category),
        datasets: [{
          data: summaries.map(s => s.totalAmount),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',    // Red
            'rgba(245, 158, 11, 0.8)',   // Amber
            'rgba(139, 92, 246, 0.8)',   // Purple
            'rgba(16, 185, 129, 0.8)',   // Green
            'rgba(249, 115, 22, 0.8)',   // Orange
            'rgba(99, 102, 241, 0.8)',   // Indigo
            'rgba(107, 114, 128, 0.8)',  // Gray
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(14, 165, 233, 0.8)',   // Sky
            'rgba(34, 197, 94, 0.8)'     // Emerald
          ],
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 2,
          hoverBackgroundColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(99, 102, 241, 1)',
            'rgba(107, 114, 128, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(34, 197, 94, 1)'
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
                const total = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        },
        // cutout: '60%'
      }
    };

    this.categoryDistributionChart = new Chart(ctx, config);
  }

  private createExpenseTrendChart(): void {
    const canvas = document.getElementById('expenseTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    if (this.expenseTrendChart) {
      this.expenseTrendChart.destroy();
    }

    const ctx = canvas.getContext('2d')!;
    
    // Get trend data from filtered expenses
    const trendData = this.getExpenseTrendData();
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [{
          label: 'Daily Expenses',
          data: trendData.expenses,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }, {
          label: 'Expense Count',
          data: trendData.count,
          borderColor: 'rgba(245, 158, 11, 1)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgba(245, 158, 11, 1)',
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
                  return `Expenses: ₹${context.parsed.y.toLocaleString()}`;
                } else {
                  return `Count: ${context.parsed.y} expenses`;
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
              text: 'Expense Amount (₹)'
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
              text: 'Expense Count'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    };

    this.expenseTrendChart = new Chart(ctx, config);
  }

  private getExpenseTrendData(): { labels: string[], expenses: number[], count: number[] } {
    const filters = this.filterForm.value;
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
    
    // Calculate the number of days between dates
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyData = new Map<string, { expenses: number, count: number }>();
    
    // Initialize all days with zero values
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(fromDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, { expenses: 0, count: 0 });
    }
    
    // Aggregate expense data by day
    this.allExpenses.forEach(expense => {
      const expenseDate = new Date(expense.expenseDate);
      if (expenseDate >= fromDate && expenseDate <= toDate) {
        const dateStr = expenseDate.toISOString().split('T')[0];
        const existing = dailyData.get(dateStr) || { expenses: 0, count: 0 };
        existing.expenses += expense.amount;
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
      expenses: sortedEntries.map(([, data]) => data.expenses),
      count: sortedEntries.map(([, data]) => data.count)
    };
  }

  ngOnDestroy(): void {
    if (this.categoryDistributionChart) {
      this.categoryDistributionChart.destroy();
    }
    if (this.expenseTrendChart) {
      this.expenseTrendChart.destroy();
    }
  }
}
