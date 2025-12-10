import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { ExpenseService } from '../../../services/expense.service';
import { Expense, ExpenseCategory, PaymentMethod } from '../../../models/expense.model';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-expense.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddExpenseComponent {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  expenseForm: FormGroup;
  isSaving = signal<boolean>(false);

  readonly categories: ExpenseCategory[] = [
    'Rent',
    'Electricity',
    'Internet',
    'Printing Materials',
    'Maintenance',
    'Staff Salary',
    'Miscellaneous'
  ];

  readonly paymentMethods: PaymentMethod[] = [
    'Cash',
    'UPI',
    'Bank Transfer',
    'Card'
  ];

  constructor() {
    this.expenseForm = this.buildForm();
  }

  private buildForm(): FormGroup {
    const today = new Date().toISOString().split('T')[0];

    return this.fb.group({
      expenseDate: [today, [Validators.required]],
      category: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: [null, [Validators.required]],
      notes: [''],
      attachment: [null] // Placeholder for file upload
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.expenseForm.getRawValue();

    const expense: Expense = {
      expenseDate: new Date(formValue.expenseDate),
      category: formValue.category,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      notes: formValue.notes
      // attachment handling would go here
    };

    this.expenseService.addExpense(expense)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          // Navigate to list or show success. 
          // Assuming /expenses/list exists or just /expenses
          this.router.navigate(['/expenses/list']);
        },
        error: (err) => {
          console.error('Error adding expense', err);
          // Handle error (e.g., show toast)
        }
      });
  }

  resetForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.expenseForm.reset({
      expenseDate: today,
      category: null,
      amount: null,
      paymentMethod: null,
      notes: '',
      attachment: null
    });
  }
}
