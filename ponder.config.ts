import { createConfig } from "ponder";
import { http, type Abi } from "viem";
import { loadBalance, rateLimit } from "ponder";

// Import ABIs from local files
import { BuildersAbi, FeeConfigAbi, ERC20Abi } from "./abis/index.js";

// Detect production environment
const isProduction = 
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT !== undefined ||
  process.env.RAILWAY_ENVIRONMENT_NAME === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.FLY_APP_NAME !== undefined;

// Validate database configuration
const databaseUrl = process.env.DATABASE_URL;
const usingPostgres = !!databaseUrl;
const usingPGlite = !databaseUrl;

if (isProduction && usingPGlite) {
  console.error("⚠️  CRITICAL WARNING: Running in production without DATABASE_URL!");
  console.error("⚠️  PGlite (ephemeral file-based database) will be used, which will cause DATA LOSS on restart!");
  console.error("⚠️  Set DATABASE_URL environment variable to use PostgreSQL for persistent storage.");
  console.error("⚠️  This is a production deployment - data will NOT persist across restarts!");
  throw new Error(
    "DATABASE_URL is required in production. PGlite is ephemeral and will cause data loss. " +
    "Please set DATABASE_URL to a PostgreSQL connection string."
  );
}

if (usingPostgres) {
  console.log("✅ Using PostgreSQL database (persistent storage)");
  console.log(`   Connection: ${databaseUrl?.replace(/:[^:@]+@/, ":****@")}`); // Mask password
} else {
  console.warn("⚠️  Using PGlite database (ephemeral file-based storage)");
  console.warn("⚠️  This is suitable for local development only.");
  console.warn("⚠️  Data will be lost on restart. Use DATABASE_URL for production.");
}

export default createConfig({
  // Database configuration: Use Postgres if DATABASE_URL is provided, otherwise use PGlite for local dev
  ...(databaseUrl
    ? {
        database: {
          kind: "postgres",
          connectionString: databaseUrl,
          poolConfig: {
            max: 10, // Reduced from 30 to avoid overwhelming Railway Hobby plan
          },
        },
      }
    : {}),
  chains: {
    arbitrumOne: {
      id: 42161,
      rpc: loadBalance([
        http(process.env.PONDER_RPC_URL_42161 || "https://arb1.arbitrum.io/rpc"),
        rateLimit(http("https://arbitrum-one-rpc.publicnode.com"), { 
          requestsPerSecond: 25 
        }),
      ]),
    },
  },
  contracts: {
    // Main Builders staking contract - Arbitrum One
    Builders: {
      abi: BuildersAbi as Abi,
      chain: "arbitrumOne",
      address: (process.env.BUILDERS_CONTRACT_ADDRESS || "0xC0eD68f163d44B6e9985F0041fDf6f67c6BCFF3f") as `0x${string}`,
      startBlock: Number(process.env.BUILDERS_START_BLOCK || "286160080"),
      includeTransactionReceipts: true,
    },

    // MOR Token contract - for tracking transfers and approvals
    MorToken: {
      abi: ERC20Abi as Abi,
      chain: "arbitrumOne",
      address: (process.env.MOR_TOKEN_ADDRESS || "0x7431ADA8A591C955A994A21710752ef9b882b8e3") as `0x${string}`,
      startBlock: Number(process.env.MOR_TOKEN_START_BLOCK || "286160080"),
    },

    // BuildersTreasury contract - Arbitrum One
    BuildersTreasury: {
      abi: BuildersAbi as Abi, // Using Builders ABI - update if treasury has different ABI
      chain: "arbitrumOne",
      address: (process.env.BUILDERS_TREASURY_ADDRESS || "0xCBE3d2c3AdE62cf7aa396e8cA93D2A8bff96E257") as `0x${string}`,
      startBlock: Number(process.env.BUILDERS_TREASURY_START_BLOCK || "286160108"),
    },

    // FeeConfig contract - Arbitrum One
    FeeConfig: {
      abi: FeeConfigAbi as Abi,
      chain: "arbitrumOne",
      address: (process.env.FEE_CONFIG_ADDRESS || "0xc03d87085E254695754a74D2CF76579e167Eb895") as `0x${string}`,
      startBlock: Number(process.env.FEE_CONFIG_START_BLOCK || "286160130"),
    },
  },
});
