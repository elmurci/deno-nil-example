import { Keypair, NucTokenBuilder, Command } from 'npm:@nillion/nuc@0.1.1';
import { SecretVaultBuilderClient } from 'npm:@nillion/secretvaults@0.1.5';

async function runNillionScript() {
  console.log("🚀 Starting Nillion SDK script...");

  try {
    const NIL_BUILDER_PRIVATE_KEY = Deno.env.get("NIL_BUILDER_PRIVATE_KEY") || 
      "1ce2a82a51bfedb409cb42efff3b4b029e885ac3bdfda4dbb2e12d86c024c163";
    const NIL_BUILDER_COLLECTION_ID = Deno.env.get("NIL_BUILDER_COLLECTION_ID") || 
      "1ec4ff40-91ef-4f78-b1fa-96d619ac74a9";

    const builderKeypair = Keypair.from(NIL_BUILDER_PRIVATE_KEY);
    const builder = await SecretVaultBuilderClient.from({
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

    await builder.refreshRootToken();
    const existingProfile = await builder.readProfile();

    console.log(`📋 Profile: ${JSON.stringify(existingProfile, null, 2)}`);
    console.log("✅ Builder setup complete:", builder.did.toString());

    const token = NucTokenBuilder.extending(builder.rootToken)
      .command(new Command(['nil', 'db', 'data', 'create']))
      .audience(builder.did)
      .expiresAt(Math.floor(Date.now() / 1000) + 3600)
      .build(builderKeypair.privateKey());

    console.log("🎫 Generated Nuc Token:", token);
    console.log("✅ Script completed successfully!");
    
    return { success: true, token, did: builder.did.toString() };

  } catch (e: any) {
    console.error("\n💥 ERROR DETECTED");
    console.error("❌ Error Type:", e.name);
    console.error("💬 Error Message:", e.message);
    console.error("📚 Stack Trace:\n", e.stack);
    
    return { success: false, error: e.message };
  }
}

// For Deno Deploy, we need to handle both script execution and HTTP requests
if (import.meta.main) {
  // When run as a script
  const result = await runNillionScript();
  if (!result.success) {
    Deno.exit(1);
  }
} else {
  // When imported or run in Deno Deploy
  const result = await runNillionScript();
  
  // Export a simple HTTP handler
  export default {
    async fetch(request: Request): Promise<Response> {
      return Response.json({
        message: "Nillion script executed",
        result: result,
        timestamp: new Date().toISOString()
      });
    },
  };
}