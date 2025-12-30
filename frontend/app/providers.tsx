"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WalletProvider } from "../components/wallet-providers";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "YOUR_PRIVY_APP_ID"}
        config={{
          loginMethods: ["email", "google", "twitter", "discord", "github"],
        }}
      >
        <UserSyncWrapper>{children}</UserSyncWrapper>
      </PrivyProvider>
    </WalletProvider>
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
