import type { Metadata } from "next";
import "./globals.css";
import { AntdProvider } from "@/components/providers/AntdProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AvatarProvider } from "@/components/providers/AvatarProvider";
import { PayPalProvider } from "@/components/providers/PayPalProvider";

export const metadata: Metadata = {
  title: "Quoc Nhu NFC Tap",
  description: "NFC sharing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AntdProvider>
          <AuthProvider>
            <PayPalProvider>
              <AvatarProvider>{children}</AvatarProvider>
            </PayPalProvider>
          </AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
