import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials missing. Check your .env.local file.");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Add participant to challenge's participants_list in Supabase
 * Atomic operation: adds wallet address to array and updates tx_hash if provided
 */
export const addParticipantToChallenge = async (
  challengeId: number,
  walletAddress: string,
  txHash?: string
) => {
  try {
    // 1. Fetch current challenge to get existing participants list
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("participants_list")
      .eq("id", challengeId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Build new participants list (avoid duplicates)
    const currentParticipants = challenge?.participants_list || [];
    const updatedParticipants = Array.from(
      new Set([...currentParticipants, walletAddress])
    );

    // 3. Update challenge with new participants list and tx_hash if provided
    const updateData: any = {
      participants_list: updatedParticipants,
    };

    if (txHash) {
      updateData.tx_hash = txHash;
    }

    const { error: updateError } = await supabase
      .from("challenges")
      .update(updateData)
      .eq("id", challengeId);

    if (updateError) throw updateError;

    return { success: true, participants: updatedParticipants };
  } catch (error: any) {
    console.error("❌ Error adding participant to challenge:", error);
    throw error;
  }
};

/**
 * PROTOCOL 75 HELPER: Upload Daily Proof
 * Uploads an image to Supabase Storage and returns the public URL
 */
export const uploadProofImage = async (
  file: File,
  userAddress: string,
  challengeId: string
) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${challengeId}/${userAddress}_${Date.now()}.${fileExt}`;
  const filePath = `proofs/${fileName}`;

  // 1. Upload to 'proofs' bucket
  const { error: uploadError, data } = await supabase.storage
    .from("protocol_assets")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Get Public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("protocol_assets").getPublicUrl(filePath);

  return publicUrl;
};
