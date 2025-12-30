import { generateSigningMessageForTransaction } from "@aptos-labs/ts-sdk";
import { aptos, CONTRACT_ADDRESS } from "./aptos";

/**
 * Prepares and signs a join_challenge transaction
 * Returns transaction hex and signature for Shinami sponsorship
 */
export async function prepareJoinChallengeTransaction(
  senderAddress: string,
  challengeOnchainId: number
) {
  try {
    // 1. Build the transaction
    const rawTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      withFeePayer: true,
      data: {
        function: `${CONTRACT_ADDRESS}::challenge_factory::join_challenge`,
        functionArguments: [challengeOnchainId],
      },
    });

    // 2. Get signing message
    const message = generateSigningMessageForTransaction(rawTxn);
    const messageHex = Buffer.from(message).toString("hex");

    return {
      transactionHex: rawTxn.bcsToHex().toString(),
      messageHex: `0x${messageHex}`,
      rawTxn, // Keep for reference
    };
  } catch (error: any) {
    console.error("❌ Error preparing join challenge transaction:", error);
    throw new Error(`Transaction prep failed: ${error.message}`);
  }
}

/**
 * Submits signed transaction to Shinami for sponsorship
 * Returns transaction hash on success
 */
export async function sponsorJoinChallengeTransaction(
  transactionHex: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<string> {
  try {
    // Clean public key (remove scheme prefix if present)
    let cleanPublicKeyHex = publicKeyHex;
    if (publicKeyHex.startsWith("00")) {
      cleanPublicKeyHex = publicKeyHex.substring(2);
    } else if (publicKeyHex.startsWith("0x00")) {
      cleanPublicKeyHex = publicKeyHex.substring(4);
    }

    const response = await fetch("/api/sponsor-challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionHex,
        signatureHex,
        publicKeyHex: cleanPublicKeyHex,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (!result.hash) {
      throw new Error("No transaction hash returned from Shinami");
    }

    console.log("✅ Transaction sponsored successfully:", result.hash);
    return result.hash;
  } catch (error: any) {
    console.error("❌ Error sponsoring transaction:", error);
    throw new Error(`Sponsorship failed: ${error.message}`);
  }
}

/**
 * Orchestrates the complete join challenge flow:
 * 1. Prepare transaction
 * 2. Sign with Privy
 * 3. Sponsor via Shinami
 * 4. Update Supabase
 */
export async function executeJoinChallenge(
  userWalletAddress: string,
  userPublicKey: string,
  challengeId: number,
  challengeOnchainId: number,
  signRawHashFn: (params: any) => Promise<{ signature: string }>,
  onchainUpdateFn: (txHash: string) => Promise<void>
) {
  try {
    console.log(`🚀 Starting join challenge flow for challenge ${challengeId}`);

    // 1. Prepare transaction
    console.log("📝 Preparing transaction...");
    const { transactionHex, messageHex } =
      await prepareJoinChallengeTransaction(
        userWalletAddress,
        challengeOnchainId
      );

    // 2. Sign with Privy
    console.log("✍️ Signing transaction...");
    const { signature } = await signRawHashFn({
      address: userWalletAddress,
      chainType: "aptos",
      hash: messageHex,
    });

    // 3. Sponsor via Shinami
    console.log("⛽ Sponsoring transaction via Shinami...");
    const txHash = await sponsorJoinChallengeTransaction(
      transactionHex,
      signature,
      userPublicKey
    );

    // 4. Update Supabase with tx hash and participants
    console.log("🔄 Updating Supabase...");
    await onchainUpdateFn(txHash);

    console.log("✅ Join challenge completed successfully!");
    return txHash;
  } catch (error: any) {
    console.error("❌ Join challenge failed:", error);
    throw error;
  }
}
