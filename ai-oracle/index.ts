import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import { serve } from "bun";
import { verifyData } from "./verifier";

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

console.log(
  `🚀 Verifier Server Live: ${verifierAccount.accountAddress.toString()}`
);

// 3. The Server Logic
serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // Endpoint for daily check-in
    if (url.pathname === "/api/verify-checkin" && req.method === "POST") {
      try {
        const { userAddress, challengeId, proofType, proofData } =
          await req.json();

        const isValid = await verifyData("", "", "");

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Verification Failed" }),
            { status: 400 }
          );
        }

        // --- STEP 2: BUILD MOVEMENT TRANSACTION ---
        console.log(
          `Verifying challenge ${challengeId} for user ${userAddress}...`
        );

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
        const response = await aptos.waitForTransaction({
          transactionHash: pendingTx.hash,
        });

        return new Response(
          JSON.stringify({
            success: true,
            txHash: pendingTx.hash,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
        });
      }
    }

    return new Response("MoveGoals Verifier API", { status: 200 });
  },
});
