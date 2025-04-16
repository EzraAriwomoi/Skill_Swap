import express from 'express';
import { sendMessage, getMessages, getChats } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, sendMessage);

router.get('/chats', protect, getChats);
router.get('/:chatId', protect, getMessages);

export default router;