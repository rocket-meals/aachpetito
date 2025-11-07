import {
  APPLE_AUDIENCE,
  decodeAppleClientSecret,
  decodeAppleClientSecretExpiry,
} from '../apple/generateAppleClientSecret';

const TEST_TEAM_ID = 'TEAMID123';
const TEST_CLIENT_ID = 'com.example.app';
const TEST_KEY_ID = 'ABC123XYZ';

describe('generateAppleClientSecret', () => {
//describe('dev', () => {
  it('test decodeAppleClientSecret', () => {
    // Manually
    // Only the header and payload parts, signature will differ
    const testTokenToDecode = "eyJraWQiOiJBQkMxMjNYWVoiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJURUFNSUQxMjMiLCJpYXQiOjE3NjI0NzAwNTQsImV4cCI6MTc3ODAyMjA1NCwiYXVkIjoiaHR0cHM6Ly9hcHBsZWlkLmFwcGxlLmNvbSIsInN1YiI6ImNvbS5leGFtcGxlLmFwcCJ9.63lA4G3NpxaHM7QiKZPilnzTPOBQo1tYqEOiS-i6R2zrZV1vcK2anvtfoB8RKp_fTP9fPA59ovZ0NgCXDlMnxg"
    let decoded = decodeAppleClientSecret(testTokenToDecode);
    expect(decoded).not.toBeNull();
    let exp = decodeAppleClientSecretExpiry(testTokenToDecode);
    expect(decoded?.iat).toBe(1762470054);
    expect(exp).toBe(1778022054);
    expect(decoded?.iss).toBe(TEST_TEAM_ID);
    expect(decoded?.aud).toBe(APPLE_AUDIENCE);
    expect(decoded?.sub).toBe(TEST_CLIENT_ID);
  });

});
