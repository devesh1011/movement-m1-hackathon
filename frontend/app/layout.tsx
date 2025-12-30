import type React from "react";
import type { Metadata } from "next";
import { JetBrains_Mono, Chakra_Petch } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";

const monoFont = JetBrains_Mono({ subsets: ["latin"] });
const titleFont = Chakra_Petch({ subsets: ["latin"], weight: ["700"] });

export const metadata: Metadata = {
  title: "SCAVNGER - Web3 Challenge Protocol",
  description: "Stake your discipline. Survive to earn.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${monoFont.className} antialiased bg-black text-white`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
