import type { Metadata, Viewport } from "next";
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

/** Edge to edge on a phone, so the night ground runs under the notch and the
 * bar can sit above the home indicator by its safe-area inset. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(max-width: 39.999rem)", color: "#0e0e10" },
    { color: "#f4f1e8" },
  ],
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
