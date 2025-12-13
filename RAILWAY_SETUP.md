# Railway Deployment Setup - ponder-builders-v1-arbitrum

## ✅ Completed Steps

1. **Railway Project Created**: `ponder-builders-v1-arbitrum`
   - Project ID: `39127020-0f3f-4648-94fb-1311cb91d298`
   - Environment: `production`

2. **PostgreSQL Service**: Added and configured
   - Service name: `Postgres`
   - `DATABASE_URL` will be automatically provided to all services

3. **Deployment Configuration**: Verified
   - `nixpacks.toml`: Uses `pnpm` and Node.js 18
   - `railway.toml`: Start command and health check configured
   - Health check endpoint: `/health`

## 🔄 Next Steps (Manual)

### 1. Connect GitHub Repository
   - Go to Railway dashboard: https://railway.com/project/39127020-0f3f-4648-94fb-1311cb91d298
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Railway will automatically create the Ponder service

### 2. Set Environment Variables
   Once the Ponder service is created, set these environment variables:

   **Required:**
   ```
   PONDER_RPC_URL_42161=<your-arbitrum-rpc-url>
   ```

   **Optional (with defaults from config):**
   ```
   BUILDERS_CONTRACT_ADDRESS=0xC0eD68f163d44B6e9985F0041fDf6f67c6BCFF3f
   BUILDERS_START_BLOCK=18000000
   MOR_TOKEN_ADDRESS=0x092bAaDB7DEf4C3981454dD9c0A0D7FF07bCFc86
   MOR_TOKEN_START_BLOCK=17500000
   L2_FACTORY_ADDRESS=0x890bfa255e6ee8db5c67ab32dc600b14ebc4546c
   L2_FACTORY_START_BLOCK=18000000
   SUBNET_FACTORY_ADDRESS=0x37b94bd80b6012fb214bb6790b31a5c40d6eb7a5
   SUBNET_FACTORY_START_BLOCK=18000000
   ```

   **Note:** `DATABASE_URL` is automatically provided by Railway from the Postgres service.

### 3. Verify Deployment
   - Check that the service is running
   - Verify health check: `https://<your-domain>/health`
   - Monitor logs to ensure indexing starts correctly

## Configuration Details

- **Start Command**: `pnpm start --schema ${RAILWAY_DEPLOYMENT_ID:-builders_v1_arbitrum_prod} --views-schema builders_v1_arbitrum`
- **Health Check**: `/health` (300s timeout)
- **Package Manager**: `pnpm`
- **Node Version**: 18.x

## Architecture

```
Railway Project: ponder-builders-v1-arbitrum
├── PostgreSQL Service (Postgres)
│   └── Provides DATABASE_URL automatically
└── Ponder Indexer Service (created after GitHub connection)
    ├── Connects to PostgreSQL via DATABASE_URL
    ├── Indexes Arbitrum contracts
    └── Exposes GraphQL API + Health endpoint
```

