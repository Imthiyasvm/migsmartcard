import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  weight: "100 900",
});

const display = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-display",
  weight: "100 900",
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
      </body>
    </html>
  );
}
