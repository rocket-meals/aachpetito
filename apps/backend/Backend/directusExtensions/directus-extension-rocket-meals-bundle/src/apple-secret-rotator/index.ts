import {defineHook} from '@directus/extensions-sdk';
import {
  AppleClientSecretConfig,
  decodeAppleClientSecret, decodeAppleClientSecretExpiry,
  generateAppleClientSecret,
  MAX_TOKEN_LIFETIME_SECONDS
} from './apple/generateAppleClientSecret';
import {ActionInitFilterEventHelper} from '../helpers/ActionInitFilterEventHelper';
import {CronHelper} from "../helpers/CronHelper";
import fs from "fs";

const refreshIfExpiringWithinDays = 7; // Refresh if expiring within 7 days
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * refreshIfExpiringWithinDays;

const HOOK_NAME = 'apple-secret-rotator';

function buildConfigFromEnv(): AppleClientSecretConfig | null {
  const teamId = process.env.AUTH_APPLE_HOOK_APPLE_TEAM_ID;
  const clientId = process.env.AUTH_APPLE_CLIENT_ID;
  const keyId = process.env.AUTH_APPLE_HOOK_APPLE_KEY_ID;
  const privateKeyEscaped = process.env.AUTH_APPLE_HOOK_APPLE_PRIVATE_KEY;
  const hostEnvFilePath = process.env.HOST_ENV_FILE_PATH;

  const missing = [
    !clientId && 'AUTH_APPLE_CLIENT_ID',
    !teamId && 'AUTH_APPLE_HOOK_APPLE_TEAM_ID',
    !keyId && 'AUTH_APPLE_HOOK_APPLE_KEY_ID',
    !privateKeyEscaped && 'AUTH_APPLE_HOOK_APPLE_PRIVATE_KEY',
    !hostEnvFilePath && 'HOST_ENV_FILE_PATH',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    console.warn('['+HOOK_NAME+'] Missing environment variables:', missing.join(', '));
    return null;
  }

  const privateKeyRaw = privateKeyEscaped || '';
  const privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n');

  return {
    teamId: teamId!,
    clientId: clientId!,
    keyId: keyId!,
    privateKey: privateKeyPem!,
    lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS,
  };
}

function setEnvValue(key: string, value: string) {
  let configPath = process.env.HOST_ENV_FILE_PATH as string;
  console.log("["+HOOK_NAME+"] Writing new value to " + configPath);
  console.log("Setting " + key + " to " + value.substring(0, 10) + "....");

  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS = fs.readFileSync(configPath, "utf8").split('\n'); //or use os.EOL
  console.log("["+HOOK_NAME+"] Read " + ENV_VARS.length + " lines from " + configPath);

  // find the env we want based on the key
  // @ts-ignore
  const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
    return line.match(new RegExp(key));
  }));

  // replace the key/value with the new value
  ENV_VARS.splice(target, 1, `${key}=${value}`);

  // write everything back to the file system
  fs.writeFileSync(configPath, ENV_VARS.join('\n'));

  console.log("["+HOOK_NAME+"] Updated " + key + " in " + configPath);
}

async function refreshSecret(config: AppleClientSecretConfig) {
  try {
    const result = generateAppleClientSecret(config);
    console.log('['+HOOK_NAME+'] Generated new Apple client secret. Expires at', new Date(result.expiresAt * 1000).toISOString());
    // Store the new token
    await setEnvValue('AUTH_APPLE_CLIENT_SECRET', result.token);
    // Restart the server/container

    //needed to refresh environment variables. server will respawn by pm2
    setTimeout(() => {
      console.log('['+HOOK_NAME+'] Exiting process to apply new Apple client secret...');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('['+HOOK_NAME+'] Failed to generate Apple client secret:', error);
  }
}

export default defineHook(async ({ init, schedule }) => {
  const config = buildConfigFromEnv();
  if (!config) {
    console.warn('['+HOOK_NAME+'] Hook disabled due to missing configuration.');
    return;
  }

  const checkForRefresh = async (reason: string) => {
    console.log(`[${HOOK_NAME}] Running Apple client secret refresh check (${reason})...`);
    try {

      const now = Math.floor(Date.now() / 1000);

      const appleClientSecret = process.env.AUTH_APPLE_CLIENT_SECRET;

      if (appleClientSecret) {
        const expiresAt = decodeAppleClientSecretExpiry(appleClientSecret);
        console.log('['+HOOK_NAME+'] Decoded Apple client secret expiration raw value:', expiresAt);
        if (expiresAt) {
          const secondsRemaining = expiresAt - now;
          let isNearingExpiry = secondsRemaining < REFRESH_THRESHOLD_SECONDS;
          console.log('['+HOOK_NAME+'] Apple client secret expires at', new Date(expiresAt * 1000).toISOString());
          if (isNearingExpiry) {
            console.log('['+HOOK_NAME+'] Apple client secret is nearing expiration. Triggering refresh.');
            await refreshSecret(config);
            return;
          } else {
            console.log('['+HOOK_NAME+'] Apple client secret is valid. No refresh needed.');
            return;
          }
        } else {
          console.log('['+HOOK_NAME+'] Apple client secret found, but expiration could not be determined. Triggering refresh.');
          await refreshSecret(config);
          return;
        }
      } else {
        console.log('['+HOOK_NAME+'] No Apple client secret found. Generating a new one.');
        await refreshSecret(config);
        return;
      }
      return;
    } catch (error) {
      console.error(`[${HOOK_NAME}] Failed to refresh Apple client secret during ${reason}:`, error);
    }
  };

  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    await checkForRefresh('startup');
  });

  // Run once per day at 03:00 server time.
  schedule(CronHelper.getCronString(CronHelper.EVERY_DAY_AT_3AM), async () => {
    await checkForRefresh('check apple token refresh');
  });
});
