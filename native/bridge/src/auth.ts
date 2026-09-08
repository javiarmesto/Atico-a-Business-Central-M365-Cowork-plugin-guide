import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { nativeScope, type Config } from './config.js';

export class AuthError extends Error {
  constructor(public status: number, public code: string, public claims?: string) {
    super(code);
  }
}

export function makeVerifier(config: Config, keys?: JWTVerifyGetKey) {
  const jwks = keys ?? createRemoteJWKSet(new URL(
    `https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`));
  return async (authorization?: string) => {
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!token) throw new AuthError(401, 'invalid_token');
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: config.issuer, audience: config.clientId, algorithms: ['RS256'],
        requiredClaims: ['exp', 'iat', 'oid', 'tid', 'azp', 'scp']
      });
      if (payload.ver !== '2.0' || payload.tid !== config.tenantId ||
          payload.azp !== config.callerClientId || typeof payload.oid !== 'string') {
        throw new AuthError(401, 'invalid_token');
      }
      if (typeof payload.scp !== 'string' || !payload.scp.split(' ').includes('access_as_user')) {
        throw new AuthError(403, 'insufficient_scope');
      }
      return token;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(401, 'invalid_token');
    }
  };
}

export async function exchangeToken(config: Config, assertion: string, fetcher = fetch) {
  let response: Response;
  try {
    response = await fetcher(config.tokenUrl, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId, client_secret: config.clientSecret,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        requested_token_use: 'on_behalf_of', assertion, scope: nativeScope
      })
    });
  } catch { throw new AuthError(502, 'token_exchange_unavailable'); }
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const interaction = ['interaction_required', 'invalid_grant', 'consent_required'].includes(String(result.error));
    // No provider error_description: may contain identifiers or sensitive context.
    throw new AuthError(interaction ? 401 : 502,
      interaction ? 'interaction_required' : 'token_exchange_failed',
      interaction && typeof result.claims === 'string' ? result.claims : undefined);
  }
  if (typeof result.access_token !== 'string' || !result.access_token ||
      String(result.token_type).toLowerCase() !== 'bearer') {
    throw new AuthError(502, 'invalid_token_response');
  }
  // Native Microsoft tokens are opaque to this service; never decode or persist them.
  return result.access_token;
}
