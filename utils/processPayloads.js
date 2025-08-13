const fs = require("fs");
const path = require("path");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

/**
 * Reads all JSON payloads from a directory and processes them
 */
async function processWebhookPayloads(payloadDir) {
  const files = fs.readdirSync(payloadDir);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(payloadDir, file);
    const rawData = fs.readFileSync(fullPath, "utf8");

    try {
      const payload = JSON.parse(rawData);
      await handlePayload(payload.metaData);
      console.log(`✅ Processed file: ${file}`);
    } catch (err) {
      console.error(`❌ Error processing file ${file}:`, err.message);
    }
  }
}

/**
 * Processes incoming WhatsApp Webhook payload
 */
async function handlePayload(data) {
  if (!data || !data.entry) return;

  for (const entry of data.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      
      // Handle incoming messages
      if (value.messages) {
        for (const m of value.messages) {
          await insertMessage(m, value);
        }
      }

      // Handle status updates
      if (value.statuses) {
        for (const s of value.statuses) {
          await updateMessageStatus(s);
        }
      }
    }
  }
}

/**
 * Insert a new message into MongoDB
 */
async function insertMessage(msg, value) {
  const wa_id = msg.from;
  const type = msg.type;
  const messageData = {
    wa_id,
    message_id: msg.id,
    from: wa_id,
    to: value.metadata?.phone_number_id ?? "UNKNOWN",
    timestamp: new Date(parseInt(msg.timestamp) * 1000),
    status: "received",
    message_type: type
  };

  if (type === "text") {
    messageData.text = { body: msg.text.body };
  }

  // Avoid duplicates
  const exists = await Message.findOne({ message_id: msg.id });
  if (!exists) {
    await Message.create(messageData);
  }

  // Maintain chat record
  await Chat.findOneAndUpdate(
    { wa_id },
    {
      wa_id,
      name: value.contacts?.[0]?.profile?.name || `Contact ${wa_id}`,
      phone_number: wa_id,
      last_message: {
        text: msg.text?.body || "",
        timestamp: new Date(parseInt(msg.timestamp) * 1000),
        status: "received"
      },
      $inc: { unread_count: 1 }
    },
    { upsert: true, new: true }
  );
}

/**
 * Update status of existing message
 */
async function updateMessageStatus(statusObj) {
  await Message.findOneAndUpdate(
    { $or: [{ message_id: statusObj.id }, { meta_msg_id: statusObj.meta_msg_id }] },
    { status: statusObj.status },
    { new: true }
  );
}

module.exports = { processWebhookPayloads };
