import {syncDatabase, SyncDataBaseOptionDockerPush} from "./SyncDatabaseSchema";
import {registerCronJob, registerShutdownJobs} from "./CronHelperManager";
import {readEnvFile} from "./EnvFileFinder";

async function registerAppleClientSecretChecker(){
  console.log("registerAppleClientSecretChecker");
  // Beispiel-Registrierung: Ein Job, der alle 10 Sekunden läuft
  let envFile = await readEnvFile();
  console.log("Env file content:\n");
  console.log(envFile);

  registerCronJob({
    id: 'sync-database-every-10-seconds',
    schedule: '*/10 * * * * *', // alle 10 Sekunden
    task: async () => {

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
