/** Product shapes shared by the storefront and admin. Data comes from the NestJS API. */
export type ProductColor = {
  name: string;
  hex: string;
  image?: string;
  galleryImages?: string[];
  active?: boolean; // whether this colorway is active/available in storefront
};

export type Product = {
  id: number | string;
  title: string;
  name?: string;
  subtitle?: string;
  description?: string;
  price: number; // in USD (default for calculations)
  priceETB: number; // in ETB (e.g. 26100)
  /** What one unit costs the shop (USD). Admin-only. */
  costPrice?: number | null;
  formattedPriceETB?: string;
  imageUrl: string;
  galleryImages?: string[];
  category?: string;
  isNew?: boolean;
  tag?: string;
  colors?: ProductColor[];
  activeColorIndex?: number; // index of the active default colorway
  activeColorName?: string; // name of the active default colorway
  sizes?: string[];
  stock?: number;
  details?: {
    overview: string;
    measurements: string[];
    fabric: string;
    care: string;
  };
};
