export interface ServiceSummary {
    serviceName: string;
    totalQuantity: number;
    totalRevenue: number;
    averageRate: number;
    contributionPercentage: number;
}

export interface SalesKPI {
    totalSalesCount: number;
    totalRevenue: number;
    averageSaleValue: number;
    highestSaleValue: number;
}
