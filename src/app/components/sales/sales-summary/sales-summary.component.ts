import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TableModule],
  templateUrl: './sales-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesSummaryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesService = inject(SalesService);
  private destroyRef = inject(DestroyRef);

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
}
