const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Get all chats
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ 'last_message.timestamp': -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get or create a chat
router.get('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    let chat = await Chat.findOne({ wa_id });
    
    if (!chat) {
      chat = new Chat({
        wa_id,
        name: `Contact ${wa_id}`,
        phone_number: wa_id
      });
      await chat.save();
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark chat as read
router.patch('/:wa_id/read', async (req, res) => {
  try {
    const { wa_id } = req.params;
    
    await Chat.findOneAndUpdate(
      { wa_id },
      { unread_count: 0 },
      { new: true }
    );
    
    await Message.updateMany(
      { from: wa_id, status: { $ne: 'read' } },
      { status: 'read' }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
