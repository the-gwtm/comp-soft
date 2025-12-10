import { ServiceType } from './service-type.model';

export interface Sale {
    id?: string;
    serviceType: ServiceType;
    quantity: number;
    rate: number;
    total: number;
    notes?: string;
    dateCreated: Date;
}
