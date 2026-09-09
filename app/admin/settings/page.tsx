import AdminSettingsClient from "./AdminSettingsClient";

export const metadata = {
  title: "Atelier Settings & Promotions Engine | YeHageré Admin",
  description: "Global store configurations, exchange rates, shipping policies, inventory rules, and discount codes.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
