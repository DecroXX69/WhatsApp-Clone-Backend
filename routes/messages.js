const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Get all messages for a specific chat
router.get('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const messages = await Message.find({
      $or: [{ from: wa_id }, { to: wa_id }]
    }).sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const { wa_id, text, message_type = 'text' } = req.body;
    
    const message = new Message({
      wa_id,
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: 'business_account',
      to: wa_id,
      text: { body: text },
      message_type,
      status: 'sent'
    });
    
    await message.save();
    
    await Chat.findOneAndUpdate(
      { wa_id },
      {
        wa_id,
        name: `Contact ${wa_id}`,
        phone_number: wa_id,
        last_message: {
          text,
          timestamp: message.timestamp,
          status: 'sent'
        }
      },
      { upsert: true, new: true }
    );
    
    const io = req.app.get('io');
    if (io) {
      io.to(wa_id).emit('new-message', message);
    }
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update message status
router.patch('/status/:message_id', async (req, res) => {
  try {
    const { message_id } = req.params;
    const { status } = req.body;
    
    const message = await Message.findOneAndUpdate(
      { $or: [{ message_id }, { meta_msg_id: message_id }] },
      { status },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const io = req.app.get('io');
    if (io) {
      io.to(message.wa_id).emit('status-update', { message_id, status });
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
