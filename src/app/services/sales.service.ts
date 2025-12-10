import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ServiceType } from '../models/service-type.model';
import { Sale } from '../models/sale.model';

@Injectable({
    providedIn: 'root'
})
export class SalesService {

    private serviceTypes: ServiceType[] = [
        { id: '1', name: 'Xerox (B/W)', defaultRate: 2 },
        { id: '2', name: 'Xerox (Color)', defaultRate: 10 },
        { id: '3', name: 'Printout (B/W)', defaultRate: 5 },
        { id: '4', name: 'Printout (Color)', defaultRate: 15 },
        { id: '5', name: 'Typing', defaultRate: 30 },
        { id: '6', name: 'Lamination', defaultRate: 40 },
        { id: '7', name: 'Photo Print', defaultRate: 25 },
        { id: '8', name: 'Scanning', defaultRate: 10 },
        { id: '9', name: 'Internet Browsing', defaultRate: 20 },
        { id: '10', name: 'Other', defaultRate: 0 }
    ];

    private mockSales: Sale[] = [
        {
            id: '1',
            serviceType: { id: '1', name: 'Xerox (B/W)', defaultRate: 2 },
            quantity: 10,
            rate: 2,
            total: 20,
            notes: 'Project report',
            dateCreated: new Date('2025-12-10T10:30:00')
        },
        {
            id: '2',
            serviceType: { id: '3', name: 'Printout (B/W)', defaultRate: 5 },
            quantity: 5,
            rate: 5,
            total: 25,
            notes: 'Resume printing',
            dateCreated: new Date('2025-12-09T14:15:00')
        },
        {
            id: '3',
            serviceType: { id: '6', name: 'Lamination', defaultRate: 40 },
            quantity: 2,
            rate: 40,
            total: 80,
            notes: 'ID Cards',
            dateCreated: new Date('2025-12-08T09:45:00')
        },
        {
            id: '4',
            serviceType: { id: '9', name: 'Internet Browsing', defaultRate: 20 },
            quantity: 1,
            rate: 20,
            total: 20,
            notes: 'Form filling',
            dateCreated: new Date('2025-12-10T11:00:00')
        },
        {
            id: '5',
            serviceType: { id: '2', name: 'Xerox (Color)', defaultRate: 10 },
            quantity: 3,
            rate: 10,
            total: 30,
            notes: 'Certificates',
            dateCreated: new Date('2025-12-07T16:20:00')
        }
    ];

    constructor() { }

    getServiceTypes(): Observable<ServiceType[]> {
        // Simulate API call
        return of(this.serviceTypes).pipe(delay(500));
    }

    getSalesList(): Observable<Sale[]> {
        return of(this.mockSales).pipe(delay(600));
    }

    saveSale(sale: Sale): Observable<Sale> {
        // Simulate API save
        console.log('Saving sale:', sale);
        const newSale = { ...sale, id: Math.random().toString(36).substr(2, 9) };
        this.mockSales = [newSale, ...this.mockSales];
        return of(newSale).pipe(delay(800));
    }
}
