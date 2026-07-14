"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { CardOrder } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<CardOrder[]>([]);

  const load = () => {
    fetch("/api/admin?resource=orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (
    orderId: string,
    status: string,
    trackingNumber?: string
  ) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-order",
        orderId,
        status,
        trackingNumber,
      }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Card Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage physical MigSmartCard shipments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> {orders.length} Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 && (
            <p className="py-8 text-center text-slate-400">No orders yet</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold capitalize">
                    {o.design.replace(/-/g, " ")} × {o.quantity}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(o.createdAt)} · ${o.totalAmount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ship to: {o.shippingAddress}
                  </p>
                  <p className="text-xs text-slate-400">User: {o.userId}</p>
                </div>
                <Badge className="capitalize">{o.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Select
                  value={o.status}
                  onValueChange={(v) => update(o.id, v, o.trackingNumber)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Tracking #"
                  defaultValue={o.trackingNumber || ""}
                  className="max-w-[180px]"
                  onBlur={(e) => {
                    if (e.target.value !== (o.trackingNumber || "")) {
                      update(o.id, o.status, e.target.value);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    update(o.id, "shipped", o.trackingNumber || `MIG-TRK-${Date.now().toString().slice(-6)}`)
                  }
                >
                  Mark Shipped
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
