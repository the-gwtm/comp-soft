import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpenseService } from '../../../services/expense.service';
import { Expense, ExpenseCategory } from '../../../models/expense.model';
import { ExpenseCategorySummary, ExpenseKPI } from '../../../models/expense-summary.model';
import { startWith } from 'rxjs';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-expense-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule],
  templateUrl: './expense-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseSummaryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private destroyRef = inject(DestroyRef);

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
}
