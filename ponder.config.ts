import { createConfig, factory } from "ponder";
import { parseAbiItem, http, type Abi } from "viem";
import { loadBalance, rateLimit } from "ponder";

// Import ABIs from local files
import { BuildersAbi, ERC20Abi, L2FactoryAbi, SubnetFactoryAbi } from "./abis/index.js";

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
            max: 30,
          },
        },
      }
    : {}),
  chains: {
    arbitrum: {
      id: 42161,
      rpc: loadBalance([
        http(process.env.PONDER_RPC_URL_42161!),
        rateLimit(http("https://arbitrum-one.public.blastapi.io"), { 
          requestsPerSecond: 25 
        }),
        rateLimit(http("https://arbitrum-one-rpc.publicnode.com"), { 
          requestsPerSecond: 10 
        }),
      ]),
    },
  },
  contracts: {
    // Main Builders staking contract - Arbitrum mainnet
    Builders: {
      abi: BuildersAbi as Abi,
      chain: "arbitrum",
      address: (process.env.BUILDERS_CONTRACT_ADDRESS || "0xC0eD68f163d44B6e9985F0041fDf6f67c6BCFF3f") as `0x${string}`,
      startBlock: Number(process.env.BUILDERS_START_BLOCK || "18000000"),
      includeTransactionReceipts: true,
    },

    // MOR Token contract - for tracking transfers and approvals
    MorToken: {
      abi: ERC20Abi as Abi,
      chain: "arbitrum",
      address: (process.env.MOR_TOKEN_ADDRESS || "0x092bAaDB7DEf4C3981454dD9c0A0D7FF07bCFc86") as `0x${string}`,
      startBlock: Number(process.env.MOR_TOKEN_START_BLOCK || "17500000"),
    },

    // L2 Factory - Arbitrum only, creates builder subnets
    L2Factory: {
      abi: L2FactoryAbi as Abi,
      chain: "arbitrum",
      address: (process.env.L2_FACTORY_ADDRESS || "0x890bfa255e6ee8db5c67ab32dc600b14ebc4546c") as `0x${string}`,
      startBlock: Number(process.env.L2_FACTORY_START_BLOCK || "18000000"),
    },

    // Subnet Factory - Arbitrum only, creates subnet instances
    SubnetFactory: {
      abi: SubnetFactoryAbi as Abi,
      chain: "arbitrum",
      address: (process.env.SUBNET_FACTORY_ADDRESS || "0x37b94bd80b6012fb214bb6790b31a5c40d6eb7a5") as `0x${string}`,
      startBlock: Number(process.env.SUBNET_FACTORY_START_BLOCK || "18000000"),
    },

    // Dynamic contracts created by L2Factory
    DynamicSubnet: {
      abi: BuildersAbi as Abi, // Assuming subnets use similar interface
      chain: "arbitrum",
      address: factory({
        address: (process.env.L2_FACTORY_ADDRESS || "0x890bfa255e6ee8db5c67ab32dc600b14ebc4546c") as `0x${string}`,
        event: parseAbiItem("event SubnetCreated(address indexed subnet, address indexed creator, bytes32 salt)"),
        parameter: "subnet",
      }),
    },
  },
});
