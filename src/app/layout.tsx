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
  openGraph: {
    title: "BillDrop - Find and Cancel Unused Subscriptions",
    description: "We'll help you find and cancel unused subscriptions in minutes. No bank linking required.",
    type: "website",
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
