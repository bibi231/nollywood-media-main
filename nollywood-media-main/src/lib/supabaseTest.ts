/**
 * NaijaMation API Connection Test
 * Tests connectivity to Neon database via our API layer
 */

export async function testSupabaseConnection() {
  const results: Record<string, any> = {};
  const apiBase = import.meta.env.VITE_API_BASE || '';

  // Test 1: API reachability
  try {
    const response = await fetch(`${apiBase}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer test`,
      }
    });
    results.apiReachable = response.ok || response.status === 200;
    results.apiStatus = response.status;
  } catch (err: any) {
    results.apiReachable = false;
    results.apiError = err.message;
  }

  // Test 2: Database connectivity (via query endpoint)
  try {
    const response = await fetch(`${apiBase}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'films',
        operation: 'select',
        columns: '*',
        limit: 1,
      }),
    });
    const data = await response.json();
    results.databaseConnected = response.ok;
    results.filmsCount = data.data?.length ?? 0;
  } catch (err: any) {
    results.databaseConnected = false;
    results.databaseError = err.message;
  }

  // Test 3: Auth token check
  const token = localStorage.getItem('naijamation_token');
  results.hasStoredToken = !!token;

  console.log('🔍 NaijaMation API Test Results:', results);
  return results;
}
