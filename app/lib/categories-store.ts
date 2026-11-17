/** Category shape shared by the admin pages. Data comes from the NestJS API. */
export type Category = {
  id: string; // unique slug e.g. "sets", "fall", "knitwear", "denim", "outerwear", "shoes", "accessories"
  apiId?: string;
  name: string; // display title e.g. "Matching Sets", "Accessories"
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
};
