"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    // Simulate login delay
    setTimeout(() => {
      // Set a fake session cookie
      document.cookie = "scavnger-session=logged-in; path=/"
      router.push("/home")
    }, 800)
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid background effect */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, 0.05) 25%, rgba(0, 255, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, 0.05) 75%, rgba(0, 255, 0, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, 0.05) 25%, rgba(0, 255, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, 0.05) 75%, rgba(0, 255, 0, 0.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl">
        {/* Hero Text */}
        <div className="text-center mb-12 md:mb-16">
          <h1
            className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-tight mb-6 text-white"
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            STAKE YOUR
            <br />
            DISCIPLINE
          </h1>
          <h2
            className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-green-500 mb-8"
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
            }}
          >
            SURVIVE TO EARN
          </h2>
          <p className="text-xs md:text-sm uppercase tracking-widest text-gray-400 font-mono">
            Web3 Challenge Protocol v1.0
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="brutal-button-yellow text-lg md:text-2xl mb-8 relative group disabled:opacity-50 w-full"
          style={{
            animation: !isLoading ? "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                JACKING IN...
              </>
            ) : (
              <>
                <span className="text-xl">⚡</span>
                JACK IN (LOGIN)
              </>
            )}
          </span>
        </button>

        {/* Disclaimer */}
        <div className="border-2 border-gray-700 bg-gray-950 p-4 text-center">
          <p className="text-xs md:text-sm uppercase tracking-widest text-gray-500 font-mono">
            &gt; WARNING: This is a prototype. No real crypto transactions.
            <br />
            &gt; Dummy data only. Educational purposes.
          </p>
        </div>
      </div>

      {/* Pulsing glow effect for button */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 4px 4px 0px rgb(250, 255, 0), 0 0 20px rgba(250, 255, 0, 0.3);
          }
          50% {
            box-shadow: 4px 4px 0px rgb(250, 255, 0), 0 0 40px rgba(250, 255, 0, 0.6);
          }
        }
      `}</style>
    </main>
  )
}
