"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Initialize Movement Client
const config = new AptosConfig({
  fullnode: "https://testnet.movementnetwork.xyz/v1",
  network: Network.CUSTOM,
});
const aptos = new Aptos(config);

export default function ChallengesFeed() {
  const router = useRouter();
  const { authenticated, ready, user } = usePrivy();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }

    if (authenticated) {
      fetchLiveProtocols();
    }
  }, [ready, authenticated, router]);

  const fetchLiveProtocols = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Fetch metadata from Supabase
      const { data: metaData, error } = await supabase
        .from("challenges")
        .select("*");

      if (error) {
        console.error("Supabase error fetching challenge_metadata:", error);
        setErrorMsg(error.message || "Failed to load protocols from Supabase.");
        setChallenges([]);
        return;
      }

      if (!metaData) {
        console.warn("No protocol metadata returned from Supabase.");
        setChallenges([]);
        return;
      }

      // 2. Map or enrich on-chain state here if needed
      setChallenges(metaData || []);
    } catch (err: any) {
      const message = err?.message || String(err) || "Unknown error";
      console.error("Error loading protocols:", message, err);
      setErrorMsg(message);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  if (!ready || loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[#FAFF00]">
        SCANNING_SECTORS...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#FAFF00] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-l-4 border-[#FAFF00] pl-6">
          <div>
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <span className="text-white">ACTIVE</span>
              <br />
              <span className="text-[#FAFF00]">ZONES</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-mono mt-2">
              {challenges.length} PROTOCOLS AVAILABLE
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/create">
              <button className="bg-white text-black font-black px-6 py-2 uppercase text-sm hover:bg-[#FAFF00] transition-all shadow-[4px_4px_0px_#444]">
                + Initialize New Protocol
              </button>
            </Link>
          </div>
        </div>

        {/* Challenges Grid */}
        {errorMsg ? (
          <div className="border-2 border-red-600 bg-black/60 p-6 text-center text-red-400 uppercase font-mono mb-6">
            Error loading protocols: {errorMsg}
          </div>
        ) : null}

        {challenges.length === 0 ? (
          <div className="border-2 border-dashed border-white/10 p-20 text-center uppercase font-mono text-gray-600">
            No active protocols detected in this sector.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenge/${challenge.id}`}
                className="group relative border-2 border-white/20 bg-black/50 p-6 transition-all hover:border-[#FAFF00]"
              >
                <div className="group relative border-2 border-white/10 bg-black hover:border-[#FAFF00] transition-all p-4">
                  {/* Category Tag */}
                  <span className="absolute -top-3 left-4 bg-[#FAFF00] text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter">
                    {challenge.category || "General"}
                  </span>

                  <div className="aspect-video w-full bg-gray-900 mb-4 overflow-hidden relative">
                    {challenge.cover_image_url ? (
                      <img
                        src={challenge.cover_image_url}
                        alt=""
                        className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-800 font-black text-4xl italic">
                        SCAV
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-black uppercase mb-4 group-hover:text-[#FAFF00] transition-colors">
                    {challenge.title || `Protocol #${challenge.challenge_id}`}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 font-mono text-[11px] uppercase border-t border-white/10 pt-4">
                    <div className="text-gray-500">
                      STAKE: <span className="text-white">-- MOVE</span>
                    </div>
                    <div className="text-gray-500">
                      ENROLLED: <span className="text-white">ACTIVE</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="w-full py-3 border border-white/20 text-center text-xs font-bold group-hover:bg-white group-hover:text-black transition-all">
                      VIEW INTEL_
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
