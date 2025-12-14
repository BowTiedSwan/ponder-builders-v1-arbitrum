# Database Reset Instructions

## Problem
The PostgreSQL database is experiencing:
- Frequent restarts (every ~1 minute)
- WAL (Write-Ahead Log) corruption errors
- Connection terminations causing app crashes
- "invalid record length" errors in recovery

This is likely due to corruption from the previous disk space crash.

## Solution: Delete and Recreate PostgreSQL Service

Since we're starting from a new block (`24381796`), we can safely wipe the database.

### Step 1: Delete the Current PostgreSQL Service

**Via Railway Web Dashboard:**
1. Go to https://railway.app
2. Navigate to project: `ponder-builders-v1-base`
3. Find the **`Postgres`** service
4. Click on it → **Settings** tab
5. Scroll to **Danger Zone**
6. Click **Delete Service** or **Remove Service**
7. Confirm deletion

**⚠️ Warning:** This will delete all data, but since we're starting fresh from block `24381796`, this is expected.

### Step 2: Recreate PostgreSQL Service

After deletion, run this command:

```bash
railway add --database postgres
```

This will:
- Create a fresh PostgreSQL service
- Automatically inject `DATABASE_URL` into the app service
- Provide a clean, uncorrupted database

### Step 3: Verify Connection

The app service will automatically pick up the new `DATABASE_URL`. Verify it's set correctly:

```bash
railway variables | grep DATABASE_URL
```

### Step 4: Redeploy App

The app should automatically redeploy, or trigger manually:

```bash
railway up
```

## Why This Happened

The database volume (`postgres-volume-Qzu0`) contains corrupted WAL files from the previous crash when disk space ran out. PostgreSQL cannot recover from this corruption, so a fresh start is needed.

## Prevention

- Monitor disk usage (set alerts at 80%)
- The connection pool has been reduced from 30 to 10 connections to avoid overwhelming the Hobby plan
- Starting from block `24381796` means less historical data to index
