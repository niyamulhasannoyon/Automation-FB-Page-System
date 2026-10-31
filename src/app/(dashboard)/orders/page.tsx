"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatDate } from "@/lib/utils";
import { IOrder, IProduct, OrderStatus } from "@/types";
import {
  ShoppingBag,
  PackageCheck,
  AlertTriangle,
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  XCircle,
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Trash2,
  Edit,
  Tag,
  ArrowRight,
  Clock,
  Layers,
  X,
  User,
} from "lucide-react";

export default function OrdersAndInventoryPage() {
  const activePage = useAppStore((state) => state.activePage);
  const showToast = useAppStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals & Drawer State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

  // Simulator State
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState<
    Array<{
      sender: "customer" | "bot";
      text: string;
      layer?: string;
      layerName?: string;
      orderCreated?: IOrder;
      time: string;
    }>
  >([
    {
      sender: "bot",
      text: "আসসালামু আলাইকুম! আমাদের শপে স্বাগতম। আপনি যেকোনো পণ্যের স্টক ও দাম জানতে পারেন, অথবা সরাসরি অর্ডার করতে পারেন!",
      time: "Just now",
    },
  ]);

  // Form states for manual order
  const [manualOrderForm, setManualOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    productId: "",
    productName: "",
    quantity: 1,
    totalAmount: 0,
    notes: "",
  });

  // Form states for product
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    keywords: "",
    imageUrl: "",
  });

  // Load Data
  const loadData = React.useCallback(async () => {
    if (!activePage) return;
    setIsLoading(true);
    try {
      const [ordersRes, prodsRes] = await Promise.all([
        fetch(`/api/orders?pageId=${activePage.pageId}`),
        fetch(`/api/products?pageId=${activePage.pageId}`),
      ]);

      const ordersData = await ordersRes.json();
      const prodsData = await prodsRes.json();

      if (ordersRes.ok && Array.isArray(ordersData.orders)) {
        setOrders(ordersData.orders);
      }
      if (prodsRes.ok && Array.isArray(prodsData.products)) {
        setProducts(prodsData.products);
      }
    } catch (err) {
      console.error("Error loading orders and inventory:", err);
      showToast("Failed to fetch orders or products", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activePage, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metrics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
  const confirmedRevenue = orders
    .filter((o) => o.status === "confirmed" || o.status === "shipped")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= 3).length;

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        order.productName.toLowerCase().includes(q) ||
        order.customerAddress.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Order Actions
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          notifyCustomer: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update order status.", "error");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );

      const statusLabels = {
        confirmed: "confirmed & customer notified in Messenger",
        shipped: "marked as shipped",
        cancelled: "cancelled",
        pending: "marked as pending",
      };
      showToast(`Order #${data.order.orderNumber} ${statusLabels[newStatus]}!`, "success");
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        showToast("Order removed from queue", "info");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // Stock Quick Adjuster
  const handleAdjustStock = async (productId: string, delta: number) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);

    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          stock: newStock,
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, stock: newStock } : p))
        );
        showToast(`Stock updated to ${newStock} for "${prod.name}"`, "info");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // Save / Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePage) return;

    try {
      if (editingProduct && editingProduct._id) {
        // Edit existing
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct._id,
            ...productForm,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setProducts((prev) =>
            prev.map((p) => (p._id === editingProduct._id ? data.product : p))
          );
          showToast("Product updated successfully!", "success");
          setIsNewProductModalOpen(false);
          setEditingProduct(null);
        } else {
          showToast(data.error || "Failed to update product.", "error");
        }
      } else {
        // Create new
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: activePage.pageId,
            ...productForm,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setProducts((prev) => [data.product, ...prev]);
          showToast("New product created in catalog!", "success");
          setIsNewProductModalOpen(false);
          setProductForm({
            name: "",
            sku: "",
            price: 0,
            stock: 0,
            keywords: "",
            imageUrl: "",
          });
        } else {
          showToast(data.error || "Failed to create product.", "error");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // Manual Order Creation
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePage) return;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: activePage.pageId,
          ...manualOrderForm,
          source: "manual",
          status: "pending",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => [data.order, ...prev]);
        showToast(`Manual order #${data.order.orderNumber} placed!`, "success");
        setIsNewOrderModalOpen(false);
        setManualOrderForm({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          productId: "",
          productName: "",
          quantity: 1,
          totalAmount: 0,
          notes: "",
        });
        // Reload products to reflect any stock change
        loadData();
      } else {
        showToast(data.error || "Failed to create order.", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // Run Simulator Message
  const handleSendSimulatorMessage = async (customText?: string) => {
    const textToSend = customText || simInput;
    if (!textToSend.trim() || !activePage) return;

    const userMsg = textToSend.trim();
    setSimInput("");

    // Append customer message
    setSimMessages((prev) => [
      ...prev,
      {
        sender: "customer",
        text: userMsg,
        time: "Just now",
      },
    ]);

    setSimLoading(true);

    try {
      const res = await fetch("/api/orders/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: activePage.pageId,
          message: userMsg,
          senderName: "রাফি আহমেদ (Tester)",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSimMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            layer: data.layer,
            layerName: data.layerName,
            orderCreated: data.orderCreated,
            time: "Just now",
          },
        ]);

        // If an order was auto-created, refresh orders & products live!
        if (data.orderCreated) {
          setOrders((prev) => [data.orderCreated, ...prev]);
          loadData();
          showToast(
            `🎉 New auto-order #${data.orderCreated.orderNumber} collected from Messenger!`,
            "success"
          );
        }
      } else {
        setSimMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Error: " + (data.error || "Failed to simulate bot response."),
            time: "Just now",
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSimMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Simulation error: " + error.message,
          time: "Just now",
        },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  if (!activePage) {
    return (
      <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 max-w-xl mx-auto my-12">
        <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Page Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please select a connected Facebook Page from the header to view orders and inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              E-Commerce & Smart Inbox Orders
            </h2>
            <Badge variant="purple" size="sm">
              Phase 2 Live
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated Messenger order collection, real-time stock inquiry responses, and AI salesman fallback for {activePage.pageName}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant={isSimulatorOpen ? "secondary" : "outline"}
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            icon={<Bot className="w-3.5 h-3.5 text-blue-400" />}
          >
            {isSimulatorOpen ? "Hide Inbox Bot Simulator" : "Open Inbox Bot Simulator"}
          </Button>

          {activeTab === "orders" ? (
            <Button
              size="sm"
              onClick={() => setIsNewOrderModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Manual Order
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  sku: "",
                  price: 0,
                  stock: 0,
                  keywords: "",
                  imageUrl: "",
                });
                setIsNewProductModalOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrdersCount}
          description="Messenger bot & manual sales"
          icon={ShoppingBag}
          glowColor="blue"
          badge={{ text: "All Time", variant: "info" }}
        />
        <StatCard
          title="Pending Confirmation"
          value={pendingOrdersCount}
          description="Waiting for merchant confirmation"
          icon={Clock}
          glowColor="amber"
          badge={{ text: "Action Needed", variant: "warning" }}
        />
        <StatCard
          title="Confirmed Revenue"
          value={`৳${confirmedRevenue.toLocaleString()}`}
          description="Confirmed & dispatched shipments"
          icon={PackageCheck}
          glowColor="emerald"
          badge={{ text: "Revenue", variant: "success" }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          description="Products with ≤ 3 units or out of stock"
          icon={AlertTriangle}
          glowColor="rose"
          badge={{
            text: lowStockCount > 0 ? "Check Stock" : "Healthy",
            variant: lowStockCount > 0 ? "danger" : "success",
          }}
        />
      </div>

      {/* Interactive "Simulate Inbox Order & Stock Bot" Drawer / Widget */}
      {isSimulatorOpen && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-slate-900/40 to-slate-950/40 overflow-hidden shadow-glow">
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Interactive Messenger Inbox & Stock Bot Simulator</span>
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    3-Layer Intelligence
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Test customer conversations live: ask about stock (&quot;স্টক আছে?&quot;), price (&quot;দাম কত?&quot;), or send an order with your phone number!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Chat Simulation View (2 columns) */}
            <div className="lg:col-span-2 flex flex-col h-80">
              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
                {simMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === "customer" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === "customer"
                          ? "bg-blue-600 text-white rounded-br-sm shadow-md"
                          : "bg-white/[0.07] border border-white/10 text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.layerName && (
                        <div className="mb-1.5 pb-1 border-b border-white/10 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-cyan-300">
                          <Layers className="w-3 h-3" />
                          <span>{msg.layerName}</span>
                        </div>
                      )}

                      <p className="whitespace-pre-line">{msg.text}</p>

                      {msg.orderCreated && (
                        <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Live Order Created in Database!
                          </p>
                          <p className="font-mono text-[10px]">
                            ID: {msg.orderCreated.orderNumber} • {msg.orderCreated.productName} • ৳{msg.orderCreated.totalAmount}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 px-1 mt-1 font-mono">
                      {msg.sender === "customer" ? "Customer" : "AutoPage Bot"} • {msg.time}
                    </span>
                  </div>
                ))}

                {simLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>Bot intelligence pipeline is parsing message...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-white/10 bg-slate-950/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendSimulatorMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    placeholder="Type sample message (e.g., 'স্টক আছে?', 'দাম কত?', or full order with 017...)"
                    className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!simInput.trim() || simLoading}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </div>

            {/* Quick Test Prompt Shortcuts (1 column) */}
            <div className="p-4 bg-white/[0.01] flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                  Click Sample Scenarios to Test
                </h4>

                <div className="space-y-2">
                  <button
                    onClick={() =>
                      handleSendSimulatorMessage("পাঞ্জাবির স্টক আছে?")
                    }
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-blue-300 block">
                        📦 Check Stock Inquiry
                      </span>
                      <span className="text-[11px] text-slate-400">
                        &quot;পাঞ্জাবির স্টক আছে?&quot;
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() =>
                      handleSendSimulatorMessage("ইয়ারবাডস এর দাম কত?")
                    }
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-emerald-300 block">
                        💰 Price Inquiry
                      </span>
                      <span className="text-[11px] text-slate-400">
                        &quot;ইয়ারবাডস এর দাম কত?&quot;
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() =>
                      handleSendSimulatorMessage(
                        "আমার নাম রাফি, ফোন 01712345678, ঠিকানা ধানমন্ডি ঢাকা, ১টা পাঞ্জাবি অর্ডার করতে চাই"
                      )
                    }
                    className="w-full text-left p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-cyan-300 block">
                        🎉 Auto-Order Bengali
                      </span>
                      <span className="text-[10px] text-slate-300 line-clamp-1">
                        &quot;নাম রাফি, ফোন 01712345678, ধানমন্ডি ঢাকা, ১টা পাঞ্জাবি&quot;
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() =>
                      handleSendSimulatorMessage(
                        "ডেলিভারি চার্জ কত এবং কতদিন লাগবে?"
                      )
                    }
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-indigo-300 block">
                        🤖 AI Salesman Fallback
                      </span>
                      <span className="text-[11px] text-slate-400">
                        &quot;ডেলিভারি চার্জ কত এবং কতদিন লাগবে?&quot;
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-400">
                💡 <span className="text-white font-medium">Pro-Tip:</span> When an order is placed, it immediately inserts into the live Orders table below and automatically decrements product inventory!
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs Switcher: Orders Queue vs Product Stock Inventory */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-blue-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders Queue ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "inventory"
                ? "bg-blue-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Product Inventory ({products.length})</span>
          </button>
        </div>

        {/* Search & Status Filters for Orders */}
        {activeTab === "orders" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, phone, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs text-white w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1">
              {["all", "pending", "confirmed", "shipped", "cancelled"].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ORDERS QUEUE TABLE                                 */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Customer Orders Queue</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time orders parsed from Facebook Messenger chats and manual entries
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadData}
                isLoading={isLoading}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No orders match your filter criteria. Use the simulator above to place a test order!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-wider bg-white/[0.01]">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Delivery Address</th>
                      <th className="py-3 px-4">Item & Qty</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.map((order) => {
                      const statusVariants: Record<
                        OrderStatus,
                        "warning" | "info" | "success" | "danger"
                      > = {
                        pending: "warning",
                        confirmed: "info",
                        shipped: "success",
                        cancelled: "danger",
                      };

                      return (
                        <tr
                          key={order._id || order.orderNumber}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Order Number & Date */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-white whitespace-nowrap">
                            <span className="text-blue-400">{order.orderNumber}</span>
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {formatDate(order.createdAt)}
                            </span>
                          </td>

                          {/* Customer Name & Phone */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{order.customerName}</span>
                            </div>
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{order.customerPhone}</span>
                            </a>
                          </td>

                          {/* Customer Address */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-slate-300 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span title={order.customerAddress}>
                                {order.customerAddress}
                              </span>
                            </p>
                          </td>

                          {/* Product Name & Qty */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-white font-medium">
                              {order.productName}
                            </span>
                            <span className="text-slate-400 block text-[11px] font-mono">
                              Qty: {order.quantity}
                            </span>
                          </td>

                          {/* Total Amount */}
                          <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                            ৳{order.totalAmount.toLocaleString()}
                          </td>

                          {/* Source */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {order.source === "messenger_auto" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                                <Bot className="w-2.5 h-2.5" /> Bot Auto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-300 text-[10px] font-mono border border-slate-500/20">
                                Manual
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge
                              variant={statusVariants[order.status]}
                              size="sm"
                            >
                              {order.status}
                            </Badge>
                          </td>

                          {/* One-Click Action Buttons */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.status === "pending" && (
                                <button
                                  onClick={() =>
                                    order._id &&
                                    handleUpdateOrderStatus(order._id, "confirmed")
                                  }
                                  title="Confirm order & notify customer on Messenger"
                                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Confirm</span>
                                </button>
                              )}

                              {order.status === "confirmed" && (
                                <button
                                  onClick={() =>
                                    order._id &&
                                    handleUpdateOrderStatus(order._id, "shipped")
                                  }
                                  title="Mark order as dispatched with courier"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Ship</span>
                                </button>
                              )}

                              {order.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    order._id &&
                                    handleUpdateOrderStatus(order._id, "cancelled")
                                  }
                                  title="Cancel order"
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  order._id && handleDeleteOrder(order._id)
                                }
                                title="Delete record"
                                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PRODUCT STOCK INVENTORY VIEW                       */}
      {/* ======================================================== */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => {
              const inStock = product.stock > 0;
              const isLowStock = product.stock > 0 && product.stock <= 3;

              return (
                <Card
                  key={product._id}
                  className="overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all group"
                >
                  <div>
                    {/* Product Image Banner */}
                    <div className="h-40 w-full relative bg-slate-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          product.imageUrl ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={
                            !inStock
                              ? "danger"
                              : isLowStock
                              ? "warning"
                              : "success"
                          }
                          size="sm"
                        >
                          {!inStock
                            ? "Stock Out"
                            : isLowStock
                            ? `Low Stock (${product.stock})`
                            : `In Stock (${product.stock})`}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300">
                        SKU: {product.sku || "N/A"}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {product.name}
                          </h3>
                          <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                            ৳{product.price.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Keywords Badges for Bot Matching */}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                          Bot Matching Keywords:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {product.keywords?.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300 font-sans"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Quick Controls */}
                  <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          product._id && handleAdjustStock(product._id, -1)
                        }
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Decrement stock by 1"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>

                      <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-white/5 min-w-8 text-center">
                        {product.stock}
                      </span>

                      <button
                        onClick={() =>
                          product._id && handleAdjustStock(product._id, 1)
                        }
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Increment stock by 1"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            name: product.name,
                            sku: product.sku || "",
                            price: product.price,
                            stock: product.stock,
                            keywords: product.keywords?.join(", ") || "",
                            imageUrl: product.imageUrl || "",
                          });
                          setIsNewProductModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        title="Edit product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Delete product "${product.name}"?`
                            )
                          )
                            return;
                          if (!product._id) return;
                          const res = await fetch(
                            `/api/products?id=${product._id}`,
                            { method: "DELETE" }
                          );
                          if (res.ok) {
                            setProducts((prev) =>
                              prev.filter((p) => p._id !== product._id)
                            );
                            showToast("Product deleted.", "info");
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                */}
      {/* ======================================================== */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-white/15 bg-slate-900/90 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? "Edit Product" : "Add Product to Inventory"}
              </h3>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Cotton Panjabi"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl glass-input text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="1850"
                    value={productForm.price || ""}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl glass-input text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={productForm.stock || ""}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl glass-input text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  placeholder="PAN-001"
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm({ ...productForm, sku: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl glass-input text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bot Trigger Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="panjabi, পাঞ্জাবি, punjabi, cotton panjabi"
                  value={productForm.keywords}
                  onChange={(e) =>
                    setProductForm({ ...productForm, keywords: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl glass-input text-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  When customers mention these in comments or inbox, the bot auto-responds with stock and price.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, imageUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl glass-input text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewProductModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE MANUAL ORDER                               */}
      {/* ======================================================== */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/15 bg-slate-900/90 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                Place Manual Customer Order
              </h3>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateManualOrder}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="রাকিব হাসান"
                    value={manualOrderForm.customerName}
                    onChange={(e) =>
                      setManualOrderForm({
                        ...manualOrderForm,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl glass-input text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    BD Mobile Number (01[3-9]...) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01712345678"
                    pattern="^01[3-9]\d{8}$"
                    value={manualOrderForm.customerPhone}
                    onChange={(e) =>
                      setManualOrderForm({
                        ...manualOrderForm,
                        customerPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl glass-input text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা"
                  value={manualOrderForm.customerAddress}
                  onChange={(e) =>
                    setManualOrderForm({
                      ...manualOrderForm,
                      customerAddress: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl glass-input text-white"
                />
              </div>

              {/* Product Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={manualOrderForm.productId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const prod = products.find((p) => p._id === selId);
                    if (prod) {
                      setManualOrderForm({
                        ...manualOrderForm,
                        productId: selId,
                        productName: prod.name,
                        totalAmount: prod.price * manualOrderForm.quantity,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white bg-slate-900"
                >
                  <option value="">-- Choose from Catalog --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ৳{p.price} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualOrderForm.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const prod = products.find(
                        (p) => p._id === manualOrderForm.productId
                      );
                      const price = prod ? prod.price : 0;
                      setManualOrderForm({
                        ...manualOrderForm,
                        quantity: qty,
                        totalAmount: price * qty,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Total Amount (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={manualOrderForm.totalAmount || ""}
                    onChange={(e) =>
                      setManualOrderForm({
                        ...manualOrderForm,
                        totalAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl glass-input text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Redx courier delivery note"
                  value={manualOrderForm.notes}
                  onChange={(e) =>
                    setManualOrderForm({
                      ...manualOrderForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl glass-input text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewOrderModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
