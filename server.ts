import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Firebase Admin SDK Initialization ──────────────────
// Uses Application Default Credentials in Cloud Run / local gcloud auth
const configPath = path.join(__dirname, "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

admin.initializeApp({
  projectId: config.projectId,
});

const db = admin.firestore();
db.settings({ databaseId: config.firestoreDatabaseId });

// ─── Types ──────────────────────────────────────────────
interface VaultAccount {
  id: string;
  email: string;
  password?: string;
  platform: string;
  apiKey: string;
  status: string;
}

interface VaultProxy {
  id: string;
  ip: string;
  port: string;
  username?: string;
  password?: string;
}

interface VaultCacheEntry {
  accounts: VaultAccount[];
  proxies: VaultProxy[];
  strategy: string;
  backendSecret: string;
  userId: string;
  lastFetched: number;
}

interface VaultRuntimeState {
  currentIdx: number;
  stats: {
    totalServed: number;
    rateLimitHits: number;
    totalLatencyMs: number;
    requestCount: number;
    accountUsage: Record<string, number>;
  };
}

// ─── In-Memory Cache & Stats ────────────────────────────
const CACHE_TTL_MS = 30_000; // 30 seconds
const vaultCache: Record<string, VaultCacheEntry> = {};
const vaultState: Record<string, VaultRuntimeState> = {};

function getOrInitState(vaultKey: string): VaultRuntimeState {
  if (!vaultState[vaultKey]) {
    vaultState[vaultKey] = {
      currentIdx: 0,
      stats: {
        totalServed: 0,
        rateLimitHits: 0,
        totalLatencyMs: 0,
        requestCount: 0,
        accountUsage: {},
      },
    };
  }
  return vaultState[vaultKey];
}

/**
 * Load vault data from cache or Firestore.
 * Cache entries expire after CACHE_TTL_MS milliseconds.
 */
async function loadVaultData(vaultKey: string): Promise<VaultCacheEntry | null> {
  const now = Date.now();
  const cached = vaultCache[vaultKey];
  if (cached && now - cached.lastFetched < CACHE_TTL_MS) {
    return cached;
  }

  const docRef = db.collection("vaultRouting").doc(vaultKey);
  const snap = await docRef.get();

  if (!snap.exists) {
    // Remove stale cache
    delete vaultCache[vaultKey];
    return null;
  }

  const data = snap.data()!;
  const entry: VaultCacheEntry = {
    accounts: (data.accounts || []) as VaultAccount[],
    proxies: (data.proxies || []) as VaultProxy[],
    strategy: data.strategy || "round-robin",
    backendSecret: data.backendSecret || "",
    userId: data.userId || "",
    lastFetched: now,
  };
  vaultCache[vaultKey] = entry;
  return entry;
}

/**
 * Invalidate cache for a specific vault key (e.g., after mutation).
 */
function invalidateCache(vaultKey: string): void {
  delete vaultCache[vaultKey];
}

// ─── Routing Strategies ─────────────────────────────────

function selectAccountRoundRobin(
  accounts: VaultAccount[],
  state: VaultRuntimeState
): { account: VaultAccount; index: number } {
  const idx = state.currentIdx % accounts.length;
  state.currentIdx++;
  return { account: accounts[idx], index: idx };
}

function selectAccountRandom(
  accounts: VaultAccount[]
): { account: VaultAccount; index: number } {
  const idx = Math.floor(Math.random() * accounts.length);
  return { account: accounts[idx], index: idx };
}

function selectAccountLeastUsed(
  accounts: VaultAccount[],
  state: VaultRuntimeState
): { account: VaultAccount; index: number } {
  let minUsage = Infinity;
  let minIdx = 0;
  for (let i = 0; i < accounts.length; i++) {
    const usage = state.stats.accountUsage[accounts[i].id] || 0;
    if (usage < minUsage) {
      minUsage = usage;
      minIdx = i;
    }
  }
  return { account: accounts[minIdx], index: minIdx };
}

// long-life = same as least-used but prefers accounts with fewer total requests
function selectAccountLongLife(
  accounts: VaultAccount[],
  state: VaultRuntimeState
): { account: VaultAccount; index: number } {
  return selectAccountLeastUsed(accounts, state);
}

function selectAccount(
  accounts: VaultAccount[],
  strategy: string,
  state: VaultRuntimeState
): { account: VaultAccount; index: number } {
  switch (strategy) {
    case "random":
      return selectAccountRandom(accounts);
    case "least-used":
      return selectAccountLeastUsed(accounts, state);
    case "long-life":
      return selectAccountLongLife(accounts, state);
    default:
      return selectAccountRoundRobin(accounts, state);
  }
}

// ─── Server Setup ───────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // ─── API Proxy Endpoint ─────────────────────────────
  app.use("/v1", express.json(), async (req, res, _next) => {
    const startTime = Date.now();

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: { message: "Missing or invalid API key." } });
        return;
      }
      const vaultKey = authHeader.split(" ")[1];

      // Load vault data (with cache)
      const vault = await loadVaultData(vaultKey);
      if (!vault) {
        res.status(401).json({ error: { message: "Invalid API key." } });
        return;
      }

      // Copy active accounts for this request's retry loop
      let activeAccounts = vault.accounts.filter(acc => acc.status === "active");
      const proxies = vault.proxies || [];

      const state = getOrInitState(vaultKey);
      state.stats.totalServed++;

      if (activeAccounts.length === 0) {
        res.status(429).json({ error: { message: "No active accounts available in the vault." } });
        return;
      }

      const targetUrl = `https://api.openai.com${req.originalUrl}`;
      const maxRetries = Math.min(3, activeAccounts.length);
      let success = false;
      let lastErrorResponse: { status: number; data: string } | null = null;

      const upstreamReqHeaders: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (key !== "host" && key !== "connection" && typeof val === "string") {
          upstreamReqHeaders[key] = val;
        }
      }

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (activeAccounts.length === 0) break;

        // Select account based on strategy
        const { account: selectedAccount, index: accIndex } = selectAccount(
          activeAccounts,
          vault.strategy,
          state
        );

        // Track per-account usage
        state.stats.accountUsage[selectedAccount.id] =
          (state.stats.accountUsage[selectedAccount.id] || 0) + 1;

        // Select proxy (random)
        let fetchAgent = undefined;
        let selectedProxy: VaultProxy | null = null;
        if (proxies.length > 0) {
          selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
          const auth = selectedProxy.username
            ? `${selectedProxy.username}:${selectedProxy.password}@`
            : "";
          fetchAgent = new HttpsProxyAgent(`http://${auth}${selectedProxy.ip}:${selectedProxy.port}`);
        }

        console.log(
          `[Proxy] Attempt ${attempt + 1}: Routing using account ${selectedAccount.id} ${selectedProxy ? `via proxy ${selectedProxy.ip}` : "direct"}...`
        );

        try {
          const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
              ...upstreamReqHeaders,
              Authorization: `Bearer ${selectedAccount.apiKey}`,
            },
            body:
              req.method !== "GET" && req.method !== "HEAD"
                ? JSON.stringify(req.body)
                : undefined,
            agent: fetchAgent,
          });

          if (response.status === 401 || response.status === 429) {
            const errorData = await response.clone().text();
            console.warn(
              `[Proxy] Upstream error ${response.status} for account ${selectedAccount.id}: ${errorData}`
            );
            state.stats.rateLimitHits++;
            lastErrorResponse = { status: response.status, data: errorData };

            // Determine new status
            let newStatus = selectedAccount.status;
            if (
              response.status === 401 ||
              errorData.includes("insufficient_quota") ||
              errorData.includes("quota_exceeded") ||
              errorData.includes("billing_not_active")
            ) {
              newStatus = response.status === 401 ? "banned" : "exhausted";

              // Evict from current request's pool
              activeAccounts.splice(accIndex, 1);

              // Async update in Firestore using Admin SDK (bypasses rules)
              (async () => {
                try {
                  const docRef = db.collection("vaultRouting").doc(vaultKey);
                  const latestSnap = await docRef.get();
                  if (latestSnap.exists) {
                    const latestData = latestSnap.data()!;
                    const updatedAccounts = (latestData.accounts || []).map(
                      (acc: VaultAccount) =>
                        acc.id === selectedAccount.id
                          ? { ...acc, status: newStatus }
                          : acc
                    );
                    await docRef.update({
                      accounts: updatedAccounts,
                      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    // Invalidate cache since we mutated
                    invalidateCache(vaultKey);
                    console.log(
                      `[Proxy] Auto-updated account ${selectedAccount.id} to ${newStatus}`
                    );
                  }
                } catch (e) {
                  console.error(
                    `[Proxy] Failed to update account ${selectedAccount.id} status:`,
                    e
                  );
                }
              })();
            }
            continue;
          }

          // Success
          success = true;

          // Track latency
          const latencyMs = Date.now() - startTime;
          state.stats.totalLatencyMs += latencyMs;
          state.stats.requestCount++;

          res.status(response.status);
          response.headers.forEach((val: string, key: string) => {
            res.setHeader(key, val);
          });

          if (response.body) {
            response.body.pipe(res);
          } else {
            res.end();
          }
          break;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[Proxy] Network/Proxy error using account ${selectedAccount.id}:`,
            errMsg
          );
          lastErrorResponse = { status: 502, data: errMsg };
        }
      }

      if (!success && !res.headersSent) {
        if (lastErrorResponse) {
          res.status(lastErrorResponse.status).send(lastErrorResponse.data);
        } else {
          res.status(500).json({ error: { message: "All retries failed." } });
        }
      }
    } catch (err: unknown) {
      console.error("[Proxy] Server Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: { message: "Internal server proxy error." } });
      }
    }
  });

  // ─── API Stats Endpoint ────────────────────────────
  app.get("/api/vault/stats/:vaultKey", express.json(), async (req, res) => {
    try {
      const { vaultKey } = req.params;
      const st = vaultState[vaultKey];

      if (st) {
        const avgLatencyMs =
          st.stats.requestCount > 0
            ? Math.round(st.stats.totalLatencyMs / st.stats.requestCount)
            : 0;

        res.json({
          totalServed: st.stats.totalServed,
          rateLimitHits: st.stats.rateLimitHits,
          avgLatencyMs,
          accountUsage: st.stats.accountUsage,
        });
      } else {
        res.json({
          totalServed: 0,
          rateLimitHits: 0,
          avgLatencyMs: 0,
          accountUsage: {},
        });
      }
    } catch (err) {
      console.error("[Stats] Error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ─── Webhook: External Bot Account Sync ────────────
  app.post("/api/vault/accounts/sync", express.json(), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing Bearer Token (Use Vault Key)" });
        return;
      }
      const vaultKey = authHeader.split(" ")[1];

      // Validate request body
      const { email, password, apiKey, platform, status } = req.body;
      if (!apiKey || !email) {
        res.status(400).json({ error: "Invalid payload: requires email, apiKey" });
        return;
      }

      // Load vault and verify backendSecret from request header
      const backendSecret = req.headers["x-backend-secret"] as string;
      const vault = await loadVaultData(vaultKey);

      if (!vault) {
        res.status(401).json({ error: "Invalid Vault Key" });
        return;
      }

      // Verify backendSecret for webhook authentication
      if (!backendSecret || backendSecret !== vault.backendSecret) {
        res.status(403).json({ error: "Invalid backend secret. Include X-Backend-Secret header." });
        return;
      }

      // Build new account entry
      const newAccount: VaultAccount = {
        id: "bot-" + Date.now().toString(36) + Math.random().toString(36).substring(2),
        email,
        password: password || "",
        platform: platform || "GPT-5.5",
        apiKey,
        status: status || "active",
      };

      // Atomic update using Admin SDK
      const docRef = db.collection("vaultRouting").doc(vaultKey);
      await docRef.update({
        accounts: admin.firestore.FieldValue.arrayUnion(newAccount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Invalidate cache
      invalidateCache(vaultKey);

      console.log(`[Webhook] Auto-registered account ${email} appended to Vault ${vaultKey}`);
      res.json({ success: true, accountId: newAccount.id });
    } catch (err) {
      console.error("[Webhook] Sync Error:", err);
      res.status(500).json({ error: "Internal Error" });
    }
  });

  // ─── Vite middleware for development ────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
    return new Promise<void>((resolve) => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
        resolve();
      });
    });
}

export { startServer };

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
