import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials missing. Check your .env.local file.");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

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
