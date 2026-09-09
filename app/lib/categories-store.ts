export type Category = {
  id: string; // unique slug e.g. "sets", "fall", "knitwear", "denim", "outerwear", "shoes", "accessories"
  name: string; // display title e.g. "Matching Sets", "Accessories"
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "sets",
    name: "Matching Sets",
    description: "Coordinated sets and traditional two-piece silhouettes",
    isDefault: true,
  },
  {
    id: "fall",
    name: "Hello Fall",
    description: "Autumn seasonal knitwear, earth tones and transition layers",
    isDefault: true,
  },
  {
    id: "knitwear",
    name: "Knitwear",
    description: "Hand-spun Ethiopian cotton and merino wool sweaters",
    isDefault: true,
  },
  {
    id: "denim",
    name: "Denim",
    description: "Structured selvedge and artisanal denim coats and trousers",
    isDefault: true,
  },
  {
    id: "outerwear",
    name: "Outerwear",
    description: "Heritage tibeb coats, capes, and tailored wool outerwear",
    isDefault: true,
  },
  {
    id: "shoes",
    name: "Shoes",
    description: "Artisan handcrafted footwear and leather sandals",
    isDefault: true,
  },
];

declare global {
  var __YEHAGERE_CATEGORIES__: Category[] | undefined;
}

const STORAGE_KEY = "yehagere_admin_categories_v1";

function readLocalCategories(): Category[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function persistLocalCategories(categories: Category[]) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      // Dispatch custom event so other components in the same window can react
      window.dispatchEvent(new CustomEvent("yehagere_categories_updated", { detail: categories }));
    } catch {
      // Ignore storage write errors
    }
  }
}

export function getAllCategories(): Category[] {
  // Check client-side localStorage first
  const stored = readLocalCategories();
  if (stored) {
    globalThis.__YEHAGERE_CATEGORIES__ = stored;
    return stored;
  }

  if (!globalThis.__YEHAGERE_CATEGORIES__ || globalThis.__YEHAGERE_CATEGORIES__.length === 0) {
    globalThis.__YEHAGERE_CATEGORIES__ = [...DEFAULT_CATEGORIES];
  }
  return globalThis.__YEHAGERE_CATEGORIES__;
}

export function getCategoryById(id: string): Category | undefined {
  const categories = getAllCategories();
  return categories.find((c) => c.id.toLowerCase() === id.toLowerCase().trim());
}

export function addCategory(input: {
  name: string;
  id?: string;
  description?: string;
}): Category {
  const current = getAllCategories();
  const trimmedName = input.name.trim();

  // Generate slug
  let slug = (input.id || input.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    slug = `category-${Date.now().toString().slice(-4)}`;
  }

  // Ensure slug uniqueness
  let finalSlug = slug;
  let counter = 1;
  while (current.some((c) => c.id === finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const newCategory: Category = {
    id: finalSlug,
    name: trimmedName,
    description: input.description?.trim() || "",
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newCategory];
  globalThis.__YEHAGERE_CATEGORIES__ = updated;
  persistLocalCategories(updated);

  return newCategory;
}

export function updateCategory(
  id: string,
  updates: { name?: string; description?: string }
): Category | undefined {
  const current = getAllCategories();
  const index = current.findIndex((c) => c.id === id);
  if (index === -1) return undefined;

  const existing = current[index];
  const updatedCat: Category = {
    ...existing,
    ...(updates.name ? { name: updates.name.trim() } : {}),
    ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
  };

  const updatedList = [...current];
  updatedList[index] = updatedCat;
  globalThis.__YEHAGERE_CATEGORIES__ = updatedList;
  persistLocalCategories(updatedList);

  return updatedCat;
}

export function deleteCategory(id: string): boolean {
  const current = getAllCategories();
  const exists = current.some((c) => c.id === id);
  if (!exists) return false;

  const updated = current.filter((c) => c.id !== id);
  // Ensure at least one category remains
  if (updated.length === 0) {
    globalThis.__YEHAGERE_CATEGORIES__ = [...DEFAULT_CATEGORIES];
    persistLocalCategories(globalThis.__YEHAGERE_CATEGORIES__);
    return true;
  }

  globalThis.__YEHAGERE_CATEGORIES__ = updated;
  persistLocalCategories(updated);
  return true;
}

export function resetCategoriesToDefault(): Category[] {
  globalThis.__YEHAGERE_CATEGORIES__ = [...DEFAULT_CATEGORIES];
  persistLocalCategories(globalThis.__YEHAGERE_CATEGORIES__);
  return globalThis.__YEHAGERE_CATEGORIES__;
}
