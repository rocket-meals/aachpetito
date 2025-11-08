import {syncDatabase, SyncDataBaseOptionDockerPush} from "./SyncDatabaseSchema";
import {registerCronJob, registerShutdownJobs} from "./CronHelperManager";
import * as path from 'path';
import * as fs from 'fs';
import {buildConfigFromEnv, ensureAppleClientSecret} from "./apple-secret-rotator";
import {HOST_ENV_FILE_PATH} from "./apple-secret-rotator/DirectusEnvFileHelper";

async function registerAppleClientSecretChecker(){
  console.log("registerAppleClientSecretChecker");
  // Beispiel-Registrierung: Ein Job, der alle 10 Sekunden läuft
  registerCronJob({
    id: 'sync-database-every-10-seconds',
    schedule: '*/10 * * * * *', // alle 10 Sekunden
    task: async () => {
        let hostEnvFilePath = HOST_ENV_FILE_PATH;
        const config = buildConfigFromEnv(hostEnvFilePath);
        if(config){
          console.log("[AppleClientSecretChecker] Loaded config:");
          console.log(JSON.stringify(config, null, 2));
          let result = await ensureAppleClientSecret(config, hostEnvFilePath);
        } else {
            console.warn('[AppleClientSecretChecker] Rotator disabled due to missing configuration.');
        }
    }
  });
}

async function main() {
  // start sync-database schema service
  console.log("Starting Backend-Sync Service...");

  registerShutdownJobs(); // Registriere sauberes Shutdown-Verhalten

  await registerAppleClientSecretChecker();

  console.log("Syncing database schema with Docker Push option...");
  let errors = await syncDatabase(SyncDataBaseOptionDockerPush);
  if (errors) {
      console.error('❌ Fehler beim Synchronisieren des Datenbankschemas mit Docker Push Option.');
      process.exit(1);
  }


  console.log('Backend-Sync Service läuft. Cron-Jobs sind aktiv.');
  // keep process alive: never-resolving promise ist besser als while(true) für TS
  await new Promise<never>(() => {});
}

// Starte den Service
main();
