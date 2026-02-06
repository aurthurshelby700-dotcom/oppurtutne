import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Switch to Inter
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

// Configure standard Inter font
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Opportune | Connect, Earn, Grow",
  description: "A platform where opportunities find you. For freelancers, clients, and professionals.",
};

import { UserProvider } from "@/context/UserContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <UserProvider>
          <NotificationProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
