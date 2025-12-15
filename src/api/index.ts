import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";

const app = new Hono();

// Health check endpoint for Railway
// Using /healthz instead of /health because /health is reserved by Ponder
// More lenient health check that doesn't fail during sync operations
app.get("/healthz", async (c) => {
  try {
    // Simple database connectivity check with timeout
    // This is more lenient and won't fail if sync is in progress
    const result = await Promise.race([
      db.select().from(schema.buildersProject).limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Health check timeout")), 5000)
      )
    ]);
    return c.json({ 
      status: "healthy", 
      timestamp: Date.now(),
      schema: "connected"
    });
  } catch (error) {
    // Even if database query fails, return 200 if server is running
    // This prevents Railway from killing the container during sync
    return c.json({ 
      status: "degraded", 
      timestamp: Date.now(),
      error: String(error).substring(0, 100) // Truncate error message
    });
  }
});

// Ready endpoint - check database connectivity and schema initialization
// Using /readyz instead of /ready because /ready is reserved by Ponder
app.get("/readyz", async (c) => {
  try {
    await db.select().from(schema.buildersProject).limit(1);
    return c.json({ status: "ready", timestamp: Date.now() });
  } catch (error) {
    return c.json({ status: "not ready", error: String(error) }, 503);
  }
});

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;