import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/web3-provider";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rozo | One Tap to Pay",
  description: "Increase the GDP of Crypto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="flex h-full flex-col gap-4 md:min-h-screen md:items-center md:justify-center md:py-4">
          <Web3Provider>{children}</Web3Provider>
          <Toaster position="top-center" />
          <Footer />
        </main>
      </body>
    </html>
  );
}
