import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BillDrop - Find and Cancel Unused Subscriptions",
  description: "Stop paying for subscriptions you don't use. BillDrop scans your email to find hidden recurring charges and helps you cancel them in seconds.",
  keywords: ["subscription tracker", "cancel subscriptions", "save money", "recurring charges", "subscription management"],
  authors: [{ name: "BillDrop" }],
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BillDrop - Find and Cancel Unused Subscriptions",
    description: "We'll help you find and cancel unused subscriptions in minutes. No bank linking required.",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "BillDrop Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillDrop - Find and Cancel Unused Subscriptions",
    description: "Stop paying for subscriptions you don't use. BillDrop scans your email to find hidden recurring charges.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
