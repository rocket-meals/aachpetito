import crypto from 'crypto';

export const APPLE_AUDIENCE = 'https://appleid.apple.com';
const days = 180;
export const MAX_TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * days; // 180 days (align with genSSO_Apple.sh)

export type AppleClientSecretConfig = {
  teamId: string;
  clientId: string;
  keyId: string;
  privateKey: string;
  lifetimeSeconds?: number;
};

export type AppleClientSecretResult = {
  token: string;
  expiresAt: number;
};

// Minimaler Payload-Typ, wir brauchen hauptsächlich .exp
export type AppleJwtPayload = {
  iss?: string;
  sub?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  [k: string]: any;
};

function normalisePrivateKey(privateKey: string): string {
  const trimmed = privateKey.trim();
  const normalisedLineEndings = trimmed.replace(/\r\n/g, '\n');

  if (normalisedLineEndings.includes('\\n')) {
    return normalisedLineEndings.replace(/\\n/g, '\n');
  }

  return normalisedLineEndings;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToString(input: string): string {
  // Replace url-safe characters
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to make length a multiple of 4
  const pad = str.length % 4;
  if (pad === 2) str += '==';
  else if (pad === 3) str += '=';
  else if (pad === 1) str += '==='; // unlikely
  return Buffer.from(str, 'base64').toString('utf8');
}

// Decode the payload part of a JWT without verifying signature
export function decodeAppleClientSecret(token: string): AppleJwtPayload | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  const payloadPart = parts[1];
  if (!payloadPart) return null;

  try {
    const json = base64UrlDecodeToString(payloadPart);
    return JSON.parse(json) as AppleJwtPayload;
  } catch (e) {
    return null;
  }
}

export function generateAppleClientSecret(config: AppleClientSecretConfig): AppleClientSecretResult {
  const { teamId, clientId, keyId } = config;
  if (!teamId || !clientId || !keyId || !config.privateKey) {
    throw new Error('Missing configuration for Apple client secret generation.');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const requestedLifetime = config.lifetimeSeconds ?? MAX_TOKEN_LIFETIME_SECONDS;
  const lifetimeSeconds = Math.min(requestedLifetime, MAX_TOKEN_LIFETIME_SECONDS);
  const privateKey = normalisePrivateKey(config.privateKey);

  // Header and claims
  const header = { kid: keyId, alg: 'ES256' };
  const iat = nowInSeconds;
  const exp = nowInSeconds + lifetimeSeconds;
  const claims: Record<string, any> = {
    iss: teamId,
    iat,
    exp,
    aud: APPLE_AUDIENCE,
    sub: clientId,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const claimsB64 = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerB64}.${claimsB64}`;

  // Sign with ECDSA P-256 / SHA-256
  // Use DER signature from OpenSSL/Node, then convert DER -> raw R||S bytes the same way the shell script's convert_ec does.
  const signatureDer = crypto.sign('sha256', Buffer.from(signingInput, 'utf8'), {
    key: privateKey,
    // Do NOT request ieee-p1363 here; we need the DER to mimic openssl asn1parse conversion
  }) as Buffer;

  // Parse DER-encoded ECDSA signature and extract R and S (ASN.1 INTEGERs)
  function derToRawRS(der: Buffer): Buffer {
    let pos = 0;
    if (der[pos++] !== 0x30) throw new Error('Invalid DER signature (expected sequence)');

    // read length
    let len = der[pos++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let i = 0; i < n; i++) {
        len = (len << 8) + der[pos++];
      }
    }

    if (der[pos++] !== 0x02) throw new Error('Invalid DER signature (expected integer for r)');
    const rLen = der[pos++];
    const r = der.slice(pos, pos + rLen);
    pos += rLen;

    if (der[pos++] !== 0x02) throw new Error('Invalid DER signature (expected integer for s)');
    const sLen = der[pos++];
    const s = der.slice(pos, pos + sLen);
    // Note: do not strip or pad bytes — mimic openssl asn1parse + xxd behavior which outputs the raw hex for R and S

    return Buffer.concat([r, s]);
  }

  const rawRs = derToRawRS(signatureDer);
  const signatureB64 = base64UrlEncode(rawRs);

  const token = `${signingInput}.${signatureB64}`;

  return {
    token,
    expiresAt: exp,
  };
}
