import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        <main className="min-h-screen bg-neutral-50">
          {children}
          <Toaster position="bottom-right" />
        </main>
      </body>
    </html>
  );
}
