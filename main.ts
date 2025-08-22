import { Keypair } from 'npm:@nillion/nuc@0.1.1';
import { SecretVaultBuilderClient } from 'npm:@nillion/secretvaults@0.1.5';

let builderInstance: any = null;
let initializationPromise: Promise<void> | null = null;

function initializeNillion() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log("🚀 Initializing Nillion SDK...");
      
      const NIL_BUILDER_PRIVATE_KEY = Deno.env.get("NIL_BUILDER_PRIVATE_KEY") || 
        "1ce2a82a51bfedb409cb42efff3b4b029e885ac3bdfda4dbb2e12d86c024c163";

      const builderKeypair = Keypair.from(NIL_BUILDER_PRIVATE_KEY!);
      
      builderInstance = await SecretVaultBuilderClient.from({
        keypair: builderKeypair,
        urls: {
          chain: "http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz",
          auth: "https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz",
          dbs: [
            "https://nildb-stg-n1.nillion.network",
            "https://nildb-stg-n2.nillion.network",
            "https://nildb-stg-n3.nillion.network",
          ],
        },
        blindfold: {
          operation: "store",
          useClusterKey: true
        }
      });

      await builderInstance.refreshRootToken();

      const profile = await builderInstance.readProfile();
      
      console.log("✅ Nillion SDK initialized successfully");

      console.log("Builder profile", profile);
      
    } catch (error) {
      console.error("❌ Failed to initialize Nillion SDK:", error);
      throw error;
    }
  })();

  return initializationPromise;
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  try {
    switch (url.pathname) {
      case "/":
        return new Response(`
          <html>
            <body>
              <h1>🎯 Nillion SDK Test</h1>
              <p>Builder: ${builderInstance.rootTooken}</p>
            </body>
          </html>
        `, {
          headers: { "content-type": "text/html" }
        });

      default:
        return new Response("Not Found", { status: 404 });
    }

  } catch (error: any) {
    console.error("❌ Request handler error:", error);
    return Response.json({ 
      error: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}

export default {
  fetch: handleRequest,
};