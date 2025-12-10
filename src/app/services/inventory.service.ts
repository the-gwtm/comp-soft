import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { InventoryItem } from '../models/inventory-item.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {

    private mockInventory: InventoryItem[] = [
        {
            id: '1',
            itemName: 'A4 Paper (75gsm)',
            category: 'Paper',
            quantity: 50,
            unit: 'Packets',
            reorderLevel: 10,
            lastUpdated: new Date()
        },
        {
            id: '2',
            itemName: 'Black Toner Cartridge',
            category: 'Toner',
            quantity: 5,
            unit: 'Pcs',
            reorderLevel: 2,
            lastUpdated: new Date()
        },
        {
            id: '3',
            itemName: 'Color Ink Set',
            category: 'Ink',
            quantity: 12,
            unit: 'Boxes',
            reorderLevel: 5,
            lastUpdated: new Date()
        },
        {
            id: '4',
            itemName: 'Glossy Photo Paper',
            category: 'Photo Paper',
            quantity: 25,
            unit: 'Packets',
            reorderLevel: 5,
            lastUpdated: new Date()
        },
        {
            id: '5',
            itemName: 'Stapler Pins',
            category: 'Stationery',
            quantity: 100,
            unit: 'Boxes',
            reorderLevel: 20,
            lastUpdated: new Date()
        },
        {
            id: '6',
            itemName: 'Lamination Pouches',
            category: 'Other',
            quantity: 8,
            unit: 'Packets',
            reorderLevel: 3,
            lastUpdated: new Date()
        }
    ];

    constructor() { }

    getInventoryList(): Observable<InventoryItem[]> {
        return of(this.mockInventory).pipe(delay(600));
    }

    getItemById(id: string): Observable<InventoryItem | undefined> {
        const item = this.mockInventory.find(i => i.id === id);
        return of(item).pipe(delay(500));
    }

    updateInventory(item: InventoryItem): Observable<InventoryItem> {
        // Simulate API update
        console.log('Updating inventory:', item);

        const index = this.mockInventory.findIndex(i => i.id === item.id);
        if (index !== -1) {
            this.mockInventory[index] = { ...item, lastUpdated: new Date() };
            return of(this.mockInventory[index]).pipe(delay(800));
        } else {
            // Simulate create if not found (or handle as error)
            const newItem = {
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                lastUpdated: new Date()
            };
            this.mockInventory.push(newItem);
            return of(newItem).pipe(delay(800));
        }
    }
}
