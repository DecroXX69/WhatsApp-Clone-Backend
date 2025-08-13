const mongoose = require("mongoose");
const path = require("path");

// Configure dotenv to look for .env file in parent directory
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { processWebhookPayloads } = require("../utils/processPayloads");

async function main() {
  try {
    // Debug: Check if MONGODB_URI is loaded
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }
    
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);  // Removed deprecated options
    console.log("✅ Connected to MongoDB");

    // Correct path: Go up from scripts/ -> backend/ -> Whatsapp Clone/ -> data/sample-payloads/
    const payloadFolder = path.join(__dirname, "../../data/sample-payloads");
    
    // Debug: Show the path being used
    console.log("📁 Looking for payloads in:", payloadFolder);
    
    await processWebhookPayloads(payloadFolder);

    console.log("🎉 All payloads processed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error processing data:", err);
    process.exit(1);
  }
}

main();
