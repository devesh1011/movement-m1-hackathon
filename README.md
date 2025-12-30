# SCAVNGER - Web3 Challenge Protocol

A decentralized challenge platform where users stake tokens and compete in time-bound protocols. Built for the Movement M1 Hackathon.

## Overview

SCAVNGER is a brutalist-styled web3 application that enables users to:
- **Create & Join Challenges**: Users stake tokens to participate in time-bound challenges
- **On-Chain Verification**: Smart contracts manage stakes, proofs, and prize distribution
- **Real-Time Leaderboards**: Track progress across active protocols
- **Wallet Integration**: Seamless Privy auth + Movement network wallet support

## Project Structure

```
movement-m1-hack/
├── frontend/              # Next.js app (User interface)
│   ├── app/              # Next.js 16 app router
│   │   ├── page.tsx      # Landing page (Privy login)
│   │   ├── home/         # Challenge feed
│   │   ├── challenge/    # Challenge details
│   │   └── create/       # Create new challenge
│   ├── components/       # Reusable React components
│   ├── lib/              # Utilities (Supabase, Aptos SDK)
│   └── package.json      # Frontend dependencies
│
├── contracts/            # Move smart contracts
│   ├── sources/          # Challenge factory & goal tracking
│   ├── Move.toml         # Move package config
│   └── build/            # Compiled bytecode
│
├── ai-oracle/            # Verifier service
│   ├── index.ts          # Oracle entry point
│   ├── verifier.ts       # Proof verification logic
│   └── package.json      # Dependencies
│
└── package.json          # Root workspace config
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Auth**: Privy (Web3 authentication)
- **Blockchain**: Movement Network (Aptos SDK), Move smart contracts
- **Backend**: Supabase (Postgres, Storage, Auth)
- **Deployment**: Vercel (frontend)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- `.env.local` file with Privy & Supabase credentials

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Smart Contracts

```bash
cd contracts
aptos move compile
# Or use Movement CLI
movement move build
```

### AI Oracle

```bash
cd ai-oracle
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` in the `frontend/` directory:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Key Features

- ✅ Web3 wallet authentication (Privy)
- ✅ On-chain challenge creation & management
- ✅ Real-time challenge feed with Supabase sync
- ✅ User profile management
- ✅ Proof submission & verification
- ✅ Prize pool distribution logic

## Development Notes

- The frontend uses a **brutalist design** with yellow (`#FAFF00`) accent color
- All async operations include error boundaries
- Supabase profiles synced on user login
- Movement testnet configured in Aptos SDK

## License

Built for Movement M1 Hackathon 2025
