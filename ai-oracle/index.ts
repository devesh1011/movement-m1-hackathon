import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import { serve } from "bun";
import { verifyData } from "./verifier"; // Ensure this path is correct

// 1. Setup Configuration
const privateKeyStr = process.env.VERIFIER_PRIVATE_KEY!;
const contractAddress = process.env.CONTRACT_ADDRESS!;
const config = new AptosConfig({
  fullnode: process.env.RPC_URL,
  network: Network.CUSTOM,
});
const aptos = new Aptos(config);

// 2. Initialize Verifier Account
const privateKey = new Ed25519PrivateKey(privateKeyStr);
const verifierAccount = Account.fromPrivateKey({ privateKey });

console.log(`🚀 Verifier Server Live at http://localhost:3001`);
console.log(
  `Using Verifier Address: ${verifierAccount.accountAddress.toString()}`
);

// 3. The Server Logic
serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // --- CORS HEADERS (Crucial for Frontend) ---
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle Preflight Options Request
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // Endpoint for daily check-in
    if (url.pathname === "/api/verify-checkin" && req.method === "POST") {
      try {
        // Expect these fields from the frontend
        const {
          userAddress,
          challengeId,
          proofType,
          proofData, // The Base64 string or text
          challengeTitle, // "75 Hard"
          taskDescription, // "Workout for 45 mins"
        } = await req.json();

        console.log(`🔍 Received check-in for User: ${userAddress}`);

        // --- STEP 1: AI VERIFICATION ---
        const verificationResult = await verifyData(
          challengeTitle || "Protocol 75 Challenge",
          taskDescription || "Daily Habit Task",
          {
            type: proofType, // 'image' or 'text'
            content: proofData,
            mimeType: "image/jpeg", // Defaulting to jpeg for simplicity
          }
        );

        if (!verificationResult.verified) {
          console.log(`❌ Verification Rejected: ${verificationResult.reason}`);
          return new Response(
            JSON.stringify({
              success: false,
              error: "Verification Failed",
              reason: verificationResult.reason,
            }),
            { status: 400, headers }
          );
        }

        console.log(`✅ AI Approved. Submitting to Blockchain...`);

        // --- STEP 2: BUILD MOVEMENT TRANSACTION ---
        const transaction = await aptos.transaction.build.simple({
          sender: verifierAccount.accountAddress,
          data: {
            function: `${contractAddress}::challenge_factory::submit_checkin`,
            functionArguments: [userAddress, challengeId],
          },
        });

        // --- STEP 3: SIGN AND SUBMIT ---
        const pendingTx = await aptos.signAndSubmitTransaction({
          signer: verifierAccount,
          transaction,
        });

        // --- STEP 4: WAIT FOR FINALITY ---
        // Note: For speed, you might return early, but waiting ensures the UI updates correctly
        const response = await aptos.waitForTransaction({
          transactionHash: pendingTx.hash,
        });

        console.log(`⛓️ Transaction Confirmed: ${pendingTx.hash}`);

        return new Response(
          JSON.stringify({
            success: true,
            txHash: pendingTx.hash,
          }),
          { status: 200, headers }
        );
      } catch (err: any) {
        console.error("Server Error:", err);
        return new Response(
          JSON.stringify({ error: err.message || "Internal Server Error" }),
          { status: 500, headers }
        );
      }
    }

    return new Response("MoveGoals Verifier API Running", { status: 200 });
  },
});
