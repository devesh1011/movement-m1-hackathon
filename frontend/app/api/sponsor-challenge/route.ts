import { GasStationClient } from "@shinami/clients/aptos";
import {
  SimpleTransaction,
  Deserializer,
  Hex,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from "@aptos-labs/ts-sdk";

const gasClient = new GasStationClient(process.env.SHINAMI_GAS_KEY!);

export async function POST(req: Request) {
  try {
    // Log raw body for debugging
    const rawBody = await req.text();
    console.log("[Backend] Raw request body:", rawBody);
    console.log("[Backend] Content-Type:", req.headers.get("content-type"));

    if (!rawBody || rawBody.trim() === "") {
      throw new Error("Empty request body");
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (parseErr) {
      throw new Error(
        `Invalid JSON in body: ${parseErr.message}. Raw: ${rawBody.substring(
          0,
          200
        )}...`
      );
    }

    // Destructure
    const { transactionHex, signatureHex, publicKeyHex } = parsedBody;

    if (!signatureHex || !publicKeyHex || !transactionHex) {
      throw new Error(
        "Missing required transaction data: signature, public key, or transaction hex."
      );
    }

    // Strip the scheme prefix from public key if present (common in Privy/Aptos: "00" + 64 hex chars)
    let cleanPublicKeyHex = publicKeyHex;
    if (publicKeyHex.startsWith("00")) {
      cleanPublicKeyHex = publicKeyHex.substring(2);
    } else if (publicKeyHex.startsWith("0x00")) {
      cleanPublicKeyHex = publicKeyHex.substring(4);
    }

    if (cleanPublicKeyHex.length !== 64) {
      throw new Error(
        `Invalid public key length: ${cleanPublicKeyHex.length} chars (expected 64)`
      );
    }

    // 2. Deserialize the transaction
    const simpleTx = SimpleTransaction.deserialize(
      new Deserializer(Hex.fromHexString(transactionHex).toUint8Array())
    );

    // 3. Build the Authenticator manually (Standard Ed25519 for Privy)
    const senderAuth = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(cleanPublicKeyHex),
      new Ed25519Signature(signatureHex)
    );

    console.log("[Backend] Sponsoring transaction via Shinami...");

    // 4. Sponsor and Submit via Shinami
    const pendingTx = await gasClient.sponsorAndSubmitSignedTransaction(
      simpleTx,
      senderAuth
    );
    console.log(pendingTx);

    return Response.json({ hash: pendingTx.hash });
  } catch (error: any) {
    console.error("Sponsorship Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
