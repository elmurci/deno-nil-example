// Import with explicit error handling for missing packages
let Keypair: any, NucTokenBuilder: any, Command: any, SecretVaultBuilderClient: any;

try {
  console.log("Loading Nillion SDK packages...");
  
  // Try to import packages with better error handling
  const nuc = await import('npm:@nillion/nuc@0.1.1');
  const secretvaults = await import('npm:@nillion/secretvaults@0.1.5');
  
  Keypair = nuc.Keypair;
  NucTokenBuilder = nuc.NucTokenBuilder;
  Command = nuc.Command;
  SecretVaultBuilderClient = secretvaults.SecretVaultBuilderClient;
  
  console.log("✅ All packages loaded successfully");
} catch (importError: any) {
  console.error("❌ Failed to import Nillion packages:");
  console.error("Error:", importError.message);
  console.error("This might be due to package incompatibility with Deno Deploy");
  Deno.exit(1);
}

console.log("🚀 Starting Nillion SDK initialization...");

try {
  // Use environment variables instead of hardcoded values
  const NIL_BUILDER_PRIVATE_KEY = Deno.env.get("NIL_BUILDER_PRIVATE_KEY") || 
    "1ce2a82a51bfedb409cb42efff3b4b029e885ac3bdfda4dbb2e12d86c024c163";
  const NIL_BUILDER_COLLECTION_ID = Deno.env.get("NIL_BUILDER_COLLECTION_ID") || 
    "1ec4ff40-91ef-4f78-b1fa-96d619ac74a9";

  console.log("🔑 Creating keypair...");
  const builderKeypair = Keypair.from(NIL_BUILDER_PRIVATE_KEY);
  
  console.log("🏗️ Setting up SecretVaultBuilderClient...");
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

  console.log("🔄 Refreshing root token...");
  await builder.refreshRootToken();

  console.log("👤 Reading profile...");
  const existingProfile = await builder.readProfile();
  console.log(`📋 Profile: ${JSON.stringify(existingProfile, null, 2)}`);

  console.log("✅ Builder setup complete:", builder.did.toString());

  console.log("🎫 Generating Nuc Token...");
  const token = NucTokenBuilder.extending(builder.rootToken)
    .command(new Command(['nil', 'db', 'data', 'create']))
    .audience(builder.did)
    .expiresAt(Math.floor(Date.now() / 1000) + 3600)
    .build(builderKeypair.privateKey());

  console.log("🎉 Generated Nuc Token:", token);

} catch (e: any) {
  console.error("\n💥 ERROR DETECTED");
  console.error("❌ Nillion SDK operation failed");
  console.error("🏷️ Error Type:", e.name);
  console.error("💬 Error Message:", e.message);
  
  // More detailed error information
  if (e.cause) {
    console.error("🔍 Root Cause:", e.cause);
  }
  
  if (e.stack) {
    console.error("📚 Stack Trace:\n", e.stack);
  }
  
  // Check if it's a network-related error
  if (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('ENOTFOUND')) {
    console.error("🌐 This appears to be a network connectivity issue");
    console.error("💡 Suggestion: Check if the Nillion endpoints are accessible from Deno Deploy");
  }
  
  console.error("--- END ERROR ---\n");
  Deno.exit(1);
}

console.log("\n✅ Script completed successfully!");