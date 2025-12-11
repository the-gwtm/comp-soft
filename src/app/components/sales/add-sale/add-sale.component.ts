import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesService } from '../../../services/sales.service';
import { ServiceType } from '../../../models/service-type.model';
import { Sale } from '../../../models/sale.model';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-add-sale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgSelectModule],
  templateUrl: './add-sale.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSaleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesService = inject(SalesService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  saleForm!: FormGroup;
  serviceTypes = signal<ServiceType[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadServiceTypes();
    this.setupValueChanges();
  }

  private initForm(): void {
    this.saleForm = this.fb.group({
      serviceType: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      total: [{ value: 0, disabled: true }],
      notes: ['']
    });
  }

  private loadServiceTypes(): void {
    this.isLoading.set(true);
    this.salesService.getServiceTypes()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(types => {
        this.serviceTypes.set(types);
      });
  }

  private setupValueChanges(): void {
    // Update rate when service type changes
    this.saleForm.get('serviceType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((serviceTypeId: string) => {
        const selectedService = this.serviceTypes().find(s => s.id === serviceTypeId);
        if (selectedService) {
          this.saleForm.patchValue({ rate: selectedService.defaultRate }, { emitEvent: true }); // emit to trigger total calc
        }
      });

    // Calculate total when quantity or rate changes
    this.saleForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        const qty = val.quantity || 0;
        const rate = val.rate || 0;
        const total = qty * rate;

        // Only patch if different to avoid loops
        if (this.saleForm.get('total')?.value !== total) {
          this.saleForm.get('total')?.setValue(total, { emitEvent: false });
        }
      });
  }

  saveSale(): void {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.saleForm.getRawValue(); // getRawValue to include disabled 'total'

    // Find full service object
    const selectedService = this.serviceTypes().find(s => s.id === formValue.serviceType);

    const sale: Sale = {
      serviceType: selectedService!, // We know it exists because of validation
      quantity: formValue.quantity,
      rate: formValue.rate,
      total: formValue.total,
      notes: formValue.notes,
      dateCreated: new Date()
    };

    this.salesService.saveSale(sale)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.apiService.showMessage('success', 'Success', 'Sale record saved successfully.');
          this.resetForm();
        },
        error: (err) => {
          console.error('Error saving sale', err);
          this.apiService.showMessage('error', 'Error', 'Failed to save sale record.');
          // Handle error (toast notification etc)
        }
      });
  }

  resetForm(): void {
    this.saleForm.reset({
      quantity: 1,
      rate: 0,
      total: 0,
      notes: ''
    });
  }

  cancel(): void {
    this.router.navigate(['/sales']);
  }
}
