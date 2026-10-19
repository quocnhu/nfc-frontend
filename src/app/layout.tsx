import type { Metadata } from "next";
import "./globals.css";
import { AntdProvider } from "@/components/providers/AntdProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AvatarProvider } from "@/components/providers/AvatarProvider";

export const metadata: Metadata = {
  title: "QuocNhu's Website",
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
            <AvatarProvider>{children}</AvatarProvider>
          </AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
