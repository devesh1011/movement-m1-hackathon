"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { supabase, addParticipantToChallenge } from "@/lib/supabase";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { executeJoinChallenge } from "@/lib/join-challenge";
import { checkSufficientBalance } from "@/lib/balance";

export default function ChallengeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { authenticated, ready } = usePrivy();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStaking, setIsStaking] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceCheckError, setBalanceCheckError] = useState<string | null>(
    null
  );
  const { user } = usePrivy();

  const { signRawHash } = useSignRawHash();

  useEffect(() => {
    // 1. Auth Protection
    if (ready && !authenticated) {
      router.push("/");
      return;
    }

    // 2. Fetch Challenge Data from Supabase
    async function fetchChallenge() {
      try {
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setChallenge(data);
      } catch (err) {
        console.error("Error fetching challenge:", err);
      } finally {
        setLoading(false);
      }
    }

    if (ready && authenticated && params.id) {
      fetchChallenge();
    }
  }, [params.id, authenticated, ready, router]);

  // 3. Check user balance when user or challenge changes
  useEffect(() => {
    async function checkBalance() {
      if (!user?.wallet?.address || !challenge) {
        setUserBalance(null);
        return;
      }

      try {
        setBalanceCheckError(null);
        const result = await checkSufficientBalance(
          user.wallet.address,
          Number(challenge.buy_in)
        );
        setUserBalance(result.userBalanceMove);
      } catch (err: any) {
        console.error("❌ Error checking balance:", err);
        // Set a recoverable error message but allow user to try joining
        // (the contract will reject if balance is actually insufficient)
        setBalanceCheckError(err.message || "Could not verify balance");
        // Set a default balance so button isn't permanently disabled
        setUserBalance(null);
      }
    }

    checkBalance();
  }, [user?.wallet?.address, challenge?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-400 font-mono animate-pulse">
          RECOVERING INTEL...
        </p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <p className="text-red-500 font-mono mb-4">PROTOCOL NOT FOUND</p>
        <button
          onClick={() => router.push("/home")}
          className="brutal-button-yellow px-6 py-2"
        >
          RETURN TO BASE
        </button>
      </div>
    );
  }

  const handleJoinChallenge = async () => {
    if (!user?.wallet?.address || !challenge) {
      alert("⚠️ Wallet not connected");
      return;
    }

    setIsStaking(true);
    const toastId = Math.random(); // For tracking multiple operations

    try {
      console.log("🎯 Starting join challenge flow...");

      // Extract public key from Privy wallet
      const moveWallet = user.linkedAccounts.find(
        (acc: any) => acc.chainType === "aptos"
      ) as any;

      if (!moveWallet?.publicKey) {
        throw new Error(
          "Movement wallet public key not found. Please ensure wallet is properly created."
        );
      }

      // Supabase callback to update participants after successful sponsorship
      const onchainUpdateCallback = async (txHash: string) => {
        console.log(
          "📤 Updating Supabase with transaction hash and participant..."
        );
        await addParticipantToChallenge(
          challenge.id,
          user.wallet.address,
          txHash
        );
      };

      // Execute the complete join flow
      const txHash = await executeJoinChallenge(
        user.wallet.address,
        moveWallet.publicKey,
        challenge.id,
        challenge.onchain_id,
        signRawHash,
        onchainUpdateCallback
      );

      // Success! Show confirmation and redirect
      alert(`✅ Successfully joined challenge!\nTx: ${txHash.slice(0, 10)}...`);

      // Redirect to dashboard or home after 1 second
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (err: any) {
      console.error("❌ Join challenge failed:", err);
      const errorMessage = err?.message || String(err) || "Unknown error";
      alert(`❌ Join failed: ${errorMessage}`);
    } finally {
      setIsStaking(false);
    }
  };

  const createdDate = new Date(challenge.created_at);
  const endDate = new Date(
    createdDate.getTime() + challenge.duration_days * 24 * 60 * 60 * 1000
  );
  const today = new Date();
  const daysLeft = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* LEFT SIDE: Intel */}
          <div className="space-y-6">
            <div>
              <h1
                className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#FAFF00] mb-3"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                {challenge.title}
              </h1>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                PROTOCOL ID: {challenge.id} • CHALLENGE PHASE
              </p>
            </div>

            {/* Status Timer */}
            <div
              className="brutal-card border-cyan-500"
              style={{ boxShadow: "4px 4px 0px rgba(0, 255, 255, 0.4)" }}
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-cyan-500 font-mono mb-3">
                  TIME REMAINING
                </p>
                <div className="text-5xl md:text-6xl font-black text-cyan-500 font-mono tracking-tight mb-2">
                  {daysLeft > 0 ? daysLeft : 0}
                </div>
                <p className="text-xs uppercase tracking-widest text-cyan-500 font-mono">
                  DAYS
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="brutal-card border-green-500">
              <h3 className="text-sm font-black uppercase tracking-tight text-green-500 mb-3 border-b-2 border-green-500 pb-2 font-chakra">
                Briefing
              </h3>
              <p className="text-sm text-gray-300 font-mono leading-relaxed">
                {challenge.description}
              </p>
            </div>

            {/* Verification Protocol */}
            <div className="brutal-card border-yellow-400">
              <h3 className="text-sm font-black uppercase tracking-tight text-yellow-400 mb-3 border-b-2 border-yellow-400 pb-2 font-chakra">
                Verification Protocol
              </h3>
              <p className="text-sm text-gray-300 font-mono leading-relaxed mb-3">
                Must maintain activity through {challenge.verification_type}{" "}
                verification for {challenge.duration_days} consecutive days.
              </p>
              <div className="bg-gray-950 border-2 border-yellow-400 px-3 py-2">
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-mono">
                  METHOD: {challenge.verification_type?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Action */}
          <div className="space-y-6 md:sticky md:top-24">
            {/* Stake Display */}
            <div
              className="brutal-card border-green-500"
              style={{ boxShadow: "4px 4px 0px rgba(0, 255, 0, 0.4)" }}
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-3">
                  REQUIRED STAKE
                </p>
                <div className="text-5xl md:text-6xl font-black text-green-500 font-mono tracking-tight mb-1">
                  {typeof challenge.buy_in === "number" &&
                  challenge.buy_in % 1 !== 0
                    ? challenge.buy_in.toFixed(2)
                    : challenge.buy_in}
                </div>
                <p className="text-sm uppercase tracking-widest text-green-500 font-mono">
                  MOVE
                </p>
              </div>
            </div>

            {/* On-chain Intel */}
            <div className="brutal-card border-blue-500">
              <h3 className="text-sm font-black uppercase tracking-tight text-blue-500 mb-3 border-b-2 border-blue-500 pb-2 font-chakra">
                Transaction Intel
              </h3>
              <div className="space-y-2 font-mono text-[10px] text-blue-400 break-all">
                <p>CREATOR: {challenge.creator_address}</p>
                <p>TX_HASH: {challenge.tx_hash}</p>
              </div>
            </div>

            {/* Balance Display & Warning */}
            <div
              className={`brutal-card border-2 ${
                userBalance !== null &&
                userBalance >= Number(challenge.buy_in) + 0.1
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">
                  YOUR BALANCE
                </p>
                <div
                  className={`text-3xl font-black font-mono tracking-tight mb-1 ${
                    userBalance !== null &&
                    userBalance >= Number(challenge.buy_in) + 0.1
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {userBalance !== null ? userBalance.toFixed(4) : "..."}
                </div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                  MOVE
                </p>
                {balanceCheckError && (
                  <p className="text-xs text-red-400 mt-2 font-mono">
                    {balanceCheckError}
                  </p>
                )}
                {userBalance !== null &&
                  userBalance < Number(challenge.buy_in) + 0.1 && (
                    <p className="text-xs text-red-400 mt-2 font-mono">
                      ⚠️ INSUFFICIENT BALANCE
                    </p>
                  )}
              </div>
            </div>

            {/* Stake Button */}
            <div className="fixed bottom-0 left-0 right-0 md:relative p-4 md:p-0 bg-black md:bg-transparent border-t-4 md:border-t-0 border-green-500">
              <button
                onClick={handleJoinChallenge}
                disabled={
                  isStaking ||
                  daysLeft <= 0 ||
                  (userBalance !== null &&
                    userBalance < Number(challenge.buy_in) + 0.1)
                }
                className="w-full brutal-button-yellow text-lg md:text-xl font-black uppercase disabled:opacity-50"
                title={
                  userBalance !== null &&
                  userBalance < Number(challenge.buy_in) + 0.1
                    ? "Insufficient balance to join challenge"
                    : daysLeft <= 0
                    ? "Challenge has ended"
                    : balanceCheckError
                    ? "Balance check failed - attempt at your own risk"
                    : undefined
                }
              >
                {isStaking
                  ? "JOINING_PROTOCOL..."
                  : userBalance === null && balanceCheckError
                  ? "CHECK_BALANCE_FAILED"
                  : userBalance === null
                  ? "CHECKING_BALANCE..."
                  : userBalance < Number(challenge.buy_in) + 0.1
                  ? `INSUFFICIENT_BALANCE`
                  : `STAKE ${
                      typeof challenge.buy_in === "number" &&
                      challenge.buy_in % 1 !== 0
                        ? challenge.buy_in.toFixed(2)
                        : challenge.buy_in
                    } MOVE \u0026 JOIN`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
