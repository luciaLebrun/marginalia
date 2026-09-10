import type { Metadata } from "next";
import { Archivo } from "next/font/google";

import "./globals.css";

/**
 * One family doing every job through weight and width — the Penguin move. A
 * second face would break the system this whole surface is built on.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Marginalia",
  description: "A reading diary. Log a book, rate it, review it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
