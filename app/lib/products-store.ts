export type ProductColor = {
  name: string;
  hex: string;
  image?: string;
};

export type Product = {
  id: number;
  title: string;
  name?: string;
  subtitle?: string;
  description?: string;
  price: number; // in USD (default for calculations) or raw value
  priceETB: number; // in ETB (e.g. 26100)
  formattedPriceETB?: string;
  imageUrl: string;
  galleryImages?: string[];
  category?: string;
  isNew?: boolean;
  tag?: string;
  colors?: ProductColor[];
  sizes?: string[];
  stock?: number;
  details?: {
    overview: string;
    measurements: string[];
    fabric: string;
    care: string;
  };
};

// Global in-memory storage so mutations persist across requests in the current process
declare global {
  var __YEHAGERE_PRODUCTS__: Product[] | undefined;
}

const initialProducts: Product[] = [
  {
    id: 1,
    title: "The micro cable polo",
    name: "The micro cable polo",
    subtitle: "Merino Wool Knit",
    description: "The micro cable-knit polo. An easy silhouette with a classic collar, button-front placket and textured knit. Made from soft, lightweight merino wool.",
    price: 210.0,
    priceETB: 26100.0,
    formattedPriceETB: "Br26,100.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "knitwear",
    isNew: true,
    tag: "New",
    colors: [
      { name: "Violet", hex: "#7071e8" },
      { name: "Off White", hex: "#f3f4f6" },
      { name: "Charcoal", hex: "#27272a" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 24,
    details: {
      overview: "The micro cable-knit polo. An easy silhouette with a classic collar, button-front placket and textured knit. Made from soft, lightweight merino wool.",
      measurements: [
        "18 1/2\" long from shoulder",
        "Model is 5'9\" and wearing size XS",
      ],
      fabric: "100% Merino Wool",
      care: "Hand wash inside out in cold water. Do not bleach. Lay flat to dry. Do not iron. Dry cleanable.",
    },
  },
  {
    id: 2,
    title: "Vintage low slung baggy jeans",
    name: "Vintage low slung baggy jeans",
    subtitle: "Relaxed 90s Silhouette",
    description: "Our signature low slung baggy jean featuring vintage-inspired faded denim, effortless drape, and classic 5-pocket construction.",
    price: 210.0,
    priceETB: 26100.0,
    formattedPriceETB: "Br26,100.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "denim",
    isNew: true,
    tag: "New",
    colors: [
      { name: "Classic Indigo", hex: "#3b5998" },
      { name: "Violet Tint", hex: "#7071e8" },
      { name: "Washed Black", hex: "#1f2937" },
    ],
    sizes: ["24", "25", "26", "27", "28", "29", "30", "31", "32"],
    stock: 30,
    details: {
      overview: "Crafted from 100% non-stretch organic cotton with a comfortable low-rise waist and generous room through the thigh and leg.",
      measurements: [
        "Inseam: 32\"",
        "Rise: 10 1/4\"",
        "Model is 5'10\" and wearing size 26",
      ],
      fabric: "100% Organic Cotton",
      care: "Machine wash cold inside out with like colors. Tumble dry low.",
    },
  },
  {
    id: 3,
    title: "Matching Ribbed Knit Set",
    name: "Matching Ribbed Knit Set",
    subtitle: "Effortless Two-Piece Set",
    description: "The set you'll live in—sculpted rib-knit crop top and flowing wide-leg trousers engineered for day-to-night elegance.",
    price: 260.0,
    priceETB: 32400.0,
    formattedPriceETB: "Br32,400.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "sets",
    isNew: true,
    tag: "Matching Sets",
    colors: [
      { name: "Oatmeal", hex: "#e5dec9" },
      { name: "Heather Grey", hex: "#9ca3af" },
      { name: "Midnight", hex: "#111827" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 18,
    details: {
      overview: "Ultra-fine ribbed knit set featuring an elevated bateau neckline top and high-waisted fluid trousers.",
      measurements: [
        "Top Length: 20\"",
        "Trouser Inseam: 31\"",
        "Model is 5'9\" and wearing size S",
      ],
      fabric: "70% Viscose, 30% Fine Merino Wool",
      care: "Dry clean recommended or hand wash cold. Lay flat to dry.",
    },
  },
  {
    id: 4,
    title: "Oversized Minimalist Wool Trench",
    name: "Oversized Minimalist Wool Trench",
    subtitle: "Structured Outerwear",
    description: "Double-breasted structured overcoat crafted from double-faced brushed wool blend with dramatic lapels and removable belt.",
    price: 310.0,
    priceETB: 38500.0,
    formattedPriceETB: "Br38,500.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "fall",
    isNew: true,
    tag: "Hello Fall",
    colors: [
      { name: "Camel", hex: "#c49a6c" },
      { name: "Espresso", hex: "#3e2723" },
    ],
    sizes: ["XS", "S", "M", "L"],
    stock: 12,
    details: {
      overview: "A timeless outerwear statement designed with tailored raglan sleeves and storm flap detailing.",
      measurements: [
        "46\" center back length",
        "Model is 5'11\" and wearing size M",
      ],
      fabric: "80% Wool, 20% Cashmere Blend",
      care: "Dry clean only.",
    },
  },
  {
    id: 5,
    title: "Relaxed Linen Blend Loungewear Set",
    name: "Relaxed Linen Blend Loungewear Set",
    subtitle: "Matching Set",
    description: "Breathable washed linen shirt and drawstring shorts tailored with clean French seams for effortless warm-weather style.",
    price: 195.0,
    priceETB: 24200.0,
    formattedPriceETB: "Br24,200.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "sets",
    isNew: false,
    tag: "Matching Sets",
    colors: [
      { name: "Natural Flax", hex: "#dcd1b4" },
      { name: "Sage", hex: "#94a3b8" },
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 15,
    details: {
      overview: "Pre-washed pure European flax linen for instant softness and lived-in texture.",
      measurements: ["Relaxed fit", "Model is 5'9\" and wearing size S"],
      fabric: "100% European Flax Linen",
      care: "Machine wash cold, gentle cycle. Hang dry.",
    },
  },
  {
    id: 6,
    title: "Heavyweight Boxy Fall Cardigan",
    name: "Heavyweight Boxy Fall Cardigan",
    subtitle: "Cozy Layering",
    description: "Chunky knit cardigan with dropped shoulders, genuine horn buttons, and ribbed hems.",
    price: 180.0,
    priceETB: 22500.0,
    formattedPriceETB: "Br22,500.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "fall",
    isNew: true,
    tag: "Hello Fall",
    colors: [
      { name: "Cream", hex: "#fef3c7" },
      { name: "Forest", hex: "#1e3a2b" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 20,
    details: {
      overview: "Spun from ethically sourced alpaca and organic wool blend for cloud-like softness.",
      measurements: ["22\" length from shoulder", "Model is 5'8\" wearing size S"],
      fabric: "60% Alpaca, 40% Organic Wool",
      care: "Hand wash cold, dry flat.",
    },
  },
  {
    id: 7,
    title: "Straight Leg Washed Carpenter Denim",
    name: "Straight Leg Washed Carpenter Denim",
    subtitle: "Workwear Silhouette",
    description: "Medium-wash rugged denim with utility hammer loop, reinforced tool pockets, and clean straight cuff.",
    price: 210.0,
    priceETB: 26100.0,
    formattedPriceETB: "Br26,100.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "denim",
    isNew: true,
    tag: "New",
    colors: [
      { name: "Stonewash", hex: "#60a5fa" },
      { name: "Raw Indigo", hex: "#1e3a8a" },
    ],
    sizes: ["26", "28", "30", "32", "34"],
    stock: 14,
    details: {
      overview: "Substantial 13.5oz denim built to age with character over seasons of wear.",
      measurements: ["32\" inseam", "11\" front rise"],
      fabric: "100% Cotton Denim",
      care: "Wash cold, hang to dry.",
    },
  },
  {
    id: 8,
    title: "Tailored Minimalist Pleated Trousers",
    name: "Tailored Minimalist Pleated Trousers",
    subtitle: "Modern Tailoring",
    description: "High-waist wide pleated trousers cut from lightweight Italian twill for a fluid, sharp silhouette.",
    price: 220.0,
    priceETB: 27400.0,
    formattedPriceETB: "Br27,400.00 ETB",
    imageUrl: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=1000&auto=format&fit=crop&q=80",
    ],
    category: "fall",
    isNew: true,
    tag: "Hello Fall",
    colors: [
      { name: "Taupe", hex: "#b8a898" },
      { name: "Black", hex: "#000000" },
    ],
    sizes: ["XS", "S", "M", "L"],
    stock: 16,
    details: {
      overview: "Double front pleats with slanted side pockets and blind hem finish.",
      measurements: ["31\" inseam", "Model is 5'10\" wearing size S"],
      fabric: "100% Italian Wool Twill",
      care: "Dry clean only.",
    },
  },
];

if (!globalThis.__YEHAGERE_PRODUCTS__) {
  globalThis.__YEHAGERE_PRODUCTS__ = [...initialProducts];
}

export function getAllProducts(): Product[] {
  return globalThis.__YEHAGERE_PRODUCTS__ ?? initialProducts;
}

export function getProductById(id: number | string): Product | undefined {
  const numId = Number(id);
  const products = getAllProducts();
  return products.find((p) => p.id === numId);
}

export type CreateProductInput = {
  title: string;
  name?: string;
  subtitle?: string;
  description?: string;
  price: number;
  priceETB?: number;
  formattedPriceETB?: string;
  imageUrl?: string;
  galleryImages?: string[];
  category?: string;
  isNew?: boolean;
  tag?: string;
  colors?: ProductColor[];
  sizes?: string[];
  stock?: number;
  details?: {
    overview: string;
    measurements: string[];
    fabric: string;
    care: string;
  };
  id?: number;
};

export function addProduct(product: CreateProductInput): Product {
  const products = getAllProducts();
  const nextId = product.id ?? (products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1);
  const etbValue = product.priceETB ?? (product.price ? product.price * 125 : 26100);
  const newProduct: Product = {
    id: nextId,
    title: product.title,
    name: product.name ?? product.title,
    subtitle: product.subtitle,
    description: product.description,
    price: product.price,
    priceETB: etbValue,
    formattedPriceETB: product.formattedPriceETB || `Br${etbValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`,
    imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
    galleryImages: product.galleryImages || [product.imageUrl || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80"],
    category: product.category || "fall",
    isNew: product.isNew ?? true,
    tag: product.tag || "New",
    colors: product.colors || [{ name: "Violet", hex: "#7071e8" }, { name: "Charcoal", hex: "#27272a" }],
    sizes: product.sizes || ["XS", "S", "M", "L", "XL"],
    stock: product.stock ?? 10,
    details: product.details || {
      overview: product.description || "The micro cable-knit polo. An easy silhouette with a classic collar.",
      measurements: ['18 1/2" long from shoulder', "Model is 5'9\" and wearing size XS"],
      fabric: "100% Merino Wool",
      care: "Hand wash inside out in cold water. Dry cleanable.",
    },
  };
  globalThis.__YEHAGERE_PRODUCTS__ = [newProduct, ...products];
  return newProduct;
}


export function updateProduct(id: number | string, updates: Partial<Product>): Product | undefined {
  const numId = Number(id);
  const products = getAllProducts();
  const index = products.findIndex((p) => p.id === numId);
  if (index === -1) return undefined;

  const existing = products[index];
  const updatedPrice = updates.price !== undefined ? updates.price : existing.price;
  const updatedETB = updates.priceETB !== undefined ? updates.priceETB : (updates.price !== undefined ? updates.price * 125 : existing.priceETB);
  
  const updated: Product = {
    ...existing,
    ...updates,
    id: numId,
    price: updatedPrice,
    priceETB: updatedETB,
    formattedPriceETB: updates.formattedPriceETB || `Br${updatedETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`,
    details: {
      ...existing.details,
      ...updates.details,
      overview: updates.description || updates.details?.overview || existing.details?.overview || "",
      measurements: updates.details?.measurements || existing.details?.measurements || [],
      fabric: updates.details?.fabric || existing.details?.fabric || "",
      care: updates.details?.care || existing.details?.care || "",
    },
  };

  const newProducts = [...products];
  newProducts[index] = updated;
  globalThis.__YEHAGERE_PRODUCTS__ = newProducts;
  return updated;
}

export function duplicateProduct(id: number | string): Product | undefined {
  const existing = getProductById(id);
  if (!existing) return undefined;

  return addProduct({
    ...existing,
    id: undefined,
    title: `${existing.title} (Copy)`,
    name: `${existing.title} (Copy)`,
    stock: existing.stock,
  });
}

export function deleteProduct(id: number | string): boolean {
  const numId = Number(id);
  const products = getAllProducts();
  const exists = products.some((p) => p.id === numId);
  if (exists) {
    globalThis.__YEHAGERE_PRODUCTS__ = products.filter((p) => p.id !== numId);
    return true;
  }
  return false;
}

