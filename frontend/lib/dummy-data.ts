export const challenges = [
  {
    id: "1",
    title: "30 DAY CODE CRUNCH",
    buyIn: "50",
    players: 142,
    pot: "7100",
    duration: "30",
    startDate: "2025-01-15",
    description: "Commit to GitHub daily. Prove your discipline. No days off.",
    rules: "Daily Task: Push 1 commit to GitHub. Verification: Automated API scan of repository.",
    verificationType: "github",
    participants: ["0xAB...4F2", "0x23...8C1", "0xDF...9E7", "0x45...2A3", "0x67...BC9", "0x89...1D2", "0xCD...5E4"],
  },
  {
    id: "2",
    title: "90 DAY FITNESS GAUNTLET",
    buyIn: "100",
    players: 89,
    pot: "8900",
    duration: "90",
    startDate: "2025-02-01",
    description: "Push your body to the limit. Daily workout proof required. Transform yourself.",
    rules:
      "Daily Task: Complete workout (30+ min) and upload proof. Verification: AI Vision analysis of fitness activity.",
    verificationType: "vision",
    participants: ["0x11...3K2", "0x22...5L8", "0x33...7M4", "0x44...9N1", "0x55...2O6"],
  },
  {
    id: "3",
    title: "7 DAY NO SUGAR SPRINT",
    buyIn: "25",
    players: 234,
    pot: "5850",
    duration: "7",
    startDate: "2025-01-20",
    description: "Cut sugar completely. Pure discipline. One week of clarity.",
    rules: "Daily Task: Report compliance. Verification: Manual host approval via daily check-in.",
    verificationType: "manual",
    participants: ["0x99...6P5", "0xAA...8Q2", "0xBB...1R9", "0xCC...3S7", "0xDD...4T5"],
  },
  {
    id: "4",
    title: "60 DAY READING PROTOCOL",
    buyIn: "35",
    players: 156,
    pot: "5460",
    duration: "60",
    startDate: "2025-02-15",
    description: "Read 1 book per week. Expand your mind. Track progress.",
    rules: "Daily Task: Read 30+ pages. Verification: Manual host review of reading logs.",
    verificationType: "manual",
    participants: ["0xEE...5U3", "0xFF...6V1", "0x00...7W9"],
  },
  {
    id: "5",
    title: "14 DAY MEDITATION MINDSET",
    buyIn: "15",
    players: 312,
    pot: "4680",
    duration: "14",
    startDate: "2025-01-25",
    description: "Meditate daily. Build mental resilience. Find your center.",
    rules: "Daily Task: 20+ min meditation session. Verification: Photo proof of meditation app or evidence.",
    verificationType: "vision",
    participants: ["0x11...8X4", "0x22...9Y2", "0x33...0Z8", "0x44...1A6"],
  },
]

export const userStats = {
  totalStaked: "425",
  estimatedEarnings: "1250",
  survivalStreak: 12,
  completedChallenges: 7,
  totalEarned: "3500",
}

export const userActiveChallenges = [
  {
    id: "1",
    title: "30 DAY CODE CRUNCH",
    dayNumber: 12,
    totalDays: 30,
    dailyStatus: "secured",
    progress: 40,
  },
  {
    id: "3",
    title: "7 DAY NO SUGAR SPRINT",
    dayNumber: 3,
    totalDays: 7,
    dailyStatus: "secured",
    progress: 43,
  },
]

export const getChallengeById = (id: string | string[] | undefined) => {
  const challengeId = Array.isArray(id) ? id[0] : id
  return challenges.find((c) => c.id === challengeId)
}
