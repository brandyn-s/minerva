import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../components/ui/tokens.css";
import "./globals.css";
import "../components/ui/ui.css";

export const metadata: Metadata = {
  title: "Minerva - A living atlas of ideas",
  description:
    "Explore a prepared living atlas of ideas and trace their contributions in Minerva.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
