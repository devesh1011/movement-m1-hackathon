"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { userStats, userActiveChallenges } from "@/lib/dummy-data"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [showProofModal, setShowProofModal] = useState(false)

  useEffect(() => {
    const sessionCookie = document.cookie.includes("scavnger-session=logged-in")
    if (!sessionCookie) {
      router.push("/")
    } else {
      setIsAuthed(true)
    }
  }, [router])

  if (!isAuthed) {
    return null
  }

  const handleUploadProof = () => {
    setShowProofModal(false)
    // Simulate upload
    setTimeout(() => {
      alert("Proof submitted! Awaiting verification.")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-black pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="mb-8 md:mb-12">
          <h2
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            MY OPERATIONS
          </h2>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">Player Command Center</p>
        </div>

        {/* Player Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {/* Total Staked */}
          <div className="brutal-card border-purple-500" style={{ boxShadow: "4px 4px 0px rgba(168, 85, 247, 0.4)" }}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">TOTAL STAKED</p>
            <div
              className="text-3xl md:text-4xl font-black text-purple-500 font-mono"
              style={{ textShadow: "0 0 10px rgba(168, 85, 247, 0.6)" }}
            >
              {userStats.totalStaked}
            </div>
            <p className="text-xs text-purple-500 font-mono mt-1">APT</p>
          </div>

          {/* Est Earnings */}
          <div className="brutal-card border-green-500" style={{ boxShadow: "4px 4px 0px rgba(0, 255, 0, 0.4)" }}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">EST. EARNINGS</p>
            <div
              className="text-3xl md:text-4xl font-black text-green-500 font-mono"
              style={{ textShadow: "0 0 10px rgba(0, 255, 0, 0.6)" }}
            >
              {userStats.estimatedEarnings}
            </div>
            <p className="text-xs text-green-500 font-mono mt-1">APT</p>
          </div>

          {/* Survival Streak */}
          <div className="brutal-card border-cyan-500" style={{ boxShadow: "4px 4px 0px rgba(0, 255, 255, 0.4)" }}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">SURVIVAL STREAK</p>
            <div
              className="text-3xl md:text-4xl font-black text-cyan-500 font-mono"
              style={{ textShadow: "0 0 10px rgba(0, 255, 255, 0.6)" }}
            >
              {userStats.survivalStreak}
            </div>
            <p className="text-xs text-cyan-500 font-mono mt-1">DAYS</p>
          </div>

          {/* Completed Challenges */}
          <div className="brutal-card border-yellow-400" style={{ boxShadow: "4px 4px 0px rgba(250, 255, 0, 0.4)" }}>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">COMPLETED</p>
            <div
              className="text-3xl md:text-4xl font-black text-yellow-400 font-mono"
              style={{ textShadow: "0 0 10px rgba(250, 255, 0, 0.6)" }}
            >
              {userStats.completedChallenges}
            </div>
            <p className="text-xs text-yellow-400 font-mono mt-1">PROTOCOLS</p>
          </div>
        </div>

        {/* Active Challenges Section */}
        <div>
          <h3
            className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-4"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            ACTIVE CHALLENGES
          </h3>
          <div className="space-y-4 md:space-y-6">
            {userActiveChallenges.map((challenge) => (
              <div key={challenge.id} className="brutal-card border-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  {/* Challenge Info */}
                  <div className="flex-1">
                    <h4
                      className="text-lg md:text-xl font-black uppercase tracking-tight text-white mb-3"
                      style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                    >
                      {challenge.title}
                    </h4>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                          PROGRESS: {challenge.dayNumber}/{challenge.totalDays}
                        </span>
                        <span className="text-xs font-mono text-gray-400">{challenge.progress}%</span>
                      </div>
                      <div className="h-2 border-2 border-white bg-gray-900">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Daily Status Indicator */}
                    <div className="flex items-center gap-3">
                      {challenge.dailyStatus === "secured" ? (
                        <div
                          className="text-3xl md:text-4xl font-black text-green-500 font-mono"
                          style={{ textShadow: "0 0 10px rgba(0, 255, 0, 0.6)" }}
                        >
                          ✓
                        </div>
                      ) : (
                        <div
                          className="text-3xl md:text-4xl font-black text-red-600 font-mono"
                          style={{ textShadow: "0 0 10px rgba(255, 0, 0, 0.6)" }}
                        >
                          ✗
                        </div>
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">TODAY'S STATUS</p>
                        <p
                          className={`text-sm font-bold uppercase tracking-tight ${
                            challenge.dailyStatus === "secured" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {challenge.dailyStatus === "secured" ? "SECURED" : "MISSED"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {challenge.dailyStatus !== "secured" && (
                    <button
                      onClick={() => {
                        setSelectedChallenge(challenge.id)
                        setShowProofModal(true)
                      }}
                      className="brutal-button-yellow text-sm md:text-base w-full md:w-auto whitespace-nowrap"
                    >
                      UPLOAD PROOF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="brutal-card border-yellow-400 max-w-md w-full">
            <h4
              className="text-lg font-black uppercase tracking-tight text-yellow-400 mb-4 border-b-2 border-yellow-400 pb-3"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              SUBMIT PROOF
            </h4>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                SELECT FILE
              </label>
              <input
                type="file"
                className="w-full border-2 border-yellow-400 bg-gray-900 text-white px-3 py-2 font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowProofModal(false)} className="flex-1 brutal-button text-sm">
                CANCEL
              </button>
              <button onClick={handleUploadProof} className="flex-1 brutal-button-yellow text-sm">
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
