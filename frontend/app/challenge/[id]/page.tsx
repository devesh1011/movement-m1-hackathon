"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { challenges } from "@/lib/dummy-data"

export default function ChallengeDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [isAuthed, setIsAuthed] = useState(false)
  const [isStaking, setIsStaking] = useState(false)

  const challenge = challenges.find((c) => c.id === params.id)

  useEffect(() => {
    const sessionCookie = document.cookie.includes("scavnger-session=logged-in")
    if (!sessionCookie) {
      router.push("/")
    } else {
      setIsAuthed(true)
    }
  }, [router])

  if (!isAuthed || !challenge) {
    return null
  }

  const handleStake = () => {
    setIsStaking(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const startDate = new Date(challenge.startDate)
  const today = new Date()
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* LEFT SIDE: Intel */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1
                className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                {challenge.title}
              </h1>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">PROTOCOL DETAILS</p>
            </div>

            {/* Countdown Timer / Bomb Timer */}
            <div
              className="brutal-card border-cyan-500"
              style={{
                boxShadow: "4px 4px 0px rgba(0, 255, 255, 0.4)",
              }}
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-cyan-500 font-mono mb-3">LAUNCH IN</p>
                <div
                  className="text-5xl md:text-6xl font-black text-cyan-500 font-mono tracking-tight mb-2"
                  style={{ textShadow: "0 0 10px rgba(0, 255, 255, 0.6)" }}
                >
                  {daysUntilStart > 0 ? daysUntilStart : 0}
                </div>
                <p className="text-xs uppercase tracking-widest text-cyan-500 font-mono">DAYS</p>
              </div>
            </div>

            {/* Description */}
            <div className="brutal-card border-green-500">
              <h3
                className="text-sm font-black uppercase tracking-tight text-green-500 mb-3 border-b-2 border-green-500 pb-2"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                Description
              </h3>
              <p className="text-sm text-gray-300 font-mono leading-relaxed">{challenge.description}</p>
            </div>

            {/* Rules / Verification Protocol */}
            <div className="brutal-card border-yellow-400">
              <h3
                className="text-sm font-black uppercase tracking-tight text-yellow-400 mb-3 border-b-2 border-yellow-400 pb-2"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                Verification Protocol
              </h3>
              <p className="text-sm text-gray-300 font-mono leading-relaxed mb-3">{challenge.rules}</p>
              <div className="bg-gray-950 border-2 border-yellow-400 px-3 py-2">
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-mono">
                  TYPE: {challenge.verificationType.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Action */}
          <div className="space-y-6 md:sticky md:top-24">
            {/* Current Pot Display */}
            <div
              className="brutal-card border-green-500"
              style={{
                boxShadow: "4px 4px 0px rgba(0, 255, 0, 0.4)",
              }}
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-3">CURRENT POT</p>
                <div
                  className="text-5xl md:text-6xl font-black text-green-500 font-mono tracking-tight mb-1"
                  style={{ textShadow: "0 0 10px rgba(0, 255, 0, 0.6)" }}
                >
                  {challenge.pot}
                </div>
                <p className="text-sm uppercase tracking-widest text-green-500 font-mono">APT</p>
              </div>
            </div>

            {/* Players List */}
            <div className="brutal-card border-blue-500">
              <h3
                className="text-sm font-black uppercase tracking-tight text-blue-500 mb-3 border-b-2 border-blue-500 pb-2"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                Current Participants ({challenge.players})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {challenge.participants.map((participant, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-mono text-blue-400 py-1 border-b border-gray-800 last:border-0"
                  >
                    {idx + 1}. {participant}
                  </div>
                ))}
              </div>
            </div>

            {/* Stake Button - Massive and Fixed on Mobile */}
            <div className="fixed bottom-0 left-0 right-0 md:relative p-4 md:p-0 bg-black md:bg-transparent border-t-4 md:border-t-0 border-green-500">
              <button
                onClick={handleStake}
                disabled={isStaking}
                className="w-full brutal-button-yellow text-lg md:text-xl font-black uppercase disabled:opacity-50"
              >
                {isStaking ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    PROCESSING...
                  </>
                ) : (
                  `STAKE ${challenge.buyIn} APT & JOIN`
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
