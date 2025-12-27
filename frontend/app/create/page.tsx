"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

type Step = "objective" | "parameters" | "verification" | "confirm"

export default function CreateChallengePage() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [step, setStep] = useState<Step>("objective")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 30,
    buyIn: 50,
    verificationType: "github",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleNext = () => {
    const steps: Step[] = ["objective", "parameters", "verification", "confirm"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    const steps: Step[] = ["objective", "parameters", "verification", "confirm"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setTimeout(() => {
      alert("Challenge protocol initialized!")
      router.push("/home")
    }, 1000)
  }

  const stepNames = {
    objective: "Define Objective",
    parameters: "Set Parameters",
    verification: "Verification Protocol",
    confirm: "Initialize Protocol",
  }

  return (
    <div className="min-h-screen bg-black pb-12">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="mb-8 md:mb-12">
          <h2
            className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            CREATE CHALLENGE
          </h2>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">MISSION CONFIGURATION</p>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 md:gap-3 mb-8">
          {["objective", "parameters", "verification", "confirm"].map((s, idx) => (
            <div
              key={s}
              className={`flex-1 h-2 border-2 ${
                step === s
                  ? "border-yellow-400 bg-yellow-400"
                  : ["objective", "parameters", "verification", "confirm"].indexOf(step) > idx
                    ? "border-green-500 bg-green-500"
                    : "border-gray-600 bg-gray-900"
              }`}
            />
          ))}
        </div>

        {/* Form Container */}
        <div className="brutal-card border-white mb-8">
          <h3
            className="text-xl font-black uppercase tracking-tight text-white mb-6 border-b-2 border-white pb-3"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            {stepNames[step]}
          </h3>

          {/* Step 1: Define Objective */}
          {step === "objective" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                  CHALLENGE TITLE
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 30 DAY CODE CRUNCH"
                  className="w-full border-2 border-white bg-gray-900 text-white px-3 py-2 font-mono text-sm placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the challenge objective..."
                  className="w-full border-2 border-white bg-gray-900 text-white px-3 py-2 font-mono text-sm placeholder-gray-600 min-h-24"
                />
              </div>
            </div>
          )}

          {/* Step 2: Set Parameters */}
          {step === "parameters" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-3">
                  DURATION (DAYS)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                    className="flex-1 h-2 border-2 border-white bg-gray-900 cursor-pointer"
                  />
                  <div className="border-2 border-white bg-gray-900 px-3 py-2 w-24">
                    <p className="font-mono text-white font-bold text-center">{formData.duration}D</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-mono mb-2">
                  BUY-IN AMOUNT (APT)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.buyIn}
                    onChange={(e) => setFormData({ ...formData, buyIn: Number.parseInt(e.target.value) })}
                    min="1"
                    className="flex-1 border-2 border-white bg-gray-900 text-white px-3 py-2 font-mono text-sm"
                  />
                  <span className="font-mono text-white font-bold">APT</span>
                </div>
              </div>

              {/* Calculator-style display */}
              <div className="border-2 border-yellow-400 bg-gray-950 px-4 py-3 mt-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-1">ESTIMATED POT</p>
                <p className="text-2xl font-mono font-black text-yellow-400">{formData.buyIn * 100} APT</p>
                <p className="text-xs text-gray-500 font-mono mt-1">(calculated on 100 players)</p>
              </div>
            </div>
          )}

          {/* Step 3: Verification Protocol */}
          {step === "verification" && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-mono mb-4">
                SELECT VERIFICATION METHOD
              </p>

              {[
                {
                  id: "github",
                  label: "GitHub API (Code)",
                  desc: "Automated commit verification",
                },
                {
                  id: "vision",
                  label: "AI Vision (Photo)",
                  desc: "Photo-based proof verification",
                },
                {
                  id: "manual",
                  label: "Manual Host Approval",
                  desc: "Host reviews and approves proof",
                },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`block border-2 p-3 cursor-pointer transition-all ${
                    formData.verificationType === method.id
                      ? "border-green-500 bg-gray-900"
                      : "border-gray-700 hover:border-gray-500 bg-gray-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="verification"
                      value={method.id}
                      checked={formData.verificationType === method.id}
                      onChange={(e) => setFormData({ ...formData, verificationType: e.target.value })}
                      className="w-4 h-4 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <p className="font-mono font-bold text-white text-sm">{method.label}</p>
                      <p className="text-xs text-gray-400 font-mono">{method.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirm" && (
            <div className="space-y-3">
              <div className="brutal-card border-green-500 bg-gray-950">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-2">CHALLENGE SUMMARY</p>
                <div className="space-y-2 font-mono text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">TITLE:</span>
                    <span className="text-white font-bold">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">DURATION:</span>
                    <span className="text-white font-bold">{formData.duration} DAYS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">BUY-IN:</span>
                    <span className="text-white font-bold">{formData.buyIn} APT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">VERIFICATION:</span>
                    <span className="text-white font-bold">{formData.verificationType.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Ready to initialize this protocol? Click the button below to proceed.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 border-t-2 border-white pt-6">
            <button
              onClick={handlePrev}
              disabled={step === "objective"}
              className="flex-1 brutal-button text-sm disabled:opacity-50"
            >
              BACK
            </button>
            {step !== "confirm" && (
              <button onClick={handleNext} className="flex-1 brutal-button-yellow text-sm">
                NEXT
              </button>
            )}
            {step === "confirm" && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 brutal-button-yellow text-sm disabled:opacity-50"
              >
                {isSubmitting ? "INITIALIZING..." : "INITIALIZE PROTOCOL"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
