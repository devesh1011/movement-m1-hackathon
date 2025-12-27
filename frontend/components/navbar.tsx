"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    document.cookie = "scavnger-session=; max-age=0; path=/"
    router.push("/")
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav
      className="bg-black border-b-4 border-black sticky top-0 z-50"
      style={{ boxShadow: "0 4px 0px rgba(0, 255, 0, 0.3)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="group">
          <h1
            className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white group-hover:text-green-500 transition-colors"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            SCAVNGER
          </h1>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/home">
            <button
              className={`px-3 py-1 text-xs font-mono uppercase tracking-tight transition-all ${
                isActive("/home") ? "text-green-500 border-b-2 border-green-500" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Active Zones
            </button>
          </Link>
          <Link href="/dashboard">
            <button
              className={`px-3 py-1 text-xs font-mono uppercase tracking-tight transition-all ${
                isActive("/dashboard")
                  ? "text-green-500 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              My Operations
            </button>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Wallet/Profile Block */}
          <div className="hidden sm:block border-2 border-green-500 bg-gray-950 px-3 py-2 font-mono text-xs text-green-500">
            <div>WALLET: 0x7A...9D2</div>
            <div>STATUS: JACKED IN</div>
          </div>

          {/* Create Challenge Button */}
          <Link href="/create">
            <button className="brutal-button text-sm md:text-base whitespace-nowrap">CREATE</button>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="brutal-button text-sm md:text-base whitespace-nowrap bg-red-600 hover:bg-red-700"
            style={{ boxShadow: "4px 4px 0px rgb(255, 0, 0)" }}
          >
            EXIT
          </button>
        </div>
      </div>
    </nav>
  )
}
