"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count } = useCart();

  return (
    <Link href="/cart" className="relative inline-flex items-center">
      <ShoppingCart size={24} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
          {count}
        </span>
      )}
    </Link>
  );
}
