import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      userAddress,
      challengeId,
      proofType,
      proofData,
      challengeTitle,
      taskDescription,
    } = await request.json();

    // Validate inputs
    if (!userAddress || !challengeId || !proofData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(
      `📤 Proof submission - User: ${userAddress}, Challenge: ${challengeId}`
    );

    // Call AI Oracle
    const aiOracleUrl =
      process.env.NEXT_PUBLIC_AI_ORACLE_URL || "http://localhost:3001";

    const aiResponse = await fetch(`${aiOracleUrl}/api/verify-checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAddress,
        challengeId,
        proofType,
        proofData,
        challengeTitle,
        taskDescription,
      }),
    });

    const aiResult = await aiResponse.json();

    if (!aiResponse.ok || !aiResult.success) {
      console.error("❌ AI Oracle error:", aiResult);
      return NextResponse.json(
        { success: false, error: aiResult.error || "Verification failed" },
        { status: aiResponse.status || 500 }
      );
    }

    console.log(`✅ Proof verified and submitted - TX: ${aiResult.txHash}`);

    return NextResponse.json({
      success: true,
      verified: aiResult.verified,
      txHash: aiResult.txHash,
      message: aiResult.message,
    });
  } catch (error: any) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
