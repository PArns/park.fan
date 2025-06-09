import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "park.fan - Deine Freizeitpark Community",
  description: "Live Wartezeiten, Park-Bewertungen und Community für Freizeitpark-Fans. Entdecke die besten Attraktionen und teile deine Erfahrungen.",
  authors: [{ name: "Patrick Arns", url: "https://arns.dev" }],
  creator: "Patrick Arns",
  publisher: "Patrick Arns",
  metadataBase: new URL("https://park.fan"),
  keywords: ["Freizeitpark", "Wartezeiten", "Community", "Attraktionen", "Theme Park"],
  other: {
    "copyright": "© Patrick Arns - https://arns.dev"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
