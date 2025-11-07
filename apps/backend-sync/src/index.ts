import {syncDatabase, SyncDataBaseOptionDockerPush} from "./SyncDatabaseSchema";


async function main() {
  // start sync-database schema service
  console.log("Starting Backend-Sync Service...");

  console.log("Syncing database schema with Docker Push option...");
  await syncDatabase(SyncDataBaseOptionDockerPush);
}

// Starte den Service
main();
