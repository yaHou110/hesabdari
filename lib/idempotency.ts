// Himoora Financial Suite - Idempotency Key Engine & Financial Mutation Middleware
// Guarantees exact-once execution semantics for financial mutations (Invoices, Journal Postings, Fiscal Closings, Payments)
// Eliminates duplicate double-entry postings, race conditions, and side-effect replay vulnerabilities

import { NextRequest, NextResponse } from 'next/server';

export type IdempotencyStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface IdempotencyRecord<T = any> {
  key: string;
  requestHash: string;
  endpoint: string;
  method: string;
  status: IdempotencyStatus;
  statusCode: number;
  responseBody: T;
  headers: Record<string, string>;
  createdAt: string;
  resolvedAt?: string;
  expiresAt: string;
  entityType?: 'Invoice' | 'JournalEntry' | 'Payment' | 'FiscalPeriod' | 'BankAccount' | string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  sideEffectsCount: number;
  sideEffects: string[];
  executionDurationMs?: number;
}

export interface AcquireLockResult {
  status: 'ACQUIRED' | 'CACHED' | 'CONFLICT' | 'IN_FLIGHT';
  record?: IdempotencyRecord;
  error?: {
    code: 'IDEMPOTENCY_PAYLOAD_MISMATCH' | 'CONCURRENT_MUTATION_IN_PROGRESS' | 'MALFORMED_KEY' | 'EXPIRED_KEY';
    messageEn: string;
    messageFa: string;
    httpStatus: number;
  };
}

export interface IdempotencyOptions {
  ttlSeconds?: number; // Default 24 hours (86,400s)
  requireKey?: boolean; // If true, rejects requests missing Idempotency-Key
  extractEntityType?: (body: any) => string;
  extractEntityId?: (body: any, resBody?: any) => string;
}

// Cryptographic hash generation for request payload fingerprinting
function computePayloadHash(method: string, endpoint: string, body: any, actorId?: string): string {
  const normalizedMethod = (method || 'POST').toUpperCase();
  const normalizedEndpoint = (endpoint || '').trim().toLowerCase();
  const actor = (actorId || 'anonymous').trim();
  
  // Deterministic JSON stringification
  let bodyStr = '';
  if (body) {
    if (typeof body === 'string') {
      bodyStr = body.trim();
    } else {
      const sortedKeys = Object.keys(body).sort();
      const canonicalObj: Record<string, any> = {};
      sortedKeys.forEach((k) => {
        canonicalObj[k] = body[k];
      });
      bodyStr = JSON.stringify(canonicalObj);
    }
  }

  const combined = `${normalizedMethod}:${normalizedEndpoint}:${actor}:${bodyStr}`;
  
  // 64-bit FNV-1a hash implementation
  let hash1 = 0x811c9dc5;
  let hash2 = 0x84222325;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    hash1 ^= code;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= (code << 1);
    hash2 = Math.imul(hash2, 0x01000193);
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `0x${hex1}${hex2}`.toUpperCase();
}

class IdempotencyEngine {
  private store: Map<string, IdempotencyRecord> = new Map();
  private defaultTtlMs: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.seedInitialKeys();
  }

  private seedInitialKeys() {
    const now = Date.now();
    this.store.set('idemp-inv-2024-0891-init', {
      key: 'idemp-inv-2024-0891-init',
      requestHash: '0x8FA12B00E719AC43',
      endpoint: '/api/financial/invoices',
      method: 'POST',
      status: 'RESOLVED',
      statusCode: 201,
      responseBody: {
        success: true,
        invNumber: '#INV-2024-0891',
        totalAmount: 48500,
        glPostingRef: '#JV-1403-1049',
      },
      headers: { 'Content-Type': 'application/json' },
      createdAt: new Date(now - 3600000).toISOString(),
      resolvedAt: new Date(now - 3599850).toISOString(),
      expiresAt: new Date(now + 82800000).toISOString(),
      entityType: 'Invoice',
      entityId: '#INV-2024-0891',
      actorId: 'usr-admin-1',
      actorName: 'Arash Kamali (CFO)',
      sideEffectsCount: 2,
      sideEffects: [
        'Created Invoice #INV-2024-0891 ($48,500.00)',
        'Posted Auto-GL Voucher #JV-1403-1049 (Dr. 1200 AR, Cr. 4010 Revenue, Cr. 2200 VAT)',
      ],
      executionDurationMs: 148,
    });

    this.store.set('idemp-jv-1403-1048-settle', {
      key: 'idemp-jv-1403-1048-settle',
      requestHash: '0x49B310DA89E198FA',
      endpoint: '/api/financial/journal-entries',
      method: 'POST',
      status: 'RESOLVED',
      statusCode: 201,
      responseBody: {
        success: true,
        jvRef: '#JV-1403-1048',
        totalTurnover: 38400,
        status: 'Posted',
      },
      headers: { 'Content-Type': 'application/json' },
      createdAt: new Date(now - 7200000).toISOString(),
      resolvedAt: new Date(now - 7199890).toISOString(),
      expiresAt: new Date(now + 79200000).toISOString(),
      entityType: 'JournalEntry',
      entityId: '#JV-1403-1048',
      actorId: 'usr-treasury-2',
      actorName: 'Automated Bank Feeds Engine',
      sideEffectsCount: 2,
      sideEffects: [
        'Posted Journal Voucher #JV-1403-1048 ($38,400.00)',
        'Updated GL Balances: Dr. 1010 Cash (+$38,400), Cr. 1200 AR (-$38,400)',
      ],
      executionDurationMs: 110,
    });
  }

  public generateKey(prefix: string = 'idemp'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const randInt = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}-${randInt}`;
  }

  public acquireLock(
    key: string,
    endpoint: string,
    method: string,
    body: any,
    actorId?: string,
    actorName?: string,
    ttlSeconds?: number
  ): AcquireLockResult {
    const trimmedKey = (key || '').trim();
    if (!trimmedKey || trimmedKey.length < 4) {
      return {
        status: 'CONFLICT',
        error: {
          code: 'MALFORMED_KEY',
          messageEn: 'Invalid or missing Idempotency-Key header.',
          messageFa: 'کلید یکتایی (Idempotency-Key) نامعتبر است یا ارسال نشده است.',
          httpStatus: 400,
        },
      };
    }

    const requestHash = computePayloadHash(method, endpoint, body, actorId);
    const now = new Date();
    const existing = this.store.get(trimmedKey);

    if (existing) {
      // Check if expired
      if (new Date(existing.expiresAt).getTime() < now.getTime()) {
        this.store.delete(trimmedKey);
      } else {
        // Check for payload mismatch
        if (existing.requestHash !== requestHash) {
          return {
            status: 'CONFLICT',
            record: existing,
            error: {
              code: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
              messageEn: `Idempotency-Key '${trimmedKey}' was previously used with a different request payload. Replaying with altered arguments is strictly forbidden to prevent ledger corruption.`,
              messageFa: `کلید یکتایی '${trimmedKey}' قبلاً با پارامترهای متفاوتی پردازش شده است. ارسال مجدد با بدنه تغییریافته به منظور جلوگیری از تناقض در دفتر کل مسدود است.`,
              httpStatus: 422,
            },
          };
        }

        // If in-flight / pending
        if (existing.status === 'PENDING') {
          return {
            status: 'IN_FLIGHT',
            record: existing,
            error: {
              code: 'CONCURRENT_MUTATION_IN_PROGRESS',
              messageEn: `A financial mutation with Idempotency-Key '${trimmedKey}' is currently in progress. Please retry shortly.`,
              messageFa: `تراکنش مالی با این کلید یکتایی در حال پردازش در پایگاه داده است. لطفاً چند لحظه دیگر بررسی فرمایید.`,
              httpStatus: 409,
            },
          };
        }

        // If completed / resolved
        return {
          status: 'CACHED',
          record: existing,
        };
      }
    }

    // Acquire lock (set PENDING)
    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

    const newRecord: IdempotencyRecord = {
      key: trimmedKey,
      requestHash,
      endpoint,
      method: method.toUpperCase(),
      status: 'PENDING',
      statusCode: 0,
      responseBody: null,
      headers: {},
      createdAt: now.toISOString(),
      expiresAt,
      actorId,
      actorName,
      sideEffectsCount: 0,
      sideEffects: [],
    };

    this.store.set(trimmedKey, newRecord);

    return {
      status: 'ACQUIRED',
      record: newRecord,
    };
  }

  public resolveLock<T>(
    key: string,
    statusCode: number,
    responseBody: T,
    headers: Record<string, string> = {},
    metadata?: {
      entityType?: string;
      entityId?: string;
      sideEffects?: string[];
      executionDurationMs?: number;
    }
  ): IdempotencyRecord<T> {
    const existing = this.store.get(key);
    const now = new Date();
    const resolvedRecord: IdempotencyRecord<T> = {
      ...(existing || {
        key,
        requestHash: '0xUNKNOWN',
        endpoint: 'unknown',
        method: 'POST',
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + this.defaultTtlMs).toISOString(),
      }),
      status: 'RESOLVED',
      statusCode,
      responseBody,
      headers: {
        ...headers,
        'X-Idempotency-Key': key,
        'X-Idempotency-Status': 'RESOLVED',
      },
      resolvedAt: now.toISOString(),
      entityType: metadata?.entityType || existing?.entityType,
      entityId: metadata?.entityId || existing?.entityId,
      sideEffectsCount: metadata?.sideEffects?.length || 0,
      sideEffects: metadata?.sideEffects || [],
      executionDurationMs: metadata?.executionDurationMs,
    };

    this.store.set(key, resolvedRecord as IdempotencyRecord);
    return resolvedRecord;
  }

  public rejectLock(
    key: string,
    statusCode: number,
    errorBody: any,
    errorMessage?: string
  ): IdempotencyRecord {
    const existing = this.store.get(key);
    const now = new Date();
    const rejectedRecord: IdempotencyRecord = {
      ...(existing || {
        key,
        requestHash: '0xUNKNOWN',
        endpoint: 'unknown',
        method: 'POST',
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + this.defaultTtlMs).toISOString(),
        sideEffectsCount: 0,
        sideEffects: [],
      }),
      status: 'REJECTED',
      statusCode: statusCode || 500,
      responseBody: errorBody,
      headers: {
        'X-Idempotency-Key': key,
        'X-Idempotency-Status': 'REJECTED',
      },
      resolvedAt: now.toISOString(),
      sideEffects: errorMessage ? [`Rejected: ${errorMessage}`] : ['Execution Failed'],
      sideEffectsCount: 0,
    };

    this.store.set(key, rejectedRecord);
    return rejectedRecord;
  }

  public getRecord(key: string): IdempotencyRecord | undefined {
    return this.store.get(key);
  }

  public hasRecord(key: string): boolean {
    return this.store.has(key);
  }

  public getAllRecords(): IdempotencyRecord[] {
    return Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public deleteRecord(key: string): boolean {
    return this.store.delete(key);
  }

  public clearExpired(): number {
    const now = Date.now();
    let count = 0;
    this.store.forEach((record, key) => {
      if (new Date(record.expiresAt).getTime() < now) {
        this.store.delete(key);
        count++;
      }
    });
    return count;
  }
}

// Global Singleton Idempotency Engine
export const idempotencyEngine = new IdempotencyEngine();

/**
 * Server-side Route Handler Idempotency Middleware Wrapper
 * Wraps Next.js App Router POST/PUT/DELETE handler functions to enforce idempotency keys
 */
export function withIdempotency(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: IdempotencyOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('x-idempotency-key') ||
      '';

    const method = req.method;
    const url = new URL(req.url);
    const endpoint = url.pathname;

    // Only apply idempotency to state-mutating requests (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return handler(req, context);
    }

    if (!idempotencyKey) {
      if (options.requireKey) {
        return NextResponse.json(
          {
            error: 'MISSING_IDEMPOTENCY_KEY',
            message: 'An Idempotency-Key header is strictly required for this financial mutation endpoint.',
            messageFa: 'ارسال هدر Idempotency-Key برای این عملیات مالی الزامی است.',
          },
          { status: 400 }
        );
      }
      // If key is optional and not provided, execute normally without idempotency caching
      return handler(req, context);
    }

    // Read and clone body for hashing
    let bodyObj: any = null;
    try {
      const clonedReq = req.clone();
      bodyObj = await clonedReq.json();
    } catch {
      bodyObj = {};
    }

    const actorId = req.headers.get('x-user-id') || 'usr-system';
    const actorName = req.headers.get('x-user-name') || 'Financial Operator';

    const startTime = Date.now();

    // Acquire lock
    const lockResult = idempotencyEngine.acquireLock(
      idempotencyKey,
      endpoint,
      method,
      bodyObj,
      actorId,
      actorName,
      options.ttlSeconds
    );

    // 1. Cached Response Replay
    if (lockResult.status === 'CACHED' && lockResult.record) {
      const cached = lockResult.record;
      return NextResponse.json(cached.responseBody, {
        status: cached.statusCode,
        headers: {
          ...cached.headers,
          'X-Idempotency-Key': idempotencyKey,
          'X-Idempotency-Replay': 'true',
          'X-Idempotency-Status': 'CACHED_RESOLVED',
          'X-Idempotency-Original-Timestamp': cached.createdAt,
        },
      });
    }

    // 2. Conflict or In-Flight Race Condition
    if (lockResult.status === 'CONFLICT' || lockResult.status === 'IN_FLIGHT') {
      return NextResponse.json(
        {
          error: lockResult.error?.code,
          message: lockResult.error?.messageEn,
          messageFa: lockResult.error?.messageFa,
          idempotencyKey,
        },
        { status: lockResult.error?.httpStatus || 409 }
      );
    }

    // 3. Lock Acquired: Execute Real Mutation Handler
    try {
      const response = await handler(req, context);
      const executionDurationMs = Date.now() - startTime;

      let resBody: any = null;
      try {
        const clonedRes = response.clone();
        resBody = await clonedRes.json();
      } catch {
        resBody = {};
      }

      const entityType = options.extractEntityType
        ? options.extractEntityType(bodyObj)
        : resBody?.entityType || undefined;
      const entityId = options.extractEntityId
        ? options.extractEntityId(bodyObj, resBody)
        : resBody?.id || resBody?.invNumber || resBody?.jvRef || undefined;

      const sideEffects: string[] = [];
      if (resBody?.invNumber) sideEffects.push(`Invoice ${resBody.invNumber} created`);
      if (resBody?.jvRef) sideEffects.push(`Journal Voucher ${resBody.jvRef} posted`);
      if (resBody?.closingRef) sideEffects.push(`Fiscal Year Closed with ref ${resBody.closingRef}`);

      // Resolve Lock with result
      idempotencyEngine.resolveLock(
        idempotencyKey,
        response.status,
        resBody,
        { 'Content-Type': 'application/json' },
        {
          entityType,
          entityId,
          sideEffects,
          executionDurationMs,
        }
      );

      // Add response headers
      response.headers.set('X-Idempotency-Key', idempotencyKey);
      response.headers.set('X-Idempotency-Status', 'RESOLVED');
      response.headers.set('X-Idempotency-Execution-Time-Ms', String(executionDurationMs));

      return response;
    } catch (err: any) {
      idempotencyEngine.rejectLock(
        idempotencyKey,
        500,
        { error: 'EXECUTION_FAILED', message: err.message },
        err.message
      );
      throw err;
    }
  };
}

/**
 * Client-Side Deduplication & Idempotent Mutation Dispatcher
 * Prevents UI double-clicks and guarantees exact-once execution across network retries
 */
export async function executeIdempotentMutation<T>(
  keyPrefix: string,
  payload: any,
  mutationExecutor: (key: string) => Promise<T>,
  existingKey?: string
): Promise<{ data: T; isReplay: boolean; idempotencyKey: string }> {
  const key = existingKey || idempotencyEngine.generateKey(keyPrefix);

  const lock = idempotencyEngine.acquireLock(
    key,
    `/client-mutation/${keyPrefix}`,
    'POST',
    payload,
    'client-session',
    'Interactive UI User'
  );

  if (lock.status === 'CACHED' && lock.record) {
    return {
      data: lock.record.responseBody as T,
      isReplay: true,
      idempotencyKey: key,
    };
  }

  if (lock.status === 'CONFLICT' || lock.status === 'IN_FLIGHT') {
    throw new Error(lock.error?.messageEn || 'Concurrent mutation in progress');
  }

  const startTime = Date.now();
  try {
    const result = await mutationExecutor(key);
    idempotencyEngine.resolveLock(key, 200, result, {}, {
      executionDurationMs: Date.now() - startTime,
    });
    return {
      data: result,
      isReplay: false,
      idempotencyKey: key,
    };
  } catch (err: any) {
    idempotencyEngine.rejectLock(key, 500, { error: err.message }, err.message);
    throw err;
  }
}

export interface FinancialMutationOptions<TPayload> {
  actionName: string;
  extractKey?: (payload: TPayload) => string;
  extractEntityType?: (payload: TPayload) => string;
  extractEntityId?: (payload: TPayload) => string;
  actor?: { id: string; name: string; role: string };
  onReplayDetected?: (record: IdempotencyRecord) => void;
}

/**
 * Higher-Order Function Middleware that wraps financial mutation functions (handleCreateInvoice, handlePostJournalEntry, etc.).
 * Intercepts requests:
 * 1. Checks if the idempotency key was already resolved. If so, returns the cached response,
 *    preventing duplicate ledger entries, double-posting, or side-effect re-execution.
 * 2. Rejects concurrent in-flight executions with the same key.
 * 3. On successful execution, caches the result in the Idempotency Engine and records audit entries.
 */
export function withFinancialIdempotency<TPayload, TResult>(
  mutationHandler: (payload: TPayload, context: { idempotencyKey: string; isReplay: boolean }) => Promise<TResult>,
  options: FinancialMutationOptions<TPayload>
) {
  return async (
    payload: TPayload,
    explicitKey?: string
  ): Promise<{ data: TResult; isReplay: boolean; idempotencyKey: string }> => {
    // 1. Determine unique idempotency key
    const key =
      explicitKey ||
      (options.extractKey ? options.extractKey(payload) : null) ||
      idempotencyEngine.generateKey(`idemp-${options.actionName.toLowerCase()}`);

    const actorId = options.actor?.id || 'usr-operator';
    const actorName = options.actor?.name || 'Financial Mutation Operator';

    // 2. Acquire lock / Check Cache
    const lock = idempotencyEngine.acquireLock(
      key,
      `/api/financial/${options.actionName.toLowerCase()}`,
      'POST',
      payload,
      actorId,
      actorName
    );

    // 3. Cache Hit (Replay prevention)
    if (lock.status === 'CACHED' && lock.record) {
      if (options.onReplayDetected) {
        options.onReplayDetected(lock.record);
      }
      return {
        data: lock.record.responseBody as TResult,
        isReplay: true,
        idempotencyKey: key,
      };
    }

    // 4. In-Flight Race Condition or Payload Mismatch
    if (lock.status === 'CONFLICT' || lock.status === 'IN_FLIGHT') {
      throw new Error(
        lock.error?.messageEn ||
          `Concurrent mutation ${options.actionName} with key ${key} is already in progress.`
      );
    }

    // 5. Fresh Execution
    const startTime = Date.now();
    try {
      const result = await mutationHandler(payload, { idempotencyKey: key, isReplay: false });
      const durationMs = Date.now() - startTime;

      const entityType = options.extractEntityType ? options.extractEntityType(payload) : undefined;
      const entityId = options.extractEntityId ? options.extractEntityId(payload) : undefined;

      idempotencyEngine.resolveLock(
        key,
        200,
        result,
        { 'Content-Type': 'application/json' },
        {
          entityType,
          entityId,
          executionDurationMs: durationMs,
          sideEffects: [`Executed ${options.actionName} safely via Idempotency Middleware`],
        }
      );

      return {
        data: result,
        isReplay: false,
        idempotencyKey: key,
      };
    } catch (err: any) {
      idempotencyEngine.rejectLock(key, 500, { error: err.message }, err.message);
      throw err;
    }
  };
}

