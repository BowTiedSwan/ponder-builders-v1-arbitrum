# Railway Database Cleanup Guide

## Current Situation

You have **3 PostgreSQL-related services**:

1. **`Postgres`** ✅ - **KEEP THIS ONE** - Online and working
   - DATABASE_URL: `postgresql://postgres:dpXECryjEhQulRUkxCOIgZaxVazneqhp@postgres.railway.internal:5432/railway`
   - Volume: `postgres-volume-Qzu0`
   - This is the correct, working database

2. **`Postgres-6Rtg`** ❌ - **DELETE THIS** - Duplicate I accidentally created
   - Currently initializing
   - This is unnecessary and should be removed

3. **`ponder-builders-v1-base`** (App Service)
   - Has incorrect volume mount variables pointing to old crashed database
   - Needs to use DATABASE_URL from the `Postgres` service

## Steps to Fix

### Step 1: Delete the Duplicate PostgreSQL Service

**Via Railway Web Dashboard:**
1. Go to https://railway.app
2. Navigate to project: `ponder-builders-v1-base`
3. Find **`Postgres-6Rtg`** service
4. Click on it → Settings → Danger Zone → Delete Service
5. Confirm deletion

### Step 2: Verify App Service Uses Correct Database

The app service (`ponder-builders-v1-base`) should automatically get `DATABASE_URL` from the `Postgres` service. If not, manually set it:

**Correct DATABASE_URL:**
```
postgresql://postgres:dpXECryjEhQulRUkxCOIgZaxVazneqhp@postgres.railway.internal:5432/railway
```

### Step 3: Remove Volume Mount Variables (if still present)

The app service should NOT have these volume-related variables:
- `RAILWAY_VOLUME_ID`
- `RAILWAY_VOLUME_MOUNT_PATH`
- `RAILWAY_VOLUME_NAME`

These are for the PostgreSQL service itself, not the app. If they're still on the app service, they can be ignored (they won't affect functionality) or removed via Railway dashboard.

### Step 4: Redeploy

After cleanup, redeploy the app:
```bash
railway up
```

## Summary

- **Keep:** `Postgres` service (the working one)
- **Delete:** `Postgres-6Rtg` service (duplicate)
- **Fix:** Ensure app service uses DATABASE_URL from `Postgres` service
- **Result:** One PostgreSQL database, one app service
