import * as crypto from 'crypto';

interface AppleJWTParams {
  teamId: string;
  clientId: string;
  keyId: string;
  keyFileContent?: string;
  keyFilePath?: string;
}

/**
 * Base64 URL encode function
 */
function base64UrlEncode(input: string | Buffer): string {
  const base64 = Buffer.from(input).toString('base64');
  return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

/**
 * Convert EC signature from ASN.1 DER format to raw format (r|s)
 */
function convertECSignature(derSignature: Buffer): Buffer {
  // Parse ASN.1 DER encoded signature
  // DER structure: SEQUENCE { r INTEGER, s INTEGER }

  let offset = 0;

  // Skip SEQUENCE tag and length
  if (derSignature[offset] !== 0x30) {
    throw new Error('Invalid DER signature format');
  }
  offset += 2; // Skip tag and length byte

  // Parse R
  if (derSignature[offset] !== 0x02) {
    throw new Error('Invalid DER signature format - R');
  }
  offset += 1;
  const rLength = derSignature[offset];
  offset += 1;

  let r = derSignature.slice(offset, offset + rLength);
  offset += rLength;

  // Parse S
  if (derSignature[offset] !== 0x02) {
    throw new Error('Invalid DER signature format - S');
  }
  offset += 1;
  const sLength = derSignature[offset];
  offset += 1;

  let s = derSignature.slice(offset, offset + sLength);

  // Remove leading zero bytes if present (added for sign bit in ASN.1)
  if (r.length === 33 && r[0] === 0x00) {
    r = r.slice(1);
  }
  if (s.length === 33 && s[0] === 0x00) {
    s = s.slice(1);
  }

  // Pad to 32 bytes if needed
  if (r.length < 32) {
    r = Buffer.concat([Buffer.alloc(32 - r.length, 0), r]);
  }
  if (s.length < 32) {
    s = Buffer.concat([Buffer.alloc(32 - s.length, 0), s]);
  }

  // Concatenate R and S
  return Buffer.concat([r, s]);
}

/**
 * Generate Apple SSO JWT token
 */
export function generateAppleJWTClaude(params: AppleJWTParams) {
  const { teamId, clientId, keyId, keyFileContent, keyFilePath } = params;

  // Validate required parameters
  const missingParams: string[] = [];

  if (!teamId) missingParams.push('teamId');
  if (!clientId) missingParams.push('clientId');
  if (!keyId) missingParams.push('keyId');
  if (!keyFileContent && !keyFilePath) {
    missingParams.push('keyFileContent or keyFilePath');
  }

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  // Read the EC key
  let ecdsaKey: string;
  if (keyFilePath) {
    const fs = require('fs');
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Key file '${keyFilePath}' not found.`);
    }
    ecdsaKey = fs.readFileSync(keyFilePath, 'utf8');
  } else {
    ecdsaKey = keyFileContent!;
  }

  // Generate timestamps
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (86400 * 180); // 180 days

  // Create JWT header
  const header = {
    kid: keyId,
    alg: 'ES256'
  };

  // Create JWT claims
  const claims = {
    iss: teamId,
    iat: currentTime,
    exp: expirationTime,
    aud: 'https://appleid.apple.com',
    sub: clientId
  };

  // Encode header and claims
  const jwtHeaderBase64 = base64UrlEncode(JSON.stringify(header));
  const jwtClaimsBase64 = base64UrlEncode(JSON.stringify(claims));

  // Create signature
  const signatureInput = `${jwtHeaderBase64}.${jwtClaimsBase64}`;

  // Sign with ES256 (ECDSA with SHA-256)
  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  sign.end();

  const derSignature = sign.sign(ecdsaKey);

  // Convert DER signature to raw format
  const rawSignature = convertECSignature(derSignature);

  // Base64 URL encode the signature
  const signatureBase64 = base64UrlEncode(rawSignature);

  // Combine all parts
  const token = `${jwtHeaderBase64}.${jwtClaimsBase64}.${signatureBase64}`;

  return {
    token: token,
    exp: expirationTime
  }
}
