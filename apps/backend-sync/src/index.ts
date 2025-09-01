import {DockerDirectusPingHelper} from "./DockerDirectusPingHelper";
import {DockerContainerManager} from "./DockerContainerManager";

// Main function
async function main() {
    try {
        console.log("🚀 Starte Backend Sync Service...");
        //await DockerDirectusPingHelper.waitForDirectusHealthy();
        //console.log("🚀 Backend Sync Service bereit - Directus ist ready!");

        //await DockerContainerManager.restartDirectusContainers();
    } catch (error) {
        console.error("💥 Fehler im Backend Sync Service:", error);
        process.exit(1);
    }
}

// Starte den Service
main();
