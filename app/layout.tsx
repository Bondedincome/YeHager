import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import { WishlistProvider } from "./components/WishlistProvider";
import AppearanceProvider from "./components/AppearanceProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
        <AppearanceProvider>
          <WishlistProvider>
            <CartProvider>
              <Navbar />
              <div className="flex-1">{children}</div>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}

