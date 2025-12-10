import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {

    private mockExpenses: Expense[] = [
        {
            id: '1',
            expenseDate: new Date('2025-12-10'),
            category: 'Rent',
            amount: 15000,
            paymentMethod: 'Bank Transfer',
            notes: 'Office Rent for December'
        },
        {
            id: '2',
            expenseDate: new Date('2025-12-08'),
            category: 'Electricity',
            amount: 2500,
            paymentMethod: 'UPI',
            notes: 'Electricity Bill Nov 2025'
        },
        {
            id: '3',
            expenseDate: new Date('2025-12-05'),
            category: 'Internet',
            amount: 1200,
            paymentMethod: 'Card',
            notes: 'Broadband Subscription'
        },
        {
            id: '4',
            expenseDate: new Date('2025-12-02'),
            category: 'Printing Materials',
            amount: 5000,
            paymentMethod: 'Cash',
            notes: 'A4 Paper Bundles (10)'
        },
        {
            id: '5',
            expenseDate: new Date('2025-12-01'),
            category: 'Maintenance',
            amount: 800,
            paymentMethod: 'Cash',
            notes: 'Printer Repair'
        }
    ];

    constructor() { }

    getExpenses(): Observable<Expense[]> {
        return of(this.mockExpenses).pipe(delay(600));
    }

    addExpense(expense: Expense): Observable<Expense> {
        // Simulate API network delay and success
        const newExpense = {
            ...expense,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date()
        };

        console.log('Adding expense:', newExpense);
        this.mockExpenses = [newExpense, ...this.mockExpenses];
        return of(newExpense).pipe(delay(800));
    }
}
