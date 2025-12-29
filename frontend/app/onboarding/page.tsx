"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !user || !user.wallet) {
    return (
      <div className="min-h-screen bg-black text-[#FAFF00] flex items-center justify-center font-mono animate-pulse">
        LOADING_USER_DATA...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center">
      <OnboardingForm walletAddress={user.wallet.address} userDid={user.id} />
    </main>
  );
}
