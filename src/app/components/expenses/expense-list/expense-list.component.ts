import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpenseService } from '../../../services/expense.service';
import { Expense, ExpenseCategory } from '../../../models/expense.model';
import { startWith } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule, RippleModule, TooltipModule],
  templateUrl: './expense-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private destroyRef = inject(DestroyRef);

  filterForm!: FormGroup;
  expenses = signal<Expense[]>([]);
  filteredExpenses = signal<Expense[]>([]);
  isLoading = signal<boolean>(true);

  readonly categories: ExpenseCategory[] = [
    'Rent',
    'Electricity',
    'Internet',
    'Printing Materials',
    'Maintenance',
    'Staff Salary',
    'Miscellaneous'
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadData();
    this.setupFilters();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      category: [null],
      dateFrom: [null],
      dateTo: [null]
    });
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.expenseService.getExpenses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.expenses.set(data);
          this.filteredExpenses.set(data);
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

  private applyFilters(filters: any): void {
    let result = this.expenses();

    // Text Search (Notes)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(expense =>
        (expense.notes && expense.notes.toLowerCase().includes(searchTerm))
      );
    }

    // Category Filter
    if (filters.category) {
      result = result.filter(expense => expense.category === filters.category);
    }

    // Date Range Filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(expense => new Date(expense.expenseDate) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(expense => new Date(expense.expenseDate) <= toDate);
    }

    this.filteredExpenses.set(result);
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  deleteExpense(expense: Expense): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      // Implement delete logic here
      console.log('Deleting expense:', expense);
    }
  }
}
