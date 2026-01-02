"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import { usePrivy } from "@privy-io/react-auth";
import { aptos, CONTRACT_ADDRESS } from "@/lib/aptos";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaked: 0,
    activeProtocols: 0,
    survivalStreak: 0,
    completed: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofSubmissionStatus, setProofSubmissionStatus] = useState<{
    type: "loading" | "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
      return;
    }

    if (ready && authenticated && user?.wallet?.address) {
      fetchDashboardData();
    }
  }, [ready, authenticated, user, router]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // 1. Fetch user's registered challenges from Supabase
      // Assuming you have a 'participants' table or join logic
      const { data: challenges, error } = await supabase
        .from("challenges")
        .select("*")
        // This is a simplified query; ideally, you filter by challenges the user has JOINED
        .contains("participants_list", [user?.wallet?.address]);

      // 2. Fetch On-chain Progress for each challenge
      // We call the View functions of your Move contract
      const enhancedChallenges = await Promise.all(
        (challenges || []).map(async (ch) => {
          try {
            const progress: any = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::challenge_factory::get_user_progress`,
                functionArguments: [user?.wallet?.address, ch.onchain_id],
              },
            });

            // Move view functions return arrays: [days_completed, last_check_in, claimed]
            const [daysCompleted, lastCheckIn] = progress;

            return {
              ...ch,
              dayNumber: daysCompleted,
              progress: (daysCompleted / ch.duration_days) * 100,
              dailyStatus: isCheckInDue(lastCheckIn) ? "pending" : "secured",
            };
          } catch (e) {
            return { ...ch, dayNumber: 0, progress: 0, dailyStatus: "pending" };
          }
        })
      );

      setActiveChallenges(enhancedChallenges);

      // Calculate Aggregate Stats
      const totalStaked = enhancedChallenges.reduce(
        (acc, curr) => acc + curr.buy_in,
        0
      );
      setStats({
        totalStaked,
        activeProtocols: enhancedChallenges.length,
        survivalStreak: enhancedChallenges[0]?.dayNumber || 0, // Simplified streak
        completed: 0,
      });
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Helper to check if 24 hours have passed since last check-in
  const isCheckInDue = (lastTs: number) => {
    if (lastTs === 0) return true;
    const now = Math.floor(Date.now() / 1000);
    return now - lastTs > 86400;
  };

  // Helper to calculate check-in timer display
  const getCheckInTimer = (lastCheckIn: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeSinceCheckIn = now - lastCheckIn;
    const TWENTY_FOUR_HOURS = 86400;

    if (lastCheckIn === 0) {
      return "Check-in required";
    }

    if (timeSinceCheckIn > TWENTY_FOUR_HOURS) {
      // Overdue
      const hoursOverdue = Math.floor(
        (timeSinceCheckIn - TWENTY_FOUR_HOURS) / 3600
      );
      return `Overdue ${hoursOverdue}h`;
    } else {
      // Time remaining
      const hoursRemaining = Math.floor(
        (TWENTY_FOUR_HOURS - timeSinceCheckIn) / 3600
      );
      const minutesRemaining = Math.floor(
        ((TWENTY_FOUR_HOURS - timeSinceCheckIn) % 3600) / 60
      );
      return `${hoursRemaining}h ${minutesRemaining}m left`;
    }
  };

  // Handle file selection
  const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("text/")) {
      setProofSubmissionStatus({
        type: "error",
        message: "Please upload an image or text file",
      });
      return;
    }

    setProofFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProofPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle proof submission
  const handleSubmitProof = async () => {
    if (!proofFile || !selectedChallenge || !user?.wallet?.address) {
      setProofSubmissionStatus({
        type: "error",
        message: "Missing file, challenge, or wallet",
      });
      return;
    }

    setIsSubmittingProof(true);
    setProofSubmissionStatus({
      type: "loading",
      message: "Processing proof...",
    });

    try {
      console.log("📤 Reading file as base64...");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(proofFile);
      });

      console.log("📤 Submitting proof to backend...");

      const response = await fetch("/api/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: user.wallet.address,
          challengeId: selectedChallenge.onchain_id,
          proofType: "image",
          proofData: base64,
          challengeTitle: selectedChallenge.title,
          taskDescription: selectedChallenge.description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Proof submission failed");
      }

      console.log("✅ Proof verified and submitted:", result.txHash);

      setProofSubmissionStatus({
        type: "success",
        message: `✅ Proof verified! TX: ${result.txHash.slice(0, 10)}...`,
      });

      // Refresh dashboard data after 2 seconds
      setTimeout(() => {
        fetchDashboardData();
        setShowProofModal(false);
        setProofFile(null);
        setProofPreview(null);
        setProofSubmissionStatus({ type: null, message: "" });
      }, 2000);
    } catch (err: any) {
      console.error("❌ Proof submission failed:", err);
      setProofSubmissionStatus({
        type: "error",
        message: err.message || "Failed to submit proof",
      });
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">⚙️</div>
          <p className="font-mono text-yellow-400 text-lg mb-2">
            INITIALIZING COMMAND CENTER...
          </p>
          <p className="font-mono text-gray-500 text-sm">
            Loading your operational protocols
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-[#FAFF00] mb-2"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              SURVIVOR
            </h1>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-mono mb-3">
              {user?.wallet?.address?.slice(0, 6)}...
              {user?.wallet?.address?.slice(-4)} • Status: ACTIVE •{" "}
              {stats.activeProtocols} PROTOCOLS
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-4 md:mt-0 brutal-button-green text-sm font-bold uppercase hover:scale-105 transition-transform"
          >
            + NEW PROTOCOL
          </button>
        </div>

        {/* Player Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <StatCard
            title="STAKE LOCKED"
            value={stats.totalStaked}
            unit="MOVE"
            color="purple"
          />
          <StatCard
            title="ACTIVE MISSIONS"
            value={stats.activeProtocols}
            unit="UNITS"
            color="green"
          />
          <StatCard
            title="LONGEST STREAK"
            value={stats.survivalStreak}
            unit="DAYS"
            color="cyan"
          />
          <StatCard
            title="CLAIMED"
            value={stats.completed}
            unit="MOVE"
            color="yellow"
          />
        </div>

        {/* Active Challenges Section */}
        <div>
          <h2
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            <span className="text-white">OPERATIONAL</span>
            <br />
            <span className="text-[#FAFF00]">PROTOCOLS</span>
          </h2>

          {activeChallenges.length === 0 ? (
            <div className="brutal-card border-yellow-400 border-2 bg-black text-center py-12">
              <p className="text-4xl mb-4">🚀</p>
              <p className="text-lg font-black text-yellow-400 uppercase mb-2">
                NO ACTIVE PROTOCOLS
              </p>
              <p className="text-gray-400 text-sm mb-6">
                You haven't joined any challenges yet!
              </p>
              <button
                onClick={() => router.push("/")}
                className="brutal-button-yellow font-bold uppercase"
              >
                DISCOVER CHALLENGES
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="brutal-card border-white bg-gray-950/50 hover:border-cyan-500 transition-colors cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 uppercase">
                            STAKED {challenge.buy_in} MOVE
                          </span>
                          <h4 className="text-xl font-black uppercase text-white font-chakra">
                            {challenge.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap ml-2">
                          ID: {challenge.id}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                            EVOLUTION: DAY {challenge.dayNumber} /{" "}
                            {challenge.duration_days}
                          </span>
                          <span className="text-xs font-mono text-green-500">
                            {Math.round(challenge.progress)}%
                          </span>
                        </div>
                        <div className="h-3 border-2 border-white bg-gray-900">
                          <div
                            className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]"
                            style={{ width: `${challenge.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="border-l-2 border-gray-800 pl-3">
                          <p className="text-[10px] text-gray-500 font-mono uppercase mb-1">
                            Status
                          </p>
                          <div className="flex items-center gap-1">
                            {challenge.dailyStatus === "secured" ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-yellow-500 animate-pulse">
                                !
                              </span>
                            )}
                            <p
                              className={`font-bold uppercase text-[11px] ${
                                challenge.dailyStatus === "secured"
                                  ? "text-green-500"
                                  : "text-yellow-500"
                              }`}
                            >
                              {challenge.dailyStatus === "secured"
                                ? "SECURED"
                                : "PENDING"}
                            </p>
                          </div>
                        </div>
                        <div className="border-l-2 border-gray-800 pl-3">
                          <p className="text-[10px] text-gray-500 font-mono uppercase mb-1">
                            Check-in
                          </p>
                          <p className="font-bold text-blue-400 text-[11px]">
                            {getCheckInTimer(challenge.lastCheckIn || 0)}
                          </p>
                        </div>
                        <div className="border-l-2 border-gray-800 pl-3">
                          <p className="text-[10px] text-gray-500 font-mono uppercase mb-1">
                            Type
                          </p>
                          <p className="font-bold text-cyan-500 text-[11px]">
                            {challenge.verification_type?.toUpperCase() ||
                              "MANUAL"}
                          </p>
                        </div>
                        <div className="border-l-2 border-gray-800 pl-3">
                          <p className="text-[10px] text-gray-500 font-mono uppercase mb-1">
                            Community
                          </p>
                          <p className="font-bold text-blue-400 text-[11px]">
                            {challenge.participants_list?.length || 0} MEMBERS
                          </p>
                        </div>
                      </div>
                    </div>

                    {challenge.dailyStatus === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowProofModal(true);
                        }}
                        className="brutal-button-yellow hover:scale-105 transition-transform mt-4 md:mt-0"
                      >
                        SUBMIT PROOF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="brutal-card border-yellow-400 max-w-lg w-full bg-black">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-yellow-400">
              <h2 className="text-xl font-black uppercase text-yellow-400 font-chakra">
                TRANSMIT PROOF
              </h2>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofFile(null);
                  setProofPreview(null);
                  setProofSubmissionStatus({ type: null, message: "" });
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-black text-white mb-2 uppercase">
                  CHALLENGE: {selectedChallenge?.title}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {selectedChallenge?.description}
                </p>
              </div>

              {/* File Preview */}
              {proofPreview && (
                <div className="border-2 border-cyan-500 p-4 bg-gray-950">
                  <p className="text-xs text-cyan-500 font-mono uppercase mb-2">
                    Preview
                  </p>
                  <img
                    src={proofPreview}
                    alt="Proof preview"
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-xs font-black text-yellow-400 uppercase mb-3">
                  Upload Proof
                </label>
                <input
                  type="file"
                  accept="image/*,text/*"
                  onChange={handleProofFileSelect}
                  disabled={isSubmittingProof}
                  className="w-full border-2 border-dashed border-gray-700 bg-gray-900 p-8 text-center font-mono text-sm cursor-pointer hover:border-cyan-500 transition-colors disabled:opacity-50"
                />
                {proofFile && (
                  <p className="text-xs text-green-500 mt-2 font-mono">
                    ✓ {proofFile.name}
                  </p>
                )}
              </div>

              {/* Status Messages */}
              {proofSubmissionStatus.message && (
                <div
                  className={`p-3 border-2 font-mono text-sm ${
                    proofSubmissionStatus.type === "loading"
                      ? "border-cyan-500 bg-cyan-900/20 text-cyan-400"
                      : proofSubmissionStatus.type === "success"
                      ? "border-green-500 bg-green-900/20 text-green-400"
                      : "border-red-500 bg-red-900/20 text-red-400"
                  }`}
                >
                  {proofSubmissionStatus.message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 border-t-2 border-gray-800 pt-6">
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setProofFile(null);
                    setProofPreview(null);
                    setProofSubmissionStatus({ type: null, message: "" });
                  }}
                  disabled={isSubmittingProof}
                  className="flex-1 border-2 border-white py-3 text-white font-black uppercase hover:bg-white hover:text-black disabled:opacity-50 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={!proofFile || isSubmittingProof}
                  className="flex-1 brutal-button-yellow py-3 text-black font-black uppercase disabled:opacity-50"
                >
                  {isSubmittingProof ? "VERIFYING..." : "SUBMIT & VERIFY"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, unit, color }: any) {
  const colorMap: any = {
    purple:
      "border-purple-500 text-purple-500 shadow-[4px_4px_0px_rgba(168,85,247,0.4)]",
    green:
      "border-green-500 text-green-500 shadow-[4px_4px_0px_rgba(0,255,0,0.4)]",
    cyan: "border-cyan-500 text-cyan-500 shadow-[4px_4px_0px_rgba(0,255,255,0.4)]",
    yellow:
      "border-yellow-400 text-yellow-400 shadow-[4px_4px_0px_rgba(250,255,0,0.4)]",
  };
  return (
    <div className={`brutal-card ${colorMap[color]}`}>
      <p className="text-[10px] uppercase tracking-tighter text-gray-500 font-mono mb-2">
        {title}
      </p>
      <div className="text-3xl font-black font-mono">{value}</div>
      <p className="text-[10px] font-mono mt-1 opacity-70">{unit}</p>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const isSecured = status === "secured";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`text-3xl font-black font-mono ${
          isSecured ? "text-green-500" : "text-yellow-500 animate-pulse"
        }`}
      >
        {isSecured ? "✓" : "!"}
      </div>
      <div>
        <p className="text-[10px] uppercase text-gray-500 font-mono">
          Current Status
        </p>
        <p
          className={`text-sm font-bold uppercase ${
            isSecured ? "text-green-500" : "text-yellow-500"
          }`}
        >
          {isSecured ? "SECURED" : "ACTION REQUIRED"}
        </p>
      </div>
    </div>
  );
}
