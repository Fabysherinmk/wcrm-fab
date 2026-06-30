"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  ArrowLeft,
  Minus,
  Plus,
  MapPin,
  CheckCircle,
  Info,
  RefreshCw,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Outlet {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface OrderFormProps {
  run: {
    id: string;
    account_id: string;
  };
  initialOutlets: Outlet[];
}

interface Product {
  id: string;
  name: string;
  translation: string;
  description: string;
  price: number;
  category: "Juice" | "Burger" | "Sandwich";
}

const PRODUCTS: Product[] = [
  // Juices
  {
    id: "juice_mango",
    name: "Mango Juice",
    translation: "عصير مانجو",
    description: "Creamy, fresh mango pulp blended with chilled milk and ice.",
    price: 120,
    category: "Juice",
  },
  {
    id: "juice_avocado",
    name: "Avocado Juice",
    translation: "عصير أفوكادو",
    description: "Rich and buttery avocado blended thick, served super cold.",
    price: 150,
    category: "Juice",
  },
  {
    id: "juice_orange",
    name: "Orange Juice",
    translation: "عصير برتقال",
    description: "Freshly squeezed sweet oranges, loaded with Vitamin C.",
    price: 100,
    category: "Juice",
  },
  // Burgers
  {
    id: "burger_chicken",
    name: "Chicken Burger",
    translation: "برجر دجاج",
    description: "Crispy fried chicken breast, melted cheese, lettuce, and secret sauce.",
    price: 180,
    category: "Burger",
  },
  {
    id: "burger_beef",
    name: "Beef Burger",
    translation: "برجر لحم",
    description: "Flame-grilled double beef patty, cheddar cheese, pickles, and classic mayo.",
    price: 220,
    category: "Burger",
  },
  {
    id: "burger_cheese",
    name: "Cheese Burger",
    translation: "برجر جبن",
    description: "Juicy cheese patty, fresh tomato slices, onions, and garlic aioli.",
    price: 160,
    category: "Burger",
  },
  // Sandwiches
  {
    id: "sandwich_club",
    name: "Club Sandwich",
    translation: "كلوب ساندوتش",
    description: "Triple-decker toasted sandwich with chicken, boiled egg, lettuce, and tomatoes.",
    price: 140,
    category: "Sandwich",
  },
  {
    id: "sandwich_cheese",
    name: "Cheese Sandwich",
    translation: "ساندوتش جبن",
    description: "Grilled sandwich loaded with mozzarella and cheddar, toasted in herb butter.",
    price: 110,
    category: "Sandwich",
  },
  {
    id: "sandwich_egg",
    name: "Egg Sandwich",
    translation: "ساندوتش بيض",
    description: "Soft toast stuffed with classic egg salad, light pepper, and fresh chives.",
    price: 90,
    category: "Sandwich",
  },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseGoogleMapsLink(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  try {
    const pathMatch = url.match(/@([-\d.]+),([-\d.]+)/);
    if (pathMatch) {
      const lat = parseFloat(pathMatch[1]);
      const lng = parseFloat(pathMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    const queryMatch = url.match(/[?&](query|q)=([-\d.]+),([-\d.]+)/);
    if (queryMatch) {
      const lat = parseFloat(queryMatch[2]);
      const lng = parseFloat(queryMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  } catch (e) {
    console.error("Failed to parse map link:", e);
  }
  return null;
}

export default function OrderForm({ run, initialOutlets }: OrderFormProps) {
  const [mode, setMode] = useState<"catalog" | "checkout" | "success">("catalog");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [place, setPlace] = useState("");
  const [roadRoute, setRoadRoute] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [customizations, setCustomizations] = useState("");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [coordsLoading, setCoordsLoading] = useState(false);
  const [nearestOutlet, setNearestOutlet] = useState<(Outlet & { distance: number }) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItems = PRODUCTS.filter((p) => (quantities[p.id] ?? 0) > 0).map((p) => ({
    ...p,
    quantity: quantities[p.id],
    itemTotal: p.price * quantities[p.id],
  }));

  const cartTotalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalAmount = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);

  useEffect(() => {
    if (coords.lat !== null && coords.lng !== null && initialOutlets.length > 0) {
      let minDistance = Infinity;
      let closest: (Outlet & { distance: number }) | null = null;

      for (const outlet of initialOutlets) {
        const dist = getDistance(
          coords.lat,
          coords.lng,
          outlet.latitude,
          outlet.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          closest = { ...outlet, distance: dist };
        }
      }
      setNearestOutlet(closest);
    } else {
      setNearestOutlet(null);
    }
  }, [coords, initialOutlets]);

  const handleMapsLinkChange = (url: string) => {
    setGoogleMapsLink(url);
    const parsed = parseGoogleMapsLink(url);
    if (parsed) {
      setCoords({ lat: parsed.lat, lng: parsed.lng });
      toast.success("Coordinates resolved from Maps link!");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setCoordsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setCoordsLoading(false);
        toast.success("Successfully captured your current location!");
      },
      (error) => {
        setCoordsLoading(false);
        console.error("Geolocation error:", error);
        toast.error("Unable to retrieve location. Please paste a Google Maps link instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpdateQuantity = (productId: string, change: number) => {
    setQuantities((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + change);
      return { ...prev, [productId]: next };
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Your cart is empty! Add products first.");
      return;
    }

    if (!place || !roadRoute || !houseNumber) {
      toast.error("Please fill in your delivery address details.");
      return;
    }

    if (coords.lat === null || coords.lng === null) {
      toast.error("Please capture coordinates using 'Use Current Location' or paste a Google Maps Link.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/order/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: run.id,
          cart: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: cartTotalAmount,
          address: {
            place,
            roadRoute,
            houseNumber,
          },
          coords,
          googleMapsLink,
          customizations,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error ?? "Failed to submit order.");
      }

      setMode("success");
      toast.success("Order placed successfully! Check WhatsApp.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["Juice", "Burger", "Sandwich"] as const;

  if (mode === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans text-slate-800">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Confirmed!</h1>
            <p className="text-slate-500 text-sm">
              Thank you for ordering with <span className="text-emerald-600 font-semibold">Al-wow boofya</span>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-3 text-xs">
            <h3 className="font-semibold text-slate-500 border-b border-slate-200 pb-2 text-[11px] uppercase tracking-wider">
              Order Details
            </h3>
            <div className="divide-y divide-slate-200 space-y-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between py-1 text-slate-700">
                  <span>
                    {item.name} <span className="text-slate-400 font-semibold">x{item.quantity}</span>
                  </span>
                  <span>₹{item.itemTotal}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-slate-900">
              <span>Total Amount</span>
              <span className="text-emerald-600">₹{cartTotalAmount}</span>
            </div>
            {nearestOutlet && (
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Outlet Routing:</span> {nearestOutlet.name} ({nearestOutlet.distance.toFixed(2)} km away)
              </div>
            )}
          </div>

          <p className="text-slate-500 text-xs leading-relaxed">
            A confirmation message containing receipt details has been sent to your WhatsApp.
          </p>

          <div className="pt-2">
            <p className="text-[10px] text-slate-400 font-semibold">You may close this tab now.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-slate-800 selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3.5 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {mode === "checkout" ? (
            <button
              onClick={() => setMode("catalog")}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Menu
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
              Al-wow boofya
            </span>
          )}

          <h1 className="text-base font-extrabold tracking-tight text-slate-900">
            {mode === "checkout" ? "Confirm Checkout" : "Product Collections"}
          </h1>

          <div className="relative">
            <ShoppingBag className="h-5 w-5 text-slate-600" />
            {cartTotalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white">
                {cartTotalItemsCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {mode === "catalog" ? (
          <div className="space-y-8">
            {/* Promo banner */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 text-emerald-600">
                <Sparkles className="h-32 w-32" />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                  Welcome Menu
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">Choose Your Feast!</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs pt-1">
                  Add items to your cart, set your location, and customize your orders in just a few taps.
                </p>
              </div>
            </div>

            {/* Catalog list */}
            {categories.map((category) => (
              <section key={category} className="space-y-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                  <span className="h-4.5 w-1 rounded bg-emerald-500"></span>
                  {category === "Juice" && "Fresh Juices"}
                  {category === "Burger" && "Flame-Grilled Burgers"}
                  {category === "Sandwich" && "Gourmet Sandwiches"}
                </h2>

                <div className="space-y-3">
                  {PRODUCTS.filter((p) => p.category === category).map((product) => {
                    const quantity = quantities[product.id] ?? 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-50 hover:border-slate-200/80"
                      >
                        {/* Image Placeholder */}
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest relative overflow-hidden">
                          {product.category.substring(0, 3)}
                        </div>

                        {/* Middle Content */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-baseline justify-between gap-1">
                            <h3 className="truncate text-sm font-bold text-slate-950">
                              {product.name}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {product.translation}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[11px] text-slate-500 leading-normal">
                            {product.description}
                          </p>
                          <div className="text-xs font-bold text-emerald-600 pt-0.5">
                            ₹{product.price.toFixed(2)}
                          </div>
                        </div>

                        {/* Right Qty Selector */}
                        <div className="shrink-0">
                          {quantity === 0 ? (
                            <button
                              onClick={() => handleUpdateQuantity(product.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-white border border-slate-200 px-1.5 py-1 rounded-full shadow-sm">
                              <button
                                onClick={() => handleUpdateQuantity(product.id, -1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-4 text-center text-xs font-bold text-slate-800">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(product.id, 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Checkout View */
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Cart Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                Cart Items Summary
              </h2>
              <div className="divide-y divide-slate-100 space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <div className="text-[10px] text-slate-400">₹{item.price} each</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">Qty: {item.quantity}</span>
                      <span className="font-bold text-slate-800">₹{item.itemTotal}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 font-bold text-sm text-slate-900">
                <span>Grand Total</span>
                <span className="text-emerald-600 text-base">₹{cartTotalAmount}</span>
              </div>
            </div>

            {/* Location Subsection */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Delivery Location Coordinates
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={coordsLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {coordsLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "📍 Use Current Location"
                    )}
                  </button>
                  <span className="inline-flex items-center justify-center text-[10px] text-slate-500 text-center font-semibold bg-white border border-slate-200 px-2 rounded-lg">
                    {coords.lat && coords.lng
                      ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                      : "No coords captured"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Google Maps link
                  </label>
                  <input
                    type="text"
                    value={googleMapsLink}
                    onChange={(e) => handleMapsLinkChange(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:outline-none"
                  />
                  <p className="text-[9px] text-slate-400">
                    Paste maps links to parse coordinates automatically.
                  </p>
                </div>

                {nearestOutlet && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <Info className="h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <span className="font-bold">Nearest Outlet found:</span> {nearestOutlet.name}
                      <span className="block text-[10px] text-emerald-600/80">
                        Approximately {nearestOutlet.distance.toFixed(2)} km away from you.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Details Subsection */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider">
                Delivery Address Details
              </h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Place / Locality
                  </label>
                  <input
                    type="text"
                    required
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Kakkanad, Kochi"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Road / Route / Landmark
                  </label>
                  <input
                    type="text"
                    required
                    value={roadRoute}
                    onChange={(e) => setRoadRoute(e.target.value)}
                    placeholder="e.g. Near Infopark Express Highway"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    House / Flat / Shop Number
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. Villa 12B, Skyline Apartments"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Customizations / Feedback */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Customizations & Feedback
              </h2>
              <div className="space-y-1.5">
                <textarea
                  value={customizations}
                  onChange={(e) => setCustomizations(e.target.value)}
                  placeholder="e.g. Extra sugar on Mango juice, no cheese on Chicken burger, spicy sandwich..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500/50 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/10"
            >
              {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
              Confirm Order (₹{cartTotalAmount})
            </button>
          </form>
        )}
      </main>

      {/* Sticky Bottom View Cart Bar */}
      {mode === "catalog" && cartTotalItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Cart Total
              </div>
              <div className="text-base font-extrabold text-slate-900">
                ₹{cartTotalAmount.toFixed(2)}
                <span className="text-xs text-slate-500 font-normal pl-1.5">
                  ({cartTotalItemsCount} {cartTotalItemsCount === 1 ? "item" : "items"})
                </span>
              </div>
            </div>

            <button
              onClick={() => setMode("checkout")}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-[0.98]"
            >
              View cart ({cartTotalItemsCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
