# Ponder Project Deployment Checklist

This checklist documents all configuration changes and fixes required for deploying a Ponder project to Railway (or similar platforms). Use this checklist to review other Ponder projects before deployment.

## Pre-Deployment Configuration

### 1. Railway Project Setup
- [ ] Create Railway project and link to repository
- [ ] Add PostgreSQL service (required for production)
- [ ] Verify `DATABASE_URL` is automatically injected from PostgreSQL service
- [ ] Generate Railway domain (optional, for API access)

### 2. Environment Variables
- [ ] Set `PONDER_RPC_URL_8453` (or appropriate chain ID) - Required for production
  - Base mainnet: `https://mainnet.base.org` (fallback) or Alchemy/Infura URL
  - Should have fallback to public RPCs in config for local development
- [ ] Verify contract addresses have defaults in `ponder.config.ts` (optional overrides)
- [ ] Verify start blocks have defaults in `ponder.config.ts` (optional overrides)
- [ ] Set `NODE_ENV=production` (auto-detected by Railway)

### 3. RPC Configuration (`ponder.config.ts`)
- [ ] RPC URL uses fallback pattern: `process.env.PONDER_RPC_URL_8453 || "https://mainnet.base.org"`
- [ ] Includes public RPC fallbacks for local development
- [ ] Uses `loadBalance()` for multiple RPC endpoints
- [ ] Applies rate limiting to public RPCs

**Example:**
```typescript
rpc: loadBalance([
  http(process.env.PONDER_RPC_URL_8453 || "https://mainnet.base.org"),
  rateLimit(http("https://base-rpc.publicnode.com"), { 
    requestsPerSecond: 10 
  }),
]),
```

## Schema Validation

### 4. Foreign Key Constraints
- [ ] **CRITICAL**: Remove all `.references()` calls from schema - Ponder doesn't support foreign key constraints
- [ ] Keep `relations()` definitions (they're for GraphQL, not database constraints)
- [ ] Verify schema builds without foreign key errors

**Example Fix:**
```typescript
// ❌ WRONG - Will cause build failure
buildersProjectId: t.hex().notNull().references(() => buildersProject.id),

// ✅ CORRECT - No FK constraint
buildersProjectId: t.hex().notNull(), // Reference to buildersProject.id (no FK constraint)
```

### 5. Schema Field Types
- [ ] Verify all schema fields match ABI event structures
- [ ] Check that `bigint()` is used for uint256 values
- [ ] Check that `integer()` is used for uint128/timestamp values
- [ ] Check that `hex()` is used for addresses and bytes32
- [ ] Check that `text()` is used for strings

## Event Handlers

### 6. Event Names Match ABI
- [ ] Verify event names exactly match ABI (case-sensitive)
- [ ] Check for common mismatches:
  - `Deposited` → `UserDeposited`
  - `Withdrawn` → `UserWithdrawn`
  - `Claimed` → May not exist (check ABI)

**Common Issues:**
- Event names in handlers must match ABI exactly
- Check ABI for actual event names before writing handlers

### 7. Event Argument Extraction
- [ ] Verify event argument names match ABI
- [ ] Check for tuple/struct extraction:
  - `BuilderPoolCreated` has `builderPoolId` (indexed) and `builderPool` (tuple)
  - Extract tuple fields correctly: `const { name, admin, ... } = builderPool`
- [ ] Verify argument types match (bytes32 vs hex, etc.)

**Example Fix:**
```typescript
// ❌ WRONG - Incorrect argument extraction
const { poolId, name, admin } = event.args;

// ✅ CORRECT - Proper tuple extraction
const { builderPoolId, builderPool } = event.args;
const { name, admin, poolStart, ... } = builderPool;
```

### 8. Missing Events
- [ ] Document events that don't exist in ABI (e.g., `Claimed`)
- [ ] Add comments explaining why handlers are missing
- [ ] Consider alternative tracking methods if needed

## API Routes

### 9. Reserved Routes
- [ ] **CRITICAL**: Do NOT use `/health` or `/ready` - These are reserved by Ponder
- [ ] Use `/healthz` for health checks (Kubernetes convention)
- [ ] Use `/readyz` for readiness checks
- [ ] Update Railway config to use `/healthz`

**Required Changes:**
- `src/api/index.ts`: Change routes to `/healthz` and `/readyz`
- `railway.toml`: Update `healthcheckPath = "/healthz"`
- `Dockerfile.production`: Update healthcheck CMD if used

### 10. Health Check Implementation
- [ ] Health check should verify database connectivity
- [ ] Use `db.select().from(schema.tableName).limit(1)` pattern
- [ ] Return 503 on failure (so Railway knows service is unhealthy)
- [ ] Don't require schema to be initialized (may fail during startup)

**Example:**
```typescript
app.get("/healthz", async (c: Context) => {
  try {
    await db.select().from(schema.buildersProject).limit(1);
    return c.json({ status: "healthy", timestamp: Date.now() });
  } catch (error) {
    return c.json({ status: "unhealthy", error: String(error) }, 503);
  }
});
```

### 11. Type Annotations
- [ ] Add `Context` type import from `hono`
- [ ] Type all route handler parameters: `async (c: Context) =>`
- [ ] Verify TypeScript compilation passes

## Database Configuration

### 12. Database Setup
- [ ] Verify `DATABASE_URL` is required in production
- [ ] Config should throw error if production without `DATABASE_URL`
- [ ] Use PGlite for local development (no DATABASE_URL)
- [ ] Use PostgreSQL for production (DATABASE_URL provided)

**Example:**
```typescript
if (isProduction && usingPGlite) {
  throw new Error("DATABASE_URL is required in production");
}
```

### 13. Schema Deployment
- [ ] Verify schema uses deployment-specific naming
- [ ] Check `--schema` parameter uses `${RAILWAY_DEPLOYMENT_ID}` for zero-downtime deployments
- [ ] Verify `--views-schema` is set correctly

## Railway Configuration

### 14. Railway Config Files
- [ ] `railway.toml` exists with correct `healthcheckPath`
- [ ] `nixpacks.toml` exists (if using custom build)
- [ ] `Procfile` exists (if needed)
- [ ] Start command includes schema parameters

**Example `railway.toml`:**
```toml
[deploy]
startCommand = "npm start -- --schema ${RAILWAY_DEPLOYMENT_ID:-default_schema} --views-schema views_schema"
healthcheckPath = "/healthz"
healthcheckTimeout = 300
```

### 15. Build Configuration
- [ ] Verify Node.js version matches `package.json` engines
- [ ] Check that all dependencies are in `package.json`
- [ ] Verify build process completes successfully
- [ ] Check for deprecated package warnings

## TypeScript Configuration

### 16. Type Declarations
- [ ] `ponder-env.d.ts` includes required module declarations:
  - `ponder:registry` (if using `ponder.on()`)
  - `ponder:api` (if using `db` in API routes)
  - `ponder:schema` (auto-generated)
- [ ] Verify TypeScript compilation passes: `npm run typecheck`
- [ ] Check for any implicit `any` types

## Testing Checklist

### 17. Local Development
- [ ] Project runs locally with `npm run dev`
- [ ] No reserved route errors
- [ ] Schema builds successfully
- [ ] Events are indexed correctly
- [ ] Database connects (PGlite for local)

### 18. Production Deployment
- [ ] Build succeeds on Railway
- [ ] Health check passes (`/healthz` returns 200)
- [ ] Database schema initializes correctly
- [ ] Events start indexing from configured start blocks
- [ ] No validation errors in logs

## Common Issues & Solutions

### Issue: "API route '/health' is reserved"
**Solution**: Change to `/healthz` in both API route and Railway config

### Issue: "Foreign key constraints are unsupported"
**Solution**: Remove all `.references()` calls from schema, keep `relations()` for GraphQL

### Issue: "Event name 'X' not found in contract ABI"
**Solution**: Check ABI for exact event names, update handlers to match

### Issue: "Cannot read properties of undefined"
**Solution**: Verify event argument extraction matches ABI structure (especially tuples)

### Issue: "DATABASE_URL is required in production"
**Solution**: Ensure PostgreSQL service is added and linked in Railway

### Issue: Health check fails during deployment
**Solution**: Use `/healthz` endpoint, ensure it doesn't require schema initialization

## Files to Review

- [ ] `ponder.config.ts` - RPC, database, contract configuration
- [ ] `ponder.schema.ts` - Schema definitions (no FK constraints)
- [ ] `src/index.ts` - Event handlers (match ABI exactly)
- [ ] `src/api/index.ts` - API routes (no reserved paths)
- [ ] `railway.toml` - Railway deployment config
- [ ] `package.json` - Dependencies and scripts
- [ ] `.gitignore` - Excludes node_modules, .env, etc.

## Quick Reference

**Reserved Routes (DO NOT USE):**
- `/health` ❌
- `/ready` ❌

**Use Instead:**
- `/healthz` ✅
- `/readyz` ✅

**Required Environment Variables:**
- `PONDER_RPC_URL_8453` (or appropriate chain ID) - Required for production
- `DATABASE_URL` - Auto-injected by Railway PostgreSQL service

**Schema Rules:**
- No `.references()` - Ponder doesn't support FK constraints
- Use `relations()` for GraphQL relationships only
- Match field types to ABI exactly

**Event Handler Rules:**
- Event names must match ABI exactly (case-sensitive)
- Extract tuple/struct arguments correctly
- Verify argument names match ABI

---

**Last Updated**: Based on deployment fixes for ponder-builders-v1-base
**Ponder Version**: 0.13.0

