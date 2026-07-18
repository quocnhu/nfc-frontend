"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const isPayPalConfigured = clientId && !clientId.startsWith("your-paypal");

const initialOptions = {
  clientId: isPayPalConfigured ? clientId : "test",
  currency: "USD",
  intent: "capture",
};

export function PayPalProvider({ children }: { children: React.ReactNode }) {
  // If PayPal is not configured, just render children without the provider
  if (!isPayPalConfigured) {
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  );
}
