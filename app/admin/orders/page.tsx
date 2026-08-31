import { Suspense } from "react";
import AdminOrdersClient from "./AdminOrdersClient";

export const metadata = {
  title: "Orders & Transactions Fulfillment | YeHageré Admin",
  description: "Manage incoming patron orders, live Stripe payments, courier fulfillment, and tracking numbers.",
};

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-8 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Loading Atelier Orders...
        </div>
      }
    >
      <AdminOrdersClient />
    </Suspense>
  );
}
