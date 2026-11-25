import { describe, expect, it } from 'vitest';

describe('Supabase connection', () => {
  it('accepts the configured public key on the REST endpoint', async () => {
    const baseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    expect(baseUrl).toBeTruthy();
    expect(anonKey).toBeTruthy();
    const response = await fetch(`${baseUrl}/rest/v1/stores?select=id&limit=1`, {
      headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey!}` },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.ok).toBe(true);
  }, 15000);
});
