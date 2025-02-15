import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smith Ventures - AI-Powered Investment Decisions",
  description: "Get your startup evaluated by Smith Ventures' AI VC partners with distinct investment philosophies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-neutral-50">
            {children}
          </main>
          <Footer />
          <Toaster position="bottom-right" />
        </div>
      </body>
    </html>
  );
}
