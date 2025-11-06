import crypto from 'crypto';
import jwt from "jsonwebtoken";

export const APPLE_AUDIENCE = 'https://appleid.apple.com';
const days = 90;
export const MAX_TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * days; // 90 days

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
  const privateKeyNormalized = normalisePrivateKey(config.privateKey);

  const privateKey = privateKeyNormalized
      .replace(/ /g, "\n")
      .replace(/-----BEGIN\nPRIVATE\nKEY-----/, "-----BEGIN PRIVATE KEY-----")
      .replace(/-----END\nPRIVATE\nKEY-----/, "-----END PRIVATE KEY-----");

  const exp = Math.floor(Date.now() / 1000) + 3600 * 24 * days; // Token expiry (max 6 months, set as needed)

  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: exp,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const clientSecret = jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    keyid: keyId, // Key ID for .p8 file
  });

  return {
    token: clientSecret,
    expiresAt: exp,
  };
}
