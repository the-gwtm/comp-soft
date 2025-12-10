import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesService } from '../../../services/sales.service';
import { Sale } from '../../../models/sale.model';
import { ServiceType } from '../../../models/service-type.model';
import { combineLatest, Observable, startWith, map } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule, RippleModule, TooltipModule],
  templateUrl: './sales-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesService = inject(SalesService);
  private destroyRef = inject(DestroyRef);

  filterForm!: FormGroup;
  serviceTypes = signal<ServiceType[]>([]);
  sales = signal<Sale[]>([]);
  filteredSales = signal<Sale[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.initFilterForm();
    this.loadData();
    this.setupFilters();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      serviceType: [null],
      dateFrom: [null],
      dateTo: [null]
    });
  }

  private loadData(): void {
    this.isLoading.set(true);

    // Load service types and sales in parallel
    combineLatest([
      this.salesService.getServiceTypes(),
      this.salesService.getSalesList()
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([types, salesList]) => {
          this.serviceTypes.set(types);
          this.sales.set(salesList);
          this.filteredSales.set(salesList);
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

  private applyFilters(filters: any): void {
    let result = this.sales();

    // Text Search (Service Name or Notes)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(sale =>
        sale.serviceType.name.toLowerCase().includes(searchTerm) ||
        (sale.notes && sale.notes.toLowerCase().includes(searchTerm))
      );
    }

    // Service Type Filter
    if (filters.serviceType) {
      result = result.filter(sale => sale.serviceType.id === filters.serviceType);
    }

    // Date Range Filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(sale => new Date(sale.dateCreated) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(sale => new Date(sale.dateCreated) <= toDate);
    }

    this.filteredSales.set(result);
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  deleteSale(sale: Sale): void {
    if (confirm('Are you sure you want to delete this sale?')) {
      // Implement delete logic here
      console.log('Deleting sale:', sale);
    }
  }
}
