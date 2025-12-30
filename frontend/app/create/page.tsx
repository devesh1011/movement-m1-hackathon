"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import {
  generateSigningMessageForTransaction,
  AccountAddress,
} from "@aptos-labs/ts-sdk";
import { aptos, CONTRACT_ADDRESS } from "@/lib/aptos";
type Step = "objective" | "parameters" | "verification" | "confirm";

export default function CreateChallengePage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { signRawHash } = useSignRawHash();

  const [step, setStep] = useState<Step>("objective");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 30,
    buyIn: 50,
    verificationType: "github",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4. Protect the route securely
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Don't render until auth state is known
  if (!ready || !authenticated) {
    return null;
  }

  const handleNext = () => {
    const steps: Step[] = [
      "objective",
      "parameters",
      "verification",
      "confirm",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const steps: Step[] = [
      "objective",
      "parameters",
      "verification",
      "confirm",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!user?.wallet?.address) return;
    setIsSubmitting(true);

    try {
      // 1. Build the Move Transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: user.wallet.address,
        withFeePayer: true,
        data: {
          function: `${CONTRACT_ADDRESS}::challenge_factory::create_challenge`,
          functionArguments: [
            formData.title,
            formData.duration,
            formData.buyIn * 1e8,
            "0x08f5ffadbe0148eb6e2e0d2e6ff8956a4290e80a3c3949b5d6e13858cb4b463e",
          ],
        },
      });

      // 2. Sign with Privy
      const message = generateSigningMessageForTransaction(rawTxn);
      const messageHex = Buffer.from(message).toString("hex");

      const { signature } = await signRawHash({
        address: user.wallet.address,
        chainType: "aptos",
        hash: `0x${messageHex}`,
      });

      const moveWallet = user.linkedAccounts.find(
        (acc: any) => acc.chainType === "aptos"
      ) as any;

      // 3. Submit to Sponsorship API
      const response = await fetch("/api/sponsor-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHex: rawTxn.bcsToHex().toString(),
          signatureHex: signature,
          publicKeyHex: moveWallet.publicKey,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      console.log("Waiting for indexing...");

      // Wait for the transaction to be confirmed
      const txnReceipt: any = await aptos.waitForTransaction({
        transactionHash: result.hash,
      });

      // Look for the ChallengeCreated event in the transaction logs
      const challengeEvent = txnReceipt.events.find((e: any) =>
        e.type.includes("ChallengeCreated")
      );

      // Capture the ID assigned by the Move contract (vector index)
      const onchain_id = challengeEvent?.data?.id;

      if (onchain_id === undefined) {
        console.warn(
          "Could not find onchain_id in events. Joining might fail."
        );
      }

      // 4. Save to Supabase with the NEW onchain_id column
      const { error: dbError } = await supabase.from("challenges").insert({
        tx_hash: result.hash,
        onchain_id: onchain_id ? Number(onchain_id) : null, // Store the link
        title: formData.title,
        description: formData.description,
        duration_days: formData.duration,
        buy_in: formData.buyIn,
        verification_type: formData.verificationType,
        creator_address: user.wallet.address,
        status: "open",
      });

      if (dbError) {
        console.error("Supabase Error:", dbError);
        throw new Error(`Database Error: ${dbError.message}`);
      }

      router.push("/home");
    } catch (err: any) {
      console.error("Creation failed:", err);
      alert(`DEPLOYMENT_FAILED: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepNames = {
    objective: "Define Objective",
    parameters: "Set Parameters",
    verification: "Verification Protocol",
    confirm: "Initialize Protocol",
  };

  return (
    <div className="min-h-screen bg-black pb-12">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="mb-8 md:mb-12">
          <h1
            className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-2"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            <span className="text-white">CREATE</span>
            <br />
            <span className="text-[#FAFF00]">CHALLENGE</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mt-3">
            MISSION CONFIGURATION PROTOCOL
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 md:gap-3 mb-8">
          {["objective", "parameters", "verification", "confirm"].map(
            (s, idx) => (
              <div
                key={s}
                className={`flex-1 h-2 border-2 ${
                  step === s
                    ? "border-yellow-400 bg-yellow-400"
                    : [
                        "objective",
                        "parameters",
                        "verification",
                        "confirm",
                      ].indexOf(step) > idx
                    ? "border-green-500 bg-green-500"
                    : "border-gray-600 bg-gray-900"
                }`}
              />
            )
          )}
        </div>

        {/* Form Container */}
        <div className="brutal-card border-white mb-8">
          <h3
            className="text-xl font-black uppercase tracking-tight text-white mb-6 border-b-2 border-white pb-3"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            {stepNames[step as Step]}
          </h3>

          {/* Step 1: Define Objective */}
          {step === "objective" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                  CHALLENGE TITLE
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., 30 DAY CODE CRUNCH"
                  className="w-full border-2 border-white bg-gray-900 text-white px-3 py-2 font-mono text-sm placeholder-gray-600 focus:outline-none focus:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the challenge objective..."
                  className="w-full border-2 border-white bg-gray-900 text-white px-3 py-2 font-mono text-sm placeholder-gray-600 min-h-24 focus:outline-none focus:bg-gray-800"
                />
              </div>
            </div>
          )}

          {/* Step 2: Set Parameters */}
          {step === "parameters" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-3">
                  DURATION (DAYS)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: Number.parseInt(e.target.value),
                      })
                    }
                    className="flex-1 h-2 border-2 border-white bg-gray-900 cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#FAFF00]"
                  />
                  <div className="border-2 border-white bg-gray-900 px-3 py-2 w-24">
                    <p className="font-mono text-white font-bold text-center">
                      {formData.duration}D
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                  BUY-IN AMOUNT (MOVE)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.buyIn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyIn: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0.01"
                    className="flex-1 border-2 border-white bg-gray-900 text-white px-3 py-2 font-mono text-sm focus:outline-none focus:bg-gray-800"
                  />
                  <span className="font-mono text-white font-bold">MOVE</span>
                </div>
              </div>

              {/* Calculator-style display */}
              <div className="border-2 border-yellow-400 bg-gray-950 px-4 py-3 mt-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-1">
                  ESTIMATED POT
                </p>
                <p className="text-2xl font-mono font-black text-yellow-400">
                  {(formData.buyIn * 100).toFixed(2)} MOVE
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  (calculated on 100 players)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Verification Protocol */}
          {step === "verification" && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-mono mb-4">
                SELECT VERIFICATION METHOD
              </p>

              {[
                {
                  id: "github",
                  label: "GitHub API (Code)",
                  desc: "Automated commit verification",
                },
                {
                  id: "vision",
                  label: "AI Vision (Photo)",
                  desc: "Photo-based proof verification",
                },
                {
                  id: "manual",
                  label: "Manual Host Approval",
                  desc: "Host reviews and approves proof",
                },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`block border-2 p-3 cursor-pointer transition-all ${
                    formData.verificationType === method.id
                      ? "border-green-500 bg-gray-900"
                      : "border-gray-700 hover:border-gray-500 bg-gray-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="verification"
                      value={method.id}
                      checked={formData.verificationType === method.id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          verificationType: e.target.value,
                        })
                      }
                      className="w-4 h-4 mt-0.5 cursor-pointer accent-[#FAFF00]"
                    />
                    <div>
                      <p className="font-mono font-bold text-white text-sm">
                        {method.label}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {method.desc}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirm" && (
            <div className="space-y-3">
              <div className="brutal-card border-green-500 bg-gray-950 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">
                  CHALLENGE SUMMARY
                </p>
                <div className="space-y-2 font-mono text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">TITLE:</span>
                    <span className="text-white font-bold">
                      {formData.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">DURATION:</span>
                    <span className="text-white font-bold">
                      {formData.duration} DAYS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">BUY-IN:</span>
                    <span className="text-white font-bold">
                      {formData.buyIn} MOVE
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">VERIFICATION:</span>
                    <span className="text-white font-bold">
                      {formData.verificationType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-4">
                Ready to initialize this protocol? Click the button below to
                proceed.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 border-t-2 border-white pt-6">
            <button
              onClick={handlePrev}
              disabled={step === "objective"}
              className="flex-1 bg-black border-2 border-white text-white font-bold py-3 uppercase hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white transition-colors"
            >
              BACK
            </button>
            {step !== "confirm" && (
              <button
                onClick={handleNext}
                className="flex-1 bg-[#FAFF00] border-2 border-[#FAFF00] text-black font-bold py-3 uppercase hover:bg-[#D4D900] transition-colors"
              >
                NEXT
              </button>
            )}
            {step === "confirm" && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#FAFF00] border-2 border-[#FAFF00] text-black font-bold py-3 uppercase hover:bg-[#D4D900] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "INITIALIZING..." : "INITIALIZE PROTOCOL"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
