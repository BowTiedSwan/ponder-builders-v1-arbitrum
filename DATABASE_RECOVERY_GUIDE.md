# Database Recovery Guide - Railway PostgreSQL Crash

## Problem
The PostgreSQL database on Railway crashed due to disk space exhaustion:
- Error: `FATAL: could not write to file "pg_wal/xlogtemp.29": No space left on device`
- Database was at 90% usage before crash
- Database is in recovery state but cannot complete due to lack of space
- Ponder configuration was updated to start indexing from a later block, so old data is no longer needed

## Solution: Wipe and Recreate Database

Since the Ponder configuration now starts from a later block (block `24381796` for Builders contract), we can safely wipe the database and start fresh.

### Step 1: Delete the Crashed PostgreSQL Service

**Via Railway Web Dashboard:**
1. Go to https://railway.app
2. Navigate to your project: `ponder-builders-v1-base`
3. Find the **Postgres** service
4. Click on the service
5. Go to **Settings** tab
6. Scroll to the **Danger Zone** section
7. Click **Delete Service** or **Remove Service**
8. Confirm the deletion

**Note:** This will permanently delete all data, but since we're starting from a later block, this is expected.

### Step 2: Add a New PostgreSQL Service

After deletion, run this command in your project directory:

```bash
railway add --database postgres
```

This will:
- Create a new PostgreSQL service
- Automatically inject `DATABASE_URL` environment variable
- Provide a clean, empty database

### Step 3: Redeploy Ponder Service

After the new PostgreSQL service is created, trigger a redeploy:

```bash
railway up
```

Or let Railway auto-deploy on the next git push.

### Step 4: Verify Database is Empty

Once the service is running, verify the database is clean:

```bash
railway connect postgres -- psql -c "\dt"
```

This should show no tables (or only system tables).

### Step 5: Monitor Initial Indexing

After redeployment, Ponder will:
1. Create fresh database schema
2. Start indexing from the configured start block (`24381796` for Builders)
3. Index only the blocks needed going forward

Monitor the logs to ensure indexing starts correctly:

```bash
railway logs --service ponder-builders-v1-base
```

## Alternative: If You Can't Access Web Dashboard

If you cannot access the Railway web dashboard, you can try:

1. **Contact Railway Support** - They may be able to reset the database
2. **Create a new environment** - Create a new environment with a fresh PostgreSQL service:
   ```bash
   railway environment new staging
   railway environment link staging
   railway add --database postgres
   ```
   Then update your deployment to use the new environment.

## Prevention

To prevent this issue in the future:

1. **Monitor disk usage** - Set up alerts in Railway for disk usage > 80%
2. **Regular cleanup** - If changing start blocks, wipe the database first
3. **Database size limits** - Consider Railway's database size limits and upgrade if needed
4. **Archive old data** - If you need historical data, export it before wiping

## Current Configuration

Based on `ponder.config.ts`:
- **Builders Contract Start Block:** `24381796` (from env or default)
- **MOR Token Start Block:** `7500000` (from env or default)
- **Database:** PostgreSQL (via `DATABASE_URL`)

The database will be recreated with only data from these start blocks forward.
