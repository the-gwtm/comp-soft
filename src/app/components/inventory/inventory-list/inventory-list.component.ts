import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InventoryService } from '../../../services/inventory.service';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../../models/inventory-item.model';
import { startWith } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule, RippleModule, TooltipModule],
  templateUrl: './inventory-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private destroyRef = inject(DestroyRef);

  filterForm!: FormGroup;
  inventoryItems = signal<InventoryItem[]>([]);
  filteredItems = signal<InventoryItem[]>([]);
  isLoading = signal<boolean>(true);

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

  ngOnInit(): void {
    this.initFilterForm();
    this.loadData();
    this.setupFilters();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      category: [null],
      unit: [null]
    });
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.inventoryService.getInventoryList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.inventoryItems.set(data);
          this.filteredItems.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading inventory', err);
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
    let result = this.inventoryItems();

    // Text Search (Item Name or Notes)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm))
      );
    }

    // Category Filter
    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }

    // Unit Filter
    if (filters.unit) {
      result = result.filter(item => item.unit === filters.unit);
    }

    this.filteredItems.set(result);
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Paper': 'bg-blue-500',
      'Toner': 'bg-purple-500', 
      'Ink': 'bg-indigo-500',
      'Photo Paper': 'bg-pink-500',
      'Stationery': 'bg-green-500',
      'Other': 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  }

  getCategoryBadgeColor(category: string): string {
    const colors: Record<string, string> = {
      'Paper': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'Toner': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      'Ink': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      'Photo Paper': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
      'Stationery': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
  }

  getStockLevelColor(item: InventoryItem): string {
    if (this.isLowStock(item)) {
      return 'text-red-600 dark:text-red-400';
    } else if (item.quantity > (item.reorderLevel || 0) * 2) {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-gray-900 dark:text-gray-200';
  }

  isLowStock(item: InventoryItem): boolean {
    return item.reorderLevel ? item.quantity <= item.reorderLevel : false;
  }

  getLowStockItems(): InventoryItem[] {
    return this.filteredItems().filter(item => this.isLowStock(item));
  }

  deleteItem(item: InventoryItem): void {
    if (confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
      // Implement delete logic here
      console.log('Deleting item:', item);
    }
  }
}
