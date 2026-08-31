import AdminAnalyticsClient from "./AdminAnalyticsClient";

export const metadata = {
  title: "Atelier Analytics & Performance | YeHageré Admin",
  description: "Executive store performance metrics, gross revenue, user acquisition, and live orders.",
};

export default function AdminPage() {
  return <AdminAnalyticsClient />;
}
