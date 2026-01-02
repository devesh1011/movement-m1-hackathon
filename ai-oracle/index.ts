// MUST be first - disable certificate verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import express from "express";
import { verifyData } from "./verifier";
import "dotenv/config";

const app = express();
app.use(express.json());

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

// Test RPC connection
(async () => {
  try {
    const rpcUrl =
      process.env.RPC_URL || "https://testnet.movementnetwork.xyz/v1";
    console.log(`🔗 Testing RPC connection to ${rpcUrl}...`);

    const response = await fetch(`${rpcUrl}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).catch((e) => {
      console.warn(`⚠️ RPC test fetch failed (expected): ${e.message}`);
      return null;
    });

    if (response) {
      console.log(`✅ RPC endpoint is reachable`);
    }
  } catch (err: any) {
    console.warn(`⚠️ RPC test error (non-fatal): ${err.message}`);
  }
})();

// 3. CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 4. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    verifier: verifierAccount.accountAddress.toString(),
  });
});

// 5. Main verify-checkin endpoint
app.post("/api/verify-checkin", async (req, res) => {
  try {
    const {
      userAddress,
      challengeId,
      proofType,
      proofData,
      challengeTitle,
      taskDescription,
    } = req.body;

    console.log(
      `🔍 Received check-in for User: ${userAddress}, Challenge: ${challengeId}`
    );

    // Validate input
    if (!userAddress || challengeId === undefined || !proofData) {
      return res.status(400).json({
        success: false,
        error: "Missing userAddress, challengeId, or proofData",
      });
    }

    // --- STEP 1: AI VERIFICATION (COMMENTED - ENABLE LATER) ---
    // const verificationResult = await verifyData(
    //   challengeTitle || "Protocol 75 Challenge",
    //   taskDescription || "Daily Habit Task",
    //   {
    //     type: proofType,
    //     content: proofData,
    //     mimeType: "image/jpeg",
    //   }
    // );

    // if (!verificationResult.verified) {
    //   console.log(`❌ Verification Rejected: ${verificationResult.reason}`);
    //   return res.status(400).json({
    //     success: false,
    //     error: "Verification Failed",
    //     reason: verificationResult.reason,
    //   });
    // }

    console.log(
      `✅ Proof accepted (AI verification disabled). Submitting to Blockchain...`
    );

    // --- STEP 2: BUILD MOVEMENT TRANSACTION ---
    try {
      console.log(
        `📝 Building transaction for user: ${userAddress}, challenge: ${challengeId}`
      );
      console.log(`📝 Using contract address: ${contractAddress}`);
      console.log(
        `📝 Verifier signer: ${verifierAccount.accountAddress.toString()}`
      );

      // Convert challengeId to number if it's a string
      const challengeIdNum =
        typeof challengeId === "string"
          ? parseInt(challengeId, 10)
          : challengeId;

      if (isNaN(challengeIdNum)) {
        return res.status(400).json({
          success: false,
          error: `Invalid challengeId: ${challengeId} (must be a valid number)`,
        });
      }

      const transaction = await aptos.transaction.build.simple({
        sender: verifierAccount.accountAddress,
        data: {
          function: `${contractAddress}::challenge_factory::submit_checkin`,
          functionArguments: [userAddress, challengeIdNum],
        },
      });

      console.log(`✅ Transaction built successfully`);

      // --- STEP 3: SIGN AND SUBMIT ---
      console.log(`✍️ Signing transaction...`);
      const pendingTx = await aptos.signAndSubmitTransaction({
        signer: verifierAccount,
        transaction,
      });

      console.log(`⏳ Waiting for transaction finality: ${pendingTx.hash}`);
      const txResponse = await aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      console.log(`⛓️ Transaction Confirmed: ${pendingTx.hash}`);

      return res.status(200).json({
        success: true,
        verified: true,
        txHash: pendingTx.hash,
        message: "Check-in submitted and verified on blockchain",
      });
    } catch (txErr: any) {
      console.error("❌ Transaction Error:", txErr);
      console.error("Error code:", txErr.code);
      console.error("Error message:", txErr.message);

      return res.status(500).json({
        success: false,
        error: `Transaction failed: ${txErr.message}`,
      });
    }
  } catch (err: any) {
    console.error("❌ Server Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  }
});

// 6. Default endpoint
app.get("/", (req, res) => {
  res.send("MoveGoals Verifier API Running");
});

// 7. Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
