export type ExpenseCategory =
    | 'Rent'
    | 'Electricity'
    | 'Internet'
    | 'Printing Materials'
    | 'Maintenance'
    | 'Staff Salary'
    | 'Miscellaneous';

export type PaymentMethod =
    | 'Cash'
    | 'UPI'
    | 'Bank Transfer'
    | 'Card';

export interface Expense {
    id?: string;
    expenseDate: Date;
    category: ExpenseCategory;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    attachmentUrl?: string;
    createdAt?: Date;
}
