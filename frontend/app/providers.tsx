"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { defineChain } from "viem";

export const movement = defineChain({
  id: 250,
  name: "Movement Testnet",
  network: "Movement Testnet",
  nativeCurrency: {
    decimals: 18, // Replace this with the number of decimals for your chain's native token
    name: "MOVE",
    symbol: "MOVE",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.movementnetwork.xyz/v1"],
    },
  },
  blockExplorers: {
    default: {
      name: "Movement Bardrock Explorer",
      url: "https://explorer.movementnetwork.xyz/?network=bardock+testnet",
    },
  },
});

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
        defaultChain: movement,
        supportedChains: [movement],
      }}
    >
      <UserSyncWrapper>{children}</UserSyncWrapper>
    </PrivyProvider>
  );
}

function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { user, authenticated, ready } = usePrivy();

  useEffect(() => {
    const syncUser = async () => {
      if (ready && authenticated && user?.wallet?.address) {
        const { data, error } = await supabase
          .from("profiles")
          .upsert(
            {
              wallet_address: user.wallet.address,
              email: user.email?.address || null,
              // Use Google picture if available, otherwise Twitter, otherwise null
              avatar_url:
                user.google?.picture || user.twitter?.profilePictureUrl || null,
              last_login: new Date().toISOString(),
            },
            {
              onConflict: "wallet_address",
            }
          )
          .select();

        if (error) {
          console.error("❌ SUPABASE SYNC ERROR:", error.message);
        } else {
          console.log("✅ SYNC SUCCESS:", data);
        }
      }
    };

    syncUser();
  }, [ready, authenticated, user]);

  return <>{children}</>;
}
