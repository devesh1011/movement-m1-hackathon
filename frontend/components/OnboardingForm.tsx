"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingForm({
  walletAddress,
  userDid,
}: {
  walletAddress: string;
  userDid: string;
}) {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    if (username.length < 3) return alert("HANDLE TOO SHORT");
    setIsSubmitting(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        bio,
        last_login: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress);

    if (!error) {
      router.push("/home");
    } else {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full border-4 border-[#FAFF00] bg-black p-8 shadow-[12px_12px_0px_#333]">
      <h2 className="text-3xl font-black uppercase mb-2 text-white italic">
        Initialize Identity
      </h2>
      <p className="text-xs font-mono text-gray-500 mb-8 tracking-widest uppercase">
        &gt; Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </p>

      <div className="space-y-6">
        {/* USERNAME INPUT */}
        <div>
          <label className="block text-[#FAFF00] text-xs font-bold uppercase mb-2">
            Assign Handle
          </label>
          <input
            type="text"
            placeholder="e.g. DISCIPLINE_GOD"
            className="w-full bg-transparent border-2 border-white/20 p-4 text-white font-mono focus:border-[#FAFF00] outline-none uppercase"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* BIO INPUT */}
        <div>
          <label className="block text-[#FAFF00] text-xs font-bold uppercase mb-2">
            Mission Statement
          </label>
          <textarea
            placeholder="Why are you running the protocol?"
            className="w-full bg-transparent border-2 border-white/20 p-4 text-white font-mono focus:border-[#FAFF00] outline-none h-24"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="w-full py-4 bg-[#FAFF00] text-black font-black text-xl uppercase hover:bg-white transition-colors"
        >
          {isSubmitting ? "UPLOADING..." : "BEGIN PROTOCOL"}
        </button>
      </div>
    </div>
  );
}
