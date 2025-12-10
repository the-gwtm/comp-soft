export type InventoryCategory =
    | 'Paper'
    | 'Toner'
    | 'Ink'
    | 'Photo Paper'
    | 'Stationery'
    | 'Other';

export type InventoryUnit =
    | 'Packets'
    | 'Boxes'
    | 'Liters'
    | 'Pcs'
    | 'Rolls';

export interface InventoryItem {
    id?: string;
    itemName: string;
    category: InventoryCategory;
    quantity: number;
    unit: InventoryUnit;
    reorderLevel?: number;
    notes?: string;
    lastUpdated?: Date;
}
