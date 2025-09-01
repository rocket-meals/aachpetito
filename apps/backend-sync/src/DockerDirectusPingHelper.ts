export class DockerDirectusPingHelper {

  static DIRECTUS_CONTAINER_NAME = 'rocket-meals-directus';

  // Health-Check-Funktion für Directus
  public static async waitForDirectusHealthy(maxRetries: number = -1, retryIntervalSeconds: number = 5): Promise<boolean> {
    const directusUrl = `http://${DockerDirectusPingHelper.DIRECTUS_CONTAINER_NAME}:${process.env.DIRECTUS_PORT || '8055'}`;
    //const healthCheckUrl = `${directusUrl}/server/health`; // Health prüft auch email connection, welche wenn nicht konfiguriert fehlschlägt
    const pingCheckUrl = `${directusUrl}/server/ping`; // daher als fallback

    console.log(`🔍 Warte auf Directus Ping-Check auf: ${pingCheckUrl}`);

    let attempt = 0;
    while (maxRetries === -1 || attempt < maxRetries) {
      attempt++;
      try {
        console.log(`⏳ Prüfe Directus Health Status...`);

        // Versuche zuerst den standard Ping endpoint
        let response = await fetch(pingCheckUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          // Timeout nach 5 Sekunden
          signal: AbortSignal.timeout(retryIntervalSeconds*1000)
        });

        if (response.ok) {
          console.log(`✅ Directus ist reachable!`);
          console.log(`🚀 Directus Ping-Check erfolgreich, fortfahren...`);
          return true;
        } {
          console.log(`❌ Directus Ping-Check fehlgeschlagen - Status: ${response.status}`);
        }
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          console.log(`⏱️ Ping-Check Timeout - Directus antwortet nicht schnell genug`);
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.log(`🔌 Verbindungsfehler - Directus ist noch nicht erreichbar`);
        } else {
          console.log(`❌ Fehler beim Ping-Check:`, error.message);
        }
      }

      console.log(`⏸️  Warte ${retryIntervalSeconds} Sekunden vor dem nächsten Ping-Check...`);
      await new Promise(resolve => setTimeout(resolve, retryIntervalSeconds*1000));
    }
    return false;
  }

}