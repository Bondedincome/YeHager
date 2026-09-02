"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Ban,
  Mail,
  Phone,
  MapPin,
  X,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { AppUser, UserRole } from "../../lib/auth-store";

export default function AdminUsersClient() {
  const { usersList, addUser, updateUserRole, toggleUserStatus, deleteUser, user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("customer");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("Addis Ababa");
  const [newCountry, setNewCountry] = useState("Ethiopia");

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    addUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      status: "active",
      phone: newPhone || undefined,
      shippingAddress: newStreet
        ? {
            street: newStreet,
            city: newCity,
            state: newCity,
            zip: "1000",
            country: newCountry,
          }
        : undefined,
    });

    setIsAddModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("customer");
    setNewPhone("");
    setNewStreet("");
  };

  const vipCount = usersList.filter((u) => u.role === "vip").length;
  const adminCount = usersList.filter((u) => u.role === "admin").length;
  const customerCount = usersList.filter((u) => u.role === "customer").length;

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4 sm:px-8 space-y-8 max-w-[1520px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              User &amp; Patron Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            Registered Users &amp; Atelier Clients
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage customer accounts, assign administrative privileges, track customer lifetime spent, and handle patron access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-2xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User / Patron</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Total Registered Users
          </span>
          <p className="text-2xl font-extrabold text-black">{usersList.length}</p>
          <span className="text-[10px] text-neutral-400">All accounts across atelier</span>
        </div>

        <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            VIP Patron Tier
          </span>
          <p className="text-2xl font-extrabold text-black">{vipCount}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Priority preview access</span>
        </div>

        <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Standard Patrons
          </span>
          <p className="text-2xl font-extrabold text-black">{customerCount}</p>
          <span className="text-[10px] text-neutral-400">Verified retail shoppers</span>
        </div>

        <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Staff Administrators
          </span>
          <p className="text-2xl font-extrabold text-black">{adminCount}</p>
          <span className="text-[10px] text-neutral-400">Full system governance</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patron name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 pr-2">Filter:</span>
          {["all", "admin", "vip", "customer"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                roleFilter === r ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {r === "all" ? "All Users" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Users Cards View (Hidden on md+) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-8 text-center text-xs text-neutral-400">
            No patrons found matching query.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            return (
              <div key={user.id} className="bg-white border border-neutral-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center uppercase flex-shrink-0">
                      {user.name ? user.name[0] : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-black text-xs">{user.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-neutral-200 text-neutral-700">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 block">{user.email}</span>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove user "${user.name}"?`)) {
                          deleteUser(user.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-100">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Role</span>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                      className="text-[11px] font-bold uppercase tracking-wider py-1 px-2 border bg-neutral-50 mt-1 w-full"
                    >
                      <option value="customer">Customer</option>
                      <option value="vip">VIP Patron</option>
                      <option value="admin">Staff Admin</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Status</span>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex items-center justify-center gap-1 text-[10px] font-bold uppercase px-2 py-1 border mt-1 w-full ${
                        user.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {user.status === "active" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3 h-3" />
                          <span>Suspended</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100 text-neutral-600">
                  <span>{user.totalOrders || 0} Orders</span>
                  <span className="font-bold text-black">${user.totalSpentUSD || 0} USD</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Users Table (Hidden on mobile) */}
      <div className="hidden md:block bg-white border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-3.5 px-6">Patron / User</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Total Orders</th>
                <th className="py-3.5 px-6">Total Spent</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Member Since</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No users matched your query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Patron Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center uppercase flex-shrink-0">
                            {user.name ? user.name[0] : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-black">{user.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-neutral-200 text-neutral-700">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-500">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-4 px-6">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className={`text-[11px] font-bold uppercase tracking-wider py-1 px-2.5 border outline-none cursor-pointer ${
                            user.role === "admin"
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : user.role === "vip"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-neutral-100 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          <option value="customer">Customer</option>
                          <option value="vip">VIP Patron</option>
                          <option value="admin">Staff Admin</option>
                        </select>
                      </td>

                      {/* Total Orders */}
                      <td className="py-4 px-6 font-semibold text-black">
                        {user.totalOrders || 0} orders
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-black block">${user.totalSpentUSD || 0} USD</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Br{((user.totalSpentUSD || 0) * 125).toLocaleString()} ETB
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 transition-colors ${
                            user.status === "active"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          }`}
                          title="Click to toggle status"
                        >
                          {user.status === "active" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Member Since */}
                      <td className="py-4 px-6 text-neutral-500 text-[11px]">
                        {user.memberSince || "2024-01-01"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove user "${user.name}"?`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-black">Create Atelier User / Patron</h3>
                <p className="text-xs text-neutral-500">Register a new client or grant staff privileges.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-black">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Liya Kebede"
                  className="w-full bg-[#f4f4f4] px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-black">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. liya@atelier.com"
                  className="w-full bg-[#f4f4f4] px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-black">Account Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-[#f4f4f4] px-3.5 py-2.5 text-sm text-black font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="customer">Standard Customer</option>
                    <option value="vip">VIP Patron</option>
                    <option value="admin">Staff Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-black">Phone (Optional)</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+251 91 ..."
                    className="w-full bg-[#f4f4f4] px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-black">Street Address (Optional)</label>
                <input
                  type="text"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="Street / Quarter"
                  className="w-full bg-[#f4f4f4] px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-300 text-xs font-bold uppercase tracking-wider hover:border-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
