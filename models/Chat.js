const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  wa_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: 'Unknown Contact'
  },
  phone_number: String,
  last_message: {
    text: String,
    timestamp: Date,
    status: String
  },
  unread_count: {
    type: Number,
    default: 0
  },
  profile_pic: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);
