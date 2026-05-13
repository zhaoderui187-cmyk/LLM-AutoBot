// Unified type definitions for AccVault system

import { Timestamp } from 'firebase/firestore';

// ─── Account ────────────────────────────────────────────
export type AccountStatus = 'active' | 'banned' | 'exhausted' | 'pending';

export interface Account {
  id: string;
  userId: string;
  platform: string;
  email: string;
  password?: string;
  apiKey?: string;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Proxy ──────────────────────────────────────────────
export type ProxyStatus = 'active' | 'inactive';

export interface Proxy {
  id: string;
  userId: string;
  ip: string;
  port: string;
  username?: string;
  password?: string;
  status: ProxyStatus;
  createdAt: Timestamp;
}

// ─── Task ───────────────────────────────────────────────
export type TaskStatus = 'running' | 'completed' | 'failed' | 'manual_action_required';

export interface Task {
  id: string;
  userId: string;
  name: string;
  status: TaskStatus;
  logs?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── VaultRouting ───────────────────────────────────────
export type RotationStrategy = 'round-robin' | 'random' | 'least-used' | 'long-life';

export interface VaultAccount {
  id: string;
  email: string;
  password?: string;
  platform: string;
  apiKey: string;
  status: AccountStatus;
}

export interface VaultProxy {
  id: string;
  ip: string;
  port: string;
  username?: string;
  password?: string;
  status: ProxyStatus;
}

export interface VaultRouting {
  userId: string;
  backendSecret: string;
  accounts: VaultAccount[];
  proxies: VaultProxy[];
  strategy?: RotationStrategy;
  updatedAt: Timestamp;
}

// ─── API Stats ──────────────────────────────────────────
export interface ApiStats {
  totalServed: number;
  rateLimitHits: number;
  avgLatencyMs: number;
  tokenEstimate: number;
  accountUsage: Record<string, number>;
}
