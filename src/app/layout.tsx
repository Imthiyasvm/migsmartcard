import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "MigSmartCard — Smarter Way to Connect",
    template: "%s | MigSmartCard",
  },
  description:
    "Create, manage, and share digital business cards via NFC, QR code, and link. Capture leads, track analytics, and grow your network with MigSmartCard.",
  keywords: [
    "digital business card",
    "NFC card",
    "smart business card",
    "QR code card",
    "networking",
    "lead capture",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "MigSmartCard — Smarter Way to Connect",
    description:
      "The modern digital business card platform with NFC, QR, analytics & lead capture.",
    type: "website",
    siteName: "MigSmartCard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
