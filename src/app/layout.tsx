import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Burger Poll 🍔",
  description: "Vote for your favourite burger and watch the results live.",
};

export const viewport: Viewport = {
  themeColor: "#fef3c7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
