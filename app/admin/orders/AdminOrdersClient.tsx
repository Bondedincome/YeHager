"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard,
  Package,
  MapPin,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Printer,
  Trash2,
  Edit2,
  FileText,
  AlertCircle,
  X,
  Send,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { CustomerOrder, OrderStatus } from "../../lib/auth-store";
import { getAllProducts, Product } from "../../lib/products-store";
import { getStoreSettings } from "../../lib/settings-store";

export default function AdminOrdersClient() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { orders, updateOrderStatus, updateOrderDetails, deleteOrder, placeOrder } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Tracking edit state
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [carrierInput, setCarrierInput] = useState("DHL Express");

  // Internal Notes state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");

  // Invoice / Packing Slip Modal
  const [invoiceOrder, setInvoiceOrder] = useState<CustomerOrder | null>(null);

  // Manual Order Creation Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<{
    customerName: string;
    customerEmail: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    selectedProductId: string;
    size: string;
    color: string;
    quantity: number;
    paymentMethod: CustomerOrder["paymentMethod"];
    internalNotes: string;
  }>({
    customerName: "",
    customerEmail: "",
    street: "Bole Sub-City, Kebele 03",
    city: "Addis Ababa",
    postalCode: "1000",
    country: "Ethiopia",
    selectedProductId: "",
    size: "M",
    color: "Heritage",
    quantity: 1,
    paymentMethod: "manual_boutique",
    internalNotes: "Manual VIP boutique walk-in order",
  });

  const catalogProducts = useMemo(() => getAllProducts(), []);
  const settings = useMemo(() => getStoreSettings(), []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.trackingNumber || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Order Metrics
  const totalRevenueUSD = useMemo(
    () => orders.reduce((sum, o) => (o.status !== "cancelled" ? sum + o.totalUSD : sum), 0),
    [orders]
  );
  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "preparing" || o.status === "confirmed").length,
    [orders]
  );
  const inTransitCount = useMemo(
    () => orders.filter((o) => o.status === "shipped").length,
    [orders]
  );

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "shipped":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "preparing":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "cancelled":
        return "bg-rose-50 text-rose-800 border-rose-300";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-300";
    }
  };

  const handleSaveTracking = (orderId: string) => {
    updateOrderDetails(orderId, {
      trackingNumber: trackingInput.trim(),
      carrier: carrierInput,
      status: "shipped", // Auto promote to shipped when tracking is entered
    });
    setEditingTrackingId(null);
  };

  const handleSaveNotes = (orderId: string) => {
    updateOrderDetails(orderId, { internalNotes: notesInput.trim() });
    setEditingNotesId(null);
  };

  const handleDeleteOrder = (order: CustomerOrder) => {
    if (confirm(`Remove order #${order.orderNumber} for ${order.customerName}?`)) {
      deleteOrder(order.id);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = catalogProducts.find((p) => p.id === Number(manualForm.selectedProductId)) || catalogProducts[0];
    if (!product) return;

    const totalUSD = product.price * manualForm.quantity;
    const totalETB = totalUSD * settings.exchangeRateUSDToETB;

    await placeOrder({
      customerEmail: manualForm.customerEmail.trim(),
      customerName: manualForm.customerName.trim(),
      items: [
        {
          id: product.id,
          title: product.title,
          price: product.price,
          priceETB: product.priceETB,
          quantity: manualForm.quantity,
          size: manualForm.size,
          color: manualForm.color,
          imageUrl: product.imageUrl,
        },
      ],
      totalUSD,
      totalETB,
      paymentMethod: manualForm.paymentMethod,
      status: "confirmed",
      shippingAddress: {
        street: manualForm.street,
        city: manualForm.city,
        postalCode: manualForm.postalCode,
        country: manualForm.country,
      },
      carrier: "Atelier Courier",
      internalNotes: manualForm.internalNotes,
    });

    setShowManualModal(false);
    setManualForm({
      customerName: "",
      customerEmail: "",
      street: "Bole Sub-City, Kebele 03",
      city: "Addis Ababa",
      postalCode: "1000",
      country: "Ethiopia",
      selectedProductId: "",
      size: "M",
      color: "Heritage",
      quantity: 1,
      paymentMethod: "manual_boutique",
      internalNotes: "Manual VIP boutique walk-in order",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4 sm:px-8 space-y-8 max-w-[1520px] mx-auto text-black">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              Fulfillment &amp; Transactions
            </span>
            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white">
              Logistics Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            Customer Orders &amp; Dispatch Governance
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track Stripe settlements, assign DHL/FedEx tracking codes, append internal concierge memos, and generate printable commercial packing slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Manual Order</span>
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 bg-white text-black border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Executive Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Gross Settlements
          </span>
          <div className="text-2xl font-extrabold text-black mt-1">
            ${totalRevenueUSD.toLocaleString()}
            <span className="text-xs font-normal text-neutral-500 ml-2">
              (Br {(totalRevenueUSD * settings.exchangeRateUSDToETB).toLocaleString()})
            </span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Total Orders Logged
          </span>
          <div className="text-2xl font-extrabold text-black mt-1 flex items-baseline gap-2">
            {orders.length}
            <span className="text-xs font-normal text-neutral-500">transactions</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Awaiting Fulfillment
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 flex items-baseline gap-2">
            {pendingCount}
            <span className="text-xs font-normal text-neutral-500">orders</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            In Transit (Courier / DHL)
          </span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1 flex items-baseline gap-2">
            {inTransitCount}
            <span className="text-xs font-normal text-neutral-500">dispatches</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by #order number, client name, email, or tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 pr-2">Status:</span>
          {["all", "confirmed", "preparing", "shipped", "delivered", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === st ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-black">No Orders Found</h3>
            <p className="text-xs text-neutral-500">
              No orders matched your search or status criteria.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id || highlightId === order.orderNumber;

            return (
              <div
                key={order.id}
                className={`bg-white border transition-all shadow-2xs ${
                  highlightId === order.orderNumber ? "border-black ring-1 ring-black" : "border-neutral-200"
                }`}
              >
                {/* Main Order Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Order #
                      </span>
                      <span className="text-sm font-bold font-mono text-black">#{order.orderNumber}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Client / Patron
                      </span>
                      <span className="text-xs font-bold text-black block">{order.customerName}</span>
                      <span className="text-[11px] text-neutral-500">{order.customerEmail}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Settled Value
                      </span>
                      <span className="text-xs font-bold text-black block">${order.totalUSD} USD</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Br{(order.totalETB || order.totalUSD * settings.exchangeRateUSDToETB).toLocaleString()} ETB
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Date &amp; Method
                      </span>
                      <span className="text-xs text-neutral-700 block">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        {order.paymentMethod || "stripe"}
                      </span>
                    </div>

                    {order.trackingNumber && (
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Tracking ({order.carrier || "DHL"})
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-700 block">
                          {order.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase text-neutral-500">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold uppercase tracking-wider py-1.5 px-3 border outline-none cursor-pointer ${getStatusClass(
                          order.status
                        )}`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Print Packing Slip */}
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="p-1.5 text-neutral-600 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors"
                      title="Generate Packing Slip / Commercial Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Expand Details */}
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? "Hide Details" : "Manage Order"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Order */}
                    <button
                      onClick={() => handleDeleteOrder(order)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Delete this order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Item Details & Controls */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-[#fafafa] p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Col 1: Purchased Garments */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-2 flex items-center justify-between">
                          <span>Purchased Items ({order.items.length})</span>
                          <span className="font-mono text-neutral-500">${order.totalUSD} USD</span>
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 bg-white p-3 border border-neutral-200"
                            >
                              <div className="flex items-center gap-3">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-10 h-12 object-cover border border-neutral-200 flex-shrink-0"
                                  />
                                )}
                                <div>
                                  <h5 className="text-xs font-bold text-black">{item.title}</h5>
                                  <span className="text-[10px] text-neutral-500">
                                    Qty: {item.quantity} • Size: {item.size || "M"} • {item.color || "Standard"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-black block">
                                  ${item.price * item.quantity}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  Br{((item.priceETB || item.price * settings.exchangeRateUSDToETB) * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Col 2: Shipping & Delivery Controls */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-2 flex items-center justify-between">
                          <span>Shipping &amp; Logistics</span>
                          <Truck className="w-3.5 h-3.5 text-neutral-400" />
                        </h4>

                        <div className="bg-white p-4 border border-neutral-200 space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                              Delivery Address
                            </span>
                            <div className="font-semibold text-black mt-0.5">
                              {order.shippingAddress?.street}
                            </div>
                            <div className="text-neutral-600">
                              {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                            </div>
                            <div className="text-neutral-600">{order.shippingAddress?.country}</div>
                          </div>

                          {/* Tracking Assignment */}
                          <div className="pt-3 border-t border-neutral-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                                Dispatch Tracking Code
                              </span>
                              {editingTrackingId !== order.id && (
                                <button
                                  onClick={() => {
                                    setEditingTrackingId(order.id);
                                    setTrackingInput(order.trackingNumber || "");
                                    setCarrierInput(order.carrier || "DHL Express");
                                  }}
                                  className="text-[10px] font-bold text-blue-700 hover:underline uppercase"
                                >
                                  {order.trackingNumber ? "Edit" : "+ Assign Tracking"}
                                </button>
                              )}
                            </div>

                            {editingTrackingId === order.id ? (
                              <div className="space-y-2 mt-2">
                                <select
                                  value={carrierInput}
                                  onChange={(e) => setCarrierInput(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black"
                                >
                                  <option value="DHL Express">DHL Express Worldwide</option>
                                  <option value="FedEx">FedEx Priority</option>
                                  <option value="Atelier Courier">YeHageré Local Courier</option>
                                  <option value="Ethiopian Post">Ethiopian Postal Service</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="e.g. DHL-ET-9821371"
                                  value={trackingInput}
                                  onChange={(e) => setTrackingInput(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-[#f4f4f4] border border-neutral-300 text-xs font-mono font-bold text-black"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSaveTracking(order.id)}
                                    className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Save &amp; Mark Shipped
                                  </button>
                                  <button
                                    onClick={() => setEditingTrackingId(null)}
                                    className="px-2 py-1 text-neutral-500 hover:text-black text-[10px] uppercase font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-neutral-600 font-mono">
                                {order.trackingNumber ? (
                                  <span className="font-bold text-black">
                                    {order.carrier || "DHL"}: {order.trackingNumber}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 italic">No tracking code recorded</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Col 3: Internal Atelier Memos & Fast Actions */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-2 flex items-center justify-between">
                          <span>Staff Memos &amp; Quick Actions</span>
                          <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        </h4>

                        <div className="bg-white p-4 border border-neutral-200 space-y-3 text-xs">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Internal Concierge Notes
                              </span>
                              {editingNotesId !== order.id && (
                                <button
                                  onClick={() => {
                                    setEditingNotesId(order.id);
                                    setNotesInput(order.internalNotes || "");
                                  }}
                                  className="text-[10px] font-bold text-neutral-600 hover:text-black uppercase"
                                >
                                  {order.internalNotes ? "Edit" : "+ Add Note"}
                                </button>
                              )}
                            </div>

                            {editingNotesId === order.id ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={notesInput}
                                  onChange={(e) => setNotesInput(e.target.value)}
                                  placeholder="e.g. Call client prior to delivery, special packaging"
                                  className="w-full p-2 bg-[#f4f4f4] border border-neutral-300 text-xs text-black"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSaveNotes(order.id)}
                                    className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Save Note
                                  </button>
                                  <button
                                    onClick={() => setEditingNotesId(null)}
                                    className="px-2 py-1 text-neutral-500 hover:text-black text-[10px] uppercase font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-neutral-700 bg-neutral-50 p-2.5 border border-neutral-100 italic text-[11px]">
                                {order.internalNotes || "No internal staff memos attached."}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-2">
                            <button
                              onClick={() => updateOrderStatus(order.id, "preparing")}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                            >
                              Move to Preparing
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, "delivered")}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                            >
                              Mark Delivered
                            </button>
                            <button
                              onClick={() => setInvoiceOrder(order)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-black border border-neutral-300 hover:bg-neutral-200"
                            >
                              Packing Slip
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PRINTABLE PACKING SLIP / INVOICE MODAL */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-2xl w-full p-8 border border-neutral-300 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Action buttons (hidden on print) */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Official Atelier Packing Slip &amp; Commercial Invoice
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-neutral-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="p-1.5 text-neutral-400 hover:text-black font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="space-y-6 text-black">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">YEHAGERÉ ATELIER</h2>
                  <p className="text-xs text-neutral-500">{settings.atelierAddress}</p>
                  <p className="text-xs text-neutral-500">
                    {settings.supportEmail} • {settings.supportPhone}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono">#{invoiceOrder.orderNumber}</div>
                  <div className="text-xs text-neutral-500">
                    Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs font-bold uppercase text-emerald-700">
                    Payment Status: Settled
                  </div>
                </div>
              </div>

              {/* Recipient / Shipping Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Ship To:
                  </span>
                  <div className="font-bold text-sm">{invoiceOrder.customerName}</div>
                  <div>{invoiceOrder.customerEmail}</div>
                  <div>{invoiceOrder.shippingAddress?.street}</div>
                  <div>
                    {invoiceOrder.shippingAddress?.city}, {invoiceOrder.shippingAddress?.postalCode}
                  </div>
                  <div>{invoiceOrder.shippingAddress?.country}</div>
                </div>

                <div className="text-right">
                  <span className="font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Logistics Carrier:
                  </span>
                  <div className="font-bold">{invoiceOrder.carrier || "DHL Express Worldwide"}</div>
                  <div className="font-mono text-neutral-600">
                    Tracking: {invoiceOrder.trackingNumber || "Pending Courier Scan"}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-neutral-200">
                <thead className="bg-neutral-100 font-bold uppercase tracking-wider text-neutral-700">
                  <tr>
                    <th className="p-2.5">Garment Description</th>
                    <th className="p-2.5 text-center">Size</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price (USD)</th>
                    <th className="p-2.5 text-right">Total (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {invoiceOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{it.title}</td>
                      <td className="p-2.5 text-center">{it.size || "M"}</td>
                      <td className="p-2.5 text-center">{it.quantity}</td>
                      <td className="p-2.5 text-right font-mono">${it.price * it.quantity}</td>
                      <td className="p-2.5 text-right font-mono">
                        Br{((it.priceETB || it.price * settings.exchangeRateUSDToETB) * it.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-sm border-t border-neutral-200 pt-2">
                    <span>Total Settled:</span>
                    <span>${invoiceOrder.totalUSD} USD</span>
                  </div>
                  <div className="flex justify-between text-neutral-500 font-mono">
                    <span>Equivalent in ETB:</span>
                    <span>Br{(invoiceOrder.totalETB || invoiceOrder.totalUSD * settings.exchangeRateUSDToETB).toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="border-t border-neutral-200 pt-4 text-center text-[10px] text-neutral-400 uppercase tracking-wider">
                Thank you for patronizing authentic Ethiopian artisanal craftsmanship • YeHageré Atelier
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL ORDER MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-neutral-300 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Manual Order (Walk-In / Concierge)
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-neutral-400 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Client Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    placeholder="e.g. Rahel Tadesse"
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 font-bold text-black"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    required
                    value={manualForm.customerEmail}
                    onChange={(e) => setManualForm({ ...manualForm, customerEmail: e.target.value })}
                    placeholder="rahel@gmail.com"
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Select Garment Piece
                </label>
                <select
                  required
                  value={manualForm.selectedProductId}
                  onChange={(e) => setManualForm({ ...manualForm, selectedProductId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 font-bold text-black"
                >
                  <option value="">-- Choose from Catalog --</option>
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} - ${p.price} USD (Br{p.priceETB?.toLocaleString()} ETB)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Size
                  </label>
                  <select
                    value={manualForm.size}
                    onChange={(e) => setManualForm({ ...manualForm, size: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 font-bold text-black"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Colorway
                  </label>
                  <input
                    type="text"
                    value={manualForm.color}
                    onChange={(e) => setManualForm({ ...manualForm, color: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-black font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm({ ...manualForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 font-bold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={manualForm.street}
                    onChange={(e) => setManualForm({ ...manualForm, street: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-black"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-black mb-1">
                    City / Country
                  </label>
                  <input
                    type="text"
                    value={manualForm.city}
                    onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-black mb-1">
                  Payment Method
                </label>
                <select
                  value={manualForm.paymentMethod}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      paymentMethod: e.target.value as CustomerOrder["paymentMethod"],
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 font-bold text-black"
                >
                  <option value="manual_boutique">Boutique In-Person POS / Cash</option>
                  <option value="cash_on_delivery">Cash on Delivery (Addis Ababa)</option>
                  <option value="card">Manual Credit Card / Bank Transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                >
                  Confirm &amp; Log Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
