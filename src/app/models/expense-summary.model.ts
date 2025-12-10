export interface ExpenseCategorySummary {
    category: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
    percentage: number;
}

export interface ExpenseKPI {
    totalCount: number;
    totalAmount: number;
    highestAmount: number;
    averageAmount: number;
}
