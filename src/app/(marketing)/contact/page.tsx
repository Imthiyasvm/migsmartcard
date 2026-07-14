"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail, MapPin, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-slate-500">
          We&apos;d love to hear from you
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          {[
            {
              icon: Mail,
              title: "Email",
              text: "hello@migsmartcard.com",
            },
            {
              icon: MapPin,
              title: "Office",
              text: "Dubai Internet City, Dubai, UAE",
            },
            {
              icon: MessageSquare,
              title: "Support",
              text: "support@migsmartcard.com",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <item.icon className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>
              Sales, support, or partnership inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="py-12 text-center">
                <p className="text-lg font-semibold text-emerald-600">
                  Message sent!
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  We&apos;ll get back to you within 1 business day.
                </p>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Name" required />
                  <Input label="Email" type="email" required />
                </div>
                <Input label="Subject" required />
                <Textarea label="Message" required rows={5} />
                <Button type="submit">Send Message</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
