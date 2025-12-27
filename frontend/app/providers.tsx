"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmjmq5tva04wki90c88mo1464"
      clientId="client-WY6UFrg1gcWQbsc5h5s5aabPsjk8dQfwknc4Az5kmxnhR"
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
