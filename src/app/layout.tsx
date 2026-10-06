import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";
import { CartProvider } from "@/lib/store/cart-context";
import { LanguageProvider } from "@/components/ui/LanguageSelector";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Velvet Bloom Café — Sip. Savor. Bloom.",
  description: "A premium digital ordering experience from Velvet Bloom Café. Powered by Kage Origin.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} dark`}>
      <body className="bg-[#080808] text-[#F6EFE7] font-sans antialiased min-h-screen flex flex-col selection:bg-[#C99A8A]/30 selection:text-[#F6EFE7]">
        <LanguageProvider>
          <CartProvider>
            <div className="flex-1 flex flex-col pb-16 sm:pb-0">
              {children}
            </div>
            <MobileBottomNav />
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: "#171717",
                  border: "1px solid #2e2e2e",
                  color: "#F6EFE7",
                },
              }}
            />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
