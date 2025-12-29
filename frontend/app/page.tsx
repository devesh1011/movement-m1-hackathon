"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { ready, authenticated, login, user } = usePrivy();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkUser = async () => {
      if (authenticated && user?.wallet?.address) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("wallet_address", user.wallet.address)
          .single();

        if (data && data.username) {
          document.cookie = "scavnger-session=logged-in; path=/";
          router.push("/home");
        } else {
          router.push("/onboarding");
        }
      }
    };

    if (ready && authenticated) {
      checkUser();
    }
  }, [ready, authenticated, router, user]);

  const handleLogin = async () => {
    if (!ready) return;
    setIsLoading(true);
    try {
      await login();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-mono selection:bg-[#FAFF00] selection:text-black">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #333 1px, transparent 1px),
            linear-gradient(to bottom, #333 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 border-b border-white/10">
        <div className="flex flex-col">
          <span className="text-[#FAFF00] font-bold tracking-widest text-sm">
            PROTOCOL 75 // SYSTEM_READY
          </span>
          <span className="text-xs text-gray-500">NET_ID: M1_TESTNET</span>
        </div>
        <div className="text-right hidden md:block">
          <span className="block text-xs text-gray-500">LATENCY: 12ms</span>
          <span className="block text-xs text-[#00FF00]">
            CONNECTION: SECURE
          </span>
        </div>
      </header>

      <div className="relative z-10 w-full h-screen flex flex-col md:grid md:grid-cols-12 p-6 md:p-12 pt-24 md:pt-12">
        <div className="md:col-span-8 flex flex-col justify-center">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-[#FAFF00]" />

            <h1
              className="text-6xl md:text-8xl lg:text-[9rem] font-black leading-[0.85] tracking-tighter uppercase transform -ml-1"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                Stake Your
              </span>
              <span className="block text-[#FAFF00] animate-pulse-slow">
                Discipline
              </span>
            </h1>

            <div className="mt-6 md:mt-10 max-w-xl border-l-4 border-white/20 pl-6">
              <p className="text-lg md:text-xl text-gray-400 uppercase tracking-widest leading-relaxed">
                <span className="text-white font-bold">Protocol 75</span> is a
                survival game. Deposit crypto. Complete daily tasks.
                <span className="block mt-2 text-[#FAFF00]">
                  Survivors take the pot.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL PANEL */}
        <div className="md:col-span-4 flex flex-col justify-end md:justify-center mt-12 md:mt-0 relative">
          {/* The "Box" container */}
          <div className="border-2 border-white/20 bg-black/50 backdrop-blur-sm p-6 md:p-8 relative group">
            {/* Box decorations */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-[#FAFF00]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FAFF00]" />

            <div className="mb-6 space-y-2 font-mono text-xs text-[#00FF00]">
              <p>&gt; INITIALIZING HANDSHAKE...</p>
              <p>&gt; DETECTING WALLET ADAPTERS...</p>
              <p className="animate-pulse">&gt; WAITING FOR USER INPUT_</p>
            </div>

            <button
              onClick={handleLogin}
              disabled={!ready || isLoading}
              className="w-full bg-[#FAFF00] hover:bg-[#D4D900] text-black font-black text-2xl py-6 uppercase tracking-tighter transition-all hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_white] hover:shadow-none"
            >
              {isLoading ? "ACCESSING..." : "JACK IN ->"}
            </button>

            <div className="mt-4 text-center border-t border-white/10 pt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Warning: Financial Stakes Are Real.
                <br />
                Cowards need not apply.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 w-full border-t border-white/10 bg-black py-2 px-6 overflow-hidden flex justify-between items-center text-[10px] md:text-xs text-gray-600 font-mono uppercase tracking-widest">
        <span>V1.0.4-BETA</span>
        <span className="hidden md:inline">
          {" "}
          // POWERED BY MOVEMENT NETWORK //{" "}
        </span>
        <span>NO REFUNDS FOR QUITTING</span>
      </footer>

      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            text-shadow: 0 0 20px rgba(250, 255, 0, 0.1);
          }
          50% {
            opacity: 0.8;
            text-shadow: 0 0 40px rgba(250, 255, 0, 0.5);
          }
        }
      `}</style>
    </main>
  );
}
