export interface Asset {
  id: string;
  name: string;
  type: string;
  lastUpdated: Date;
}

export interface PriceData {
  price: number;
  timestamp: Date;
}