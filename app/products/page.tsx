import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop All | YeHagere",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const initialCategory = (Array.isArray(category) ? category[0] : category) ?? "all";
  return <ShopClient initialCategory={initialCategory.toLowerCase()} />;
}
