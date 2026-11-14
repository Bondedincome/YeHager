import AdminSettingsClient from "./AdminSettingsClient";

export const metadata = {
  title: "Settings | YeHagere Admin",
  description: "Global store configurations, exchange rates, shipping policies, inventory rules, and discount codes.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
