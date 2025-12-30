import { aptos } from "./aptos";
import { Account } from "@aptos-labs/ts-sdk";

/**
 * Fetches MOVE coin balance for a user address in octas
 * Returns balance as number (1 MOVE = 100,000,000 octas)
 * Fallback: Returns 0 if account doesn't exist
 */
export async function getUserMoveBalance(userAddress: string): Promise<number> {
  try {
    // Use the correct Aptos SDK method to get MOVE balance
    // This queries the 0x1::coin::CoinStore<0x1::move_coin::MoveCoin> resource
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: userAddress,
    });

    if (balance === undefined || balance === null) {
      console.warn(`⚠️ Account ${userAddress} may not exist yet`);
      return 0;
    }

    return Number(balance);
  } catch (error: any) {
    console.error("❌ Error fetching MOVE balance:", error);

    // Check if account doesn't exist (common for new accounts)
    if (
      error.message?.includes("404") ||
      error.message?.includes("not found")
    ) {
      console.warn(`ℹ️ Account ${userAddress} doesn't exist on-chain yet`);
      return 0;
    }

    throw new Error(
      `Failed to fetch balance: ${error.message || String(error)}`
    );
  }
}

/**
 * Convert octas to MOVE (1 MOVE = 100,000,000 octas)
 */
export function octasToMove(octas: number): number {
  return octas / 100_000_000;
}

/**
 * Convert MOVE to octas
 */
export function moveToOctas(move: number): number {
  return Math.floor(move * 100_000_000);
}

/**
 * Checks if user has sufficient balance to join challenge
 * Returns { hasSufficientBalance, userBalance, requiredBalance }
 */
export async function checkSufficientBalance(
  userAddress: string,
  requiredMove: number
): Promise<{
  hasSufficientBalance: boolean;
  userBalanceMove: number;
  requiredMove: number;
}> {
  try {
    const balanceOctas = await getUserMoveBalance(userAddress);
    const userBalanceMove = octasToMove(balanceOctas);

    // Add 0.1 MOVE buffer for gas fees (Shinami covers gas, but might need small buffer)
    const requiredWithBuffer = requiredMove + 0.1;

    return {
      hasSufficientBalance: userBalanceMove >= requiredWithBuffer,
      userBalanceMove: parseFloat(userBalanceMove.toFixed(4)),
      requiredMove: requiredWithBuffer,
    };
  } catch (error: any) {
    console.error("❌ Error checking balance:", error);
    throw error;
  }
}
