export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type?: string;
  lastUpdated?: Date;
  currency?: string;
  description?: string;
}
