/**
 * PHASE 1 — SYSTEM BREAK & FORENSIC AUDIT
 * Comprehensive security and stress testing script for NaijaMation
 * 
 * Tests: Auth tampering, SQL injection, XSS, BOLA, input validation,
 *        upload abuse, rate limiting, race conditions
 */

import jwt from 'jsonwebtoken';

const BASE = 'https://naijamation.vercel.app';

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════
const results: { test: string; status: 'PASS' | 'FAIL' | 'VULN'; detail: string; severity: string }[] = [];

function log(test: string, status: 'PASS' | 'FAIL' | 'VULN', detail: string, severity: string = 'INFO') {
    results.push({ test, status, detail, severity });
    const icon = status === 'VULN' ? '🔴' : status === 'FAIL' ? '🟡' : '✅';
    console.log(`${icon} [${severity}] ${test}: ${detail}`);
}

async function safeFetch(url: string, opts: RequestInit = {}): Promise<{ status: number; body: any }> {
    try {
        const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(10000) });
        let body: any;
        try { body = await res.json(); } catch { body = await res.text().catch(() => ''); }
        return { status: res.status, body };
    } catch (e: any) {
        return { status: 0, body: e.message };
    }
}

function queryPayload(table: string, operation: string, data?: any, filters?: any[]) {
    return JSON.stringify({ table, operation, data, filters });
}

// ═══════════════════════════════════════════════════════
// TEST 1: AUTH TOKEN TAMPERING
// ═══════════════════════════════════════════════════════
async function testAuthTampering() {
    console.log('\n═══ TEST 1: AUTH TOKEN TAMPERING ═══');

    // 1a: Forged JWT with wrong secret
    const forgedToken = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000000', email: 'hacker@evil.com', role: 'admin' },
        'totally-wrong-secret',
        { expiresIn: '1h' }
    );
    const r1 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${forgedToken}` },
        body: queryPayload('users', 'select')
    });
    // The fallback jwt.decode() will accept this WITHOUT verifying signature
    if (r1.status === 200 && r1.body?.data) {
        log('Auth: Forged JWT accepted', 'VULN', `Status ${r1.status} — unsigned JWT decoded and trusted`, 'CRITICAL');
    } else if (r1.status === 403) {
        log('Auth: Forged JWT rejected (403)', 'PASS', 'Admin table blocked', 'HIGH');
    } else {
        log('Auth: Forged JWT', 'PASS', `Status ${r1.status}`, 'HIGH');
    }

    // 1b: Expired token replay
    const expiredToken = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000000', email: 'old@user.com', role: 'user' },
        'naijamation-dev-secret-change-in-production',  // The hardcoded fallback!
        { expiresIn: '-1h' }
    );
    const r2 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${expiredToken}` },
        body: queryPayload('user_profiles', 'select')
    });
    if (r2.status === 200) {
        log('Auth: Expired token accepted', 'VULN', 'Expired JWT still grants access via decode fallback', 'CRITICAL');
    } else {
        log('Auth: Expired token rejected', 'PASS', `Status ${r2.status}`, 'HIGH');
    }

    // 1c: Role escalation — user claiming admin
    const escalatedToken = jwt.sign(
        { sub: '00000000-0000-0000-0000-000000000001', role: 'admin', email: 'escalated@test.com' },
        'any-secret-doesnt-matter'  // Will be decoded without verification
    );
    const r3 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${escalatedToken}` },
        body: queryPayload('users', 'select')
    });
    if (r3.status === 200 && r3.body?.data?.length > 0) {
        log('Auth: Role escalation to admin', 'VULN', 'Forged admin token accessed users table', 'CRITICAL');
    } else {
        log('Auth: Role escalation blocked', 'PASS', `Status ${r3.status}`, 'HIGH');
    }

    // 1d: No token at all on protected write
    const r4 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload('film_comments', 'insert', { film_id: 'fake', user_id: 'fake', content: 'No auth test' })
    });
    if (r4.status === 401) {
        log('Auth: Unauthenticated write blocked', 'PASS', 'Correctly requires auth for inserts', 'MEDIUM');
    } else {
        log('Auth: Unauthenticated write allowed', 'VULN', `Status ${r4.status}`, 'HIGH');
    }
}

// ═══════════════════════════════════════════════════════
// TEST 2: SQL INJECTION
// ═══════════════════════════════════════════════════════
async function testSQLInjection() {
    console.log('\n═══ TEST 2: SQL INJECTION ═══');

    // 2a: Table name injection
    const r1 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload("films; DROP TABLE users; --", 'select')
    });
    if (r1.status === 400) {
        log('SQLi: Table name injection blocked', 'PASS', 'Table not in allowlist', 'HIGH');
    } else {
        log('SQLi: Table name injection', 'VULN', `Status ${r1.status}: ${JSON.stringify(r1.body)}`, 'CRITICAL');
    }

    // 2b: Filter value injection
    const r2 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: 'films',
            operation: 'select',
            filters: [{ column: "id' OR '1'='1", op: 'eq', value: 'anything' }]
        })
    });
    if (r2.body?.error) {
        log('SQLi: Filter column injection blocked', 'PASS', `Error: ${r2.body.error?.message?.substring(0, 80)}`, 'HIGH');
    } else {
        log('SQLi: Filter column injection', 'VULN', `Status ${r2.status}, returned data`, 'CRITICAL');
    }

    // 2c: Column name injection in select
    const r3 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: 'films',
            operation: 'select',
            columns: "*, (SELECT encrypted_password FROM users LIMIT 1) as pw"
        })
    });
    if (r3.body?.data?.[0]?.pw) {
        log('SQLi: Column subquery injection', 'VULN', 'Extracted password hash via column injection', 'CRITICAL');
    } else {
        log('SQLi: Column subquery injection blocked', 'PASS', `Status ${r3.status}`, 'HIGH');
    }

    // 2d: OR-based filter bypass
    const r4 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: 'films',
            operation: 'select',
            filters: [{ column: 'id', op: 'eq', value: "' OR 1=1 --" }]
        })
    });
    // Parameterized queries should make this safe
    log('SQLi: OR bypass in filter value', r4.body?.data?.length > 1 ? 'VULN' : 'PASS',
        `Returned ${r4.body?.data?.length || 0} rows`, 'HIGH');

    // 2e: Operation injection
    const r5 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'films', operation: 'select; DROP TABLE films; --' })
    });
    log('SQLi: Operation injection', r5.status === 400 ? 'PASS' : 'VULN',
        `Status ${r5.status}`, 'HIGH');
}

// ═══════════════════════════════════════════════════════
// TEST 3: XSS & COMMENT INJECTION
// ═══════════════════════════════════════════════════════
async function testXSSInjection() {
    console.log('\n═══ TEST 3: XSS & COMMENTS INJECTION ═══');

    // These test if the API stores XSS payloads (persistence)
    // The frontend must also escape on render, but backend should sanitize

    const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '"><svg onload=alert(1)>',
        "'; DROP TABLE film_comments; --",
    ];

    for (const payload of xssPayloads) {
        // We can't actually insert without auth, but we can test what the API does
        const r = await safeFetch(`${BASE}/api/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table: 'film_comments',
                operation: 'insert',
                data: { film_id: '00000000-0000-0000-0000-000000000000', content: payload }
            })
        });
        // Should get 401 (no auth) — if it gets 200, that means no sanitization AND no auth
        if (r.status === 200) {
            log(`XSS: Payload stored without auth`, 'VULN', `"${payload.substring(0, 30)}..." accepted`, 'CRITICAL');
        } else if (r.status === 401) {
            log(`XSS: Auth blocked unauthenticated insert`, 'PASS', 'Cannot test storage without auth', 'MEDIUM');
            break; // All will fail the same way
        }
    }
}

// ═══════════════════════════════════════════════════════
// TEST 4: BOLA (Broken Object Level Authorization)
// ═══════════════════════════════════════════════════════
async function testBOLA() {
    console.log('\n═══ TEST 4: BOLA TESTING ═══');

    // 4a: Can unauthenticated user read all user_profiles?
    const r1 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload('user_profiles', 'select')
    });
    if (r1.status === 200 && r1.body?.data?.length > 0) {
        log('BOLA: All user_profiles readable without auth', 'VULN',
            `${r1.body.data.length} profiles exposed including emails`, 'HIGH');
    } else {
        log('BOLA: user_profiles access', 'PASS', `Status ${r1.status}`, 'MEDIUM');
    }

    // 4b: Can unauthenticated user read users table?
    const r2 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload('users', 'select')
    });
    if (r2.status === 200 && r2.body?.data?.length > 0) {
        log('BOLA: users table readable', 'VULN', `${r2.body.data.length} users with password hashes exposed`, 'CRITICAL');
    } else {
        log('BOLA: users table blocked', 'PASS', `Status ${r2.status}`, 'HIGH');
    }

    // 4c: Can we read user_roles?
    const r3 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload('user_roles', 'select')
    });
    if (r3.status === 200 && r3.body?.data?.length > 0) {
        log('BOLA: user_roles exposed without auth', 'VULN', `Admin roles visible`, 'HIGH');
    } else {
        log('BOLA: user_roles blocked', 'PASS', `Status ${r3.status}`, 'MEDIUM');
    }

    // 4d: Attempt DELETE on films without auth
    const r4 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: 'films',
            operation: 'delete',
            filters: [{ column: 'id', op: 'eq', value: '00000000-0000-0000-0000-000000000000' }]
        })
    });
    if (r4.status === 401) {
        log('BOLA: Unauthenticated DELETE blocked', 'PASS', 'Auth required for deletes', 'HIGH');
    } else {
        log('BOLA: Unauthenticated DELETE', 'VULN', `Status ${r4.status}`, 'CRITICAL');
    }
}

// ═══════════════════════════════════════════════════════
// TEST 5: INPUT VALIDATION & EDGE CASES
// ═══════════════════════════════════════════════════════
async function testInputValidation() {
    console.log('\n═══ TEST 5: INPUT VALIDATION ═══');

    // 5a: Empty body
    const r1 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    log('Input: Empty body', r1.status >= 400 ? 'PASS' : 'VULN',
        `Status ${r1.status}: ${r1.body?.error?.message?.substring(0, 60) || ''}`, 'MEDIUM');

    // 5b: Non-existent table
    const r2 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload('nonexistent_table', 'select')
    });
    log('Input: Non-existent table', r2.status === 400 ? 'PASS' : 'VULN',
        `Status ${r2.status}`, 'MEDIUM');

    // 5c: Invalid operation
    const r3 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryPayload('films', 'TRUNCATE')
    });
    log('Input: TRUNCATE operation', r3.status === 400 ? 'PASS' : 'VULN',
        `Status ${r3.status}`, 'HIGH');

    // 5d: Massive payload (1MB+ string)
    const bigString = 'A'.repeat(1_000_000);
    const r4 = await safeFetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'films', operation: 'select', columns: bigString })
    });
    log('Input: 1MB payload', r4.status >= 400 || r4.status === 0 ? 'PASS' : 'VULN',
        `Status ${r4.status}`, 'MEDIUM');

    // 5e: GET instead of POST
    const r5 = await safeFetch(`${BASE}/api/query`, { method: 'GET' });
    log('Input: GET method', r5.status === 405 ? 'PASS' : 'FAIL',
        `Status ${r5.status}`, 'LOW');

    // 5f: OPTIONS preflight
    const r6 = await safeFetch(`${BASE}/api/query`, { method: 'OPTIONS' });
    log('Input: OPTIONS preflight', r6.status === 200 ? 'PASS' : 'FAIL',
        `Status ${r6.status}`, 'LOW');
}

// ═══════════════════════════════════════════════════════
// TEST 6: RATE LIMITING
// ═══════════════════════════════════════════════════════
async function testRateLimiting() {
    console.log('\n═══ TEST 6: RATE LIMITING ═══');

    // Send 20 rapid requests
    const start = Date.now();
    const promises = Array.from({ length: 20 }, () =>
        safeFetch(`${BASE}/api/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: queryPayload('films', 'select')
        })
    );
    const responses = await Promise.all(promises);
    const elapsed = Date.now() - start;
    const statuses = responses.map(r => r.status);
    const has429 = statuses.includes(429);

    if (has429) {
        log('RateLimit: 20 concurrent requests', 'PASS', `Rate limited after burst (${elapsed}ms)`, 'HIGH');
    } else {
        const successCount = statuses.filter(s => s === 200).length;
        log('RateLimit: No rate limiting detected', 'VULN',
            `${successCount}/20 succeeded in ${elapsed}ms — zero throttling`, 'HIGH');
    }
}

// ═══════════════════════════════════════════════════════
// TEST 7: PRESIGN ENDPOINT ABUSE
// ═══════════════════════════════════════════════════════
async function testPresignAbuse() {
    console.log('\n═══ TEST 7: PRESIGN ENDPOINT ═══');

    // 7a: No auth
    const r1 = await safeFetch(`${BASE}/api/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'evil.exe', contentType: 'application/x-msdownload' })
    });
    if (r1.status === 401) {
        log('Presign: Unauthenticated access blocked', 'PASS', 'Auth required', 'HIGH');
    } else {
        log('Presign: Unauthenticated access', 'VULN', `Status ${r1.status}`, 'CRITICAL');
    }

    // 7b: No file type validation check (just document)
    log('Presign: File type validation', 'VULN',
        'No server-side file type or size validation in presign.ts (code audit)', 'HIGH');
}

// ═══════════════════════════════════════════════════════
// EXECUTE ALL TESTS
// ═══════════════════════════════════════════════════════
async function runAllTests() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  NAIJAMATION PHASE 1 — FORENSIC AUDIT     ║');
    console.log('║  Target: naijamation.vercel.app            ║');
    console.log('╚════════════════════════════════════════════╝');

    await testAuthTampering();
    await testSQLInjection();
    await testXSSInjection();
    await testBOLA();
    await testInputValidation();
    await testRateLimiting();
    await testPresignAbuse();

    // ═══ SUMMARY ═══
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  RESULTS SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════╝');

    const vulns = results.filter(r => r.status === 'VULN');
    const passes = results.filter(r => r.status === 'PASS');
    const fails = results.filter(r => r.status === 'FAIL');

    console.log(`\n✅ PASSED: ${passes.length}`);
    console.log(`🟡 FAILED: ${fails.length}`);
    console.log(`🔴 VULNERABLE: ${vulns.length}`);

    if (vulns.length > 0) {
        console.log('\n🔴 VULNERABILITIES FOUND:');
        const criticals = vulns.filter(v => v.severity === 'CRITICAL');
        const highs = vulns.filter(v => v.severity === 'HIGH');
        const mediums = vulns.filter(v => v.severity === 'MEDIUM');

        if (criticals.length) {
            console.log(`\n  ⛔ CRITICAL (${criticals.length}):`);
            criticals.forEach(v => console.log(`    - ${v.test}: ${v.detail}`));
        }
        if (highs.length) {
            console.log(`\n  🔶 HIGH (${highs.length}):`);
            highs.forEach(v => console.log(`    - ${v.test}: ${v.detail}`));
        }
        if (mediums.length) {
            console.log(`\n  ⚠️ MEDIUM (${mediums.length}):`);
            mediums.forEach(v => console.log(`    - ${v.test}: ${v.detail}`));
        }
    }

    // Output JSON for processing
    console.log('\n\n--- RAW JSON RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
}

runAllTests().catch(console.error);
