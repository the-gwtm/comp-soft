import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { InventoryService } from '../../../services/inventory.service';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../../models/inventory-item.model';

@Component({
  selector: 'app-update-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './update-inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateInventoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  inventoryForm: FormGroup;
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  itemId: string | null = null;

  readonly categories: InventoryCategory[] = [
    'Paper',
    'Toner',
    'Ink',
    'Photo Paper',
    'Stationery',
    'Other'
  ];

  readonly units: InventoryUnit[] = [
    'Packets',
    'Boxes',
    'Liters',
    'Pcs',
    'Rolls'
  ];

  constructor() {
    this.inventoryForm = this.buildForm();
  }

  ngOnInit(): void {
    // Check if we are editing an existing item
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.itemId = params.get('id');
        if (this.itemId) {
          this.loadItem(this.itemId);
        }
      });
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      itemName: ['', [Validators.required]],
      category: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unit: [null, [Validators.required]],
      reorderLevel: [null, [Validators.min(0)]],
      notes: ['']
    });
  }

  private loadItem(id: string): void {
    this.isLoading.set(true);
    this.inventoryService.getItemById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(item => {
        if (item) {
          this.patchFormValues(item);
        } else {
          // Handle item not found
          console.error('Item not found');
          this.router.navigate(['/inventory/list']);
        }
      });
  }

  private patchFormValues(item: InventoryItem): void {
    this.inventoryForm.patchValue({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      notes: item.notes
    });
  }

  onSubmit(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.inventoryForm.getRawValue();

    const item: InventoryItem = {
      id: this.itemId || undefined, // undefined for new items
      itemName: formValue.itemName,
      category: formValue.category,
      quantity: formValue.quantity,
      unit: formValue.unit,
      reorderLevel: formValue.reorderLevel,
      notes: formValue.notes
    };

    this.inventoryService.updateInventory(item)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/inventory/list']);
        },
        error: (err) => {
          console.error('Error updating inventory', err);
          // Handle error
        }
      });
  }

  resetForm(): void {
    if (this.itemId) {
      // If editing, reload original data
      this.loadItem(this.itemId);
    } else {
      // If creating new, clear form
      this.inventoryForm.reset();
    }
  }

  cancel(): void {
    this.router.navigate(['/inventory/list']);
  }
}
