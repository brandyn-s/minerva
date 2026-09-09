import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Minerva - A living atlas of ideas",
  description: "A starter for exploring ideas with Wander, recombining their contributions, and thinking aloud with Minerva.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
