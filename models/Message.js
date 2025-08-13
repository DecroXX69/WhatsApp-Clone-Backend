const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  wa_id: {
    type: String,
    required: true,
  },
  message_id: {
    type: String,
    required: true,
    unique: true
  },
  meta_msg_id: String,
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  text: {
    body: String
  },
  image: {
    caption: String,
    mime_type: String,
    sha256: String,
    id: String
  },
  document: {
    caption: String,
    filename: String,
    mime_type: String,
    sha256: String,
    id: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed', 'received'], // ← Added 'received'
    default: 'sent'
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'document', 'audio'],
    default: 'text'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
