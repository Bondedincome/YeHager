import { Suspense } from "react";
import AdminOrdersClient from "./AdminOrdersClient";

export const metadata = {
  title: "Orders & Transactions Fulfillment | YeHageré Admin",
  description: "Manage incoming customer orders, live Stripe payments, courier fulfillment, and tracking numbers.",
};

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-8 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Loading orders…
        </div>
      }
    >
      <AdminOrdersClient />
    </Suspense>
  );
}
