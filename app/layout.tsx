import { FabActions } from "@/components/fab-actions";
import Footer from "@/components/footer";
import IntercomInitializer from "@/components/intercom";
import { Toaster } from "@/components/ui/sonner";
import { Web3Provider } from "@/providers/web3-provider";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Rozo | One Tap to Pay",
  description: "Increase the GDP of Crypto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-card`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="flex min-h-screen flex-col justify-between gap-4 md:min-h-screen md:items-center md:justify-center py-4">
            <Web3Provider>{children}</Web3Provider>
            <Toaster position="top-center" />
            <IntercomInitializer
              appId={process.env.INTERCOM_APP_ID as string}
            />
            <FabActions />
            <Footer />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
