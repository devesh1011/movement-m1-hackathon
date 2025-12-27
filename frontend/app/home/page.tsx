"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { challenges } from "@/lib/dummy-data"

export default function ChallengesFeed() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    // Check if user is logged in
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

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Section Title */}
        <div className="mb-8 md:mb-12">
          <h2
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            ACTIVE ZONES
          </h2>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">
            {challenges.length} PROTOCOLS AVAILABLE
          </p>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {challenges.map((challenge) => (
            <Link key={challenge.id} href={`/challenge/${challenge.id}`}>
              <div
                className="brutal-card border-green-500 cursor-pointer group hover:border-yellow-400 transition-all duration-200"
                style={{
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div className="border-b-2 border-green-500 pb-3 mb-4 group-hover:border-yellow-400">
                  <h3
                    className="text-sm md:text-base font-black uppercase tracking-tight text-green-500 group-hover:text-yellow-400 transition-colors"
                    style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                  >
                    {challenge.title}
                  </h3>
                </div>

                {/* Stats Grid */}
                <div className="data-block space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">BUY-IN:</span>
                    <span className="text-green-500 font-bold">{challenge.buyIn} APT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">PLAYERS:</span>
                    <span className="text-green-500 font-bold">{challenge.players}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">POT:</span>
                    <span className="text-green-500 font-bold">{challenge.pot} APT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">DURATION:</span>
                    <span className="text-green-500 font-bold">{challenge.duration}D</span>
                  </div>
                </div>

                {/* Footer Button */}
                <div className="pt-4 border-t-2 border-green-500 group-hover:border-yellow-400">
                  <button
                    className="w-full bg-green-500 text-black px-3 py-2 font-mono font-bold uppercase text-xs border-2 border-black transition-all duration-200"
                    style={{
                      boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.3)",
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                  >
                    VIEW INTEL
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
