"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  // Get the user and logout function from Privy
  const { logout, user } = usePrivy();

  // Helper to format the wallet address: 0x1234...5678
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleLogout = async () => {
    // 1. Clear your custom cookie
    document.cookie = "scavnger-session=; max-age=0; path=/";
    // 2. Perform Privy logout to clear internal state/embedded wallet
    await logout();
    // 3. Kick back to landing
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className="bg-black border-b-4 border-black sticky top-0 z-50"
      style={{ boxShadow: "0 4px 0px rgba(0, 255, 0, 0.3)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="group">
          <h1
            className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white group-hover:text-[#FAFF00] transition-colors"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            PROTOCOL 75
          </h1>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/home">
            <button
              className={`px-3 py-1 text-xs font-mono uppercase tracking-tight transition-all ${
                isActive("/home")
                  ? "text-[#FAFF00] border-b-2 border-[#FAFF00]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Active Zones
            </button>
          </Link>
          <Link href="/dashboard">
            <button
              className={`px-3 py-1 text-xs font-mono uppercase tracking-tight transition-all ${
                isActive("/dashboard")
                  ? "text-[#FAFF00] border-b-2 border-[#FAFF00]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              My Operations
            </button>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Real Wallet Block */}
          <div className="hidden sm:block border-2 border-white/20 bg-black px-3 py-2 font-mono text-[10px] text-gray-400">
            <div className="text-[#00FF00]">
              ID:{" "}
              {user?.wallet?.address
                ? formatAddress(user.wallet.address)
                : "N/A"}
            </div>
            <div>STATUS: AUTH_SECURED</div>
          </div>

          {/* Create Challenge Button */}
          <Link href="/create">
            <button className="bg-[#FAFF00] text-black font-black px-4 py-2 text-xs uppercase hover:bg-white transition-colors shadow-[2px_2px_0px_white]">
              CREATE
            </button>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white font-black px-4 py-2 text-xs uppercase hover:bg-red-500 transition-colors"
            style={{ boxShadow: "2px 2px 0px white" }}
          >
            EXIT
          </button>
        </div>
      </div>
    </nav>
  );
}
