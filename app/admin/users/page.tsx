import AdminUsersClient from "./AdminUsersClient";

export const metadata = {
  title: "Patron & User Management | YeHageré Admin",
  description: "Manage customer profiles, assign administrator roles, review purchase histories, and control system access.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
