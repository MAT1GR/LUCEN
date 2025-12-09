export interface Product {
  _id: string;
  name: string;
  description: string;
  img: string[];
  categories: string[];
  sizes: { [key: string]: { stock: number } };
  price: number;
  color: string[];
  inStock: boolean;
  bestSeller: boolean;
  newProduct: boolean;
  onSale: boolean;
  salePercent: number;
  brand?: string;
  // Measurements can be flat or nested
  waist_flat?: number;
  length?: number;
  rise?: string;
  rise_cm?: number;
  measurements?: {
    cintura?: number;
    largo?: number;
    tiro?: string;
  };
  sort_order?: number;
}
