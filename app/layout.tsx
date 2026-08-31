import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import { WishlistProvider } from "./components/WishlistProvider";
import AppearanceProvider from "./components/AppearanceProvider";
import { AuthProvider } from "./components/AuthProvider";
import StorefrontShell from "./components/StorefrontShell";

export const metadata: Metadata = {
  title: "YeHagere — Modern Minimalist Apparel",
  description: "Explore effortless matching sets, relaxed denim silhouettes, and luxurious seasonal essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-black">
        <AuthProvider>
          <AppearanceProvider>
            <WishlistProvider>
              <CartProvider>
                <StorefrontShell>{children}</StorefrontShell>
              </CartProvider>
            </WishlistProvider>
          </AppearanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

