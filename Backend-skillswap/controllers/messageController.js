import Message from '../models/Message.js';
import User from '../models/User.js';

// Helper function to create a chat ID from two user IDs
const createChatId = (id1, id2) => {
  return [id1, id2].sort().join('-');
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;
    
    // Create chat ID
    const chatId = createChatId(senderId, receiverId);
    
    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
    });
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;
    
    // Extract the other user's ID from the chat ID
    const userIds = chatId.split('-');
    const otherUserId = userIds[0] === userId.toString() ? userIds[1] : userIds[0];
    
    // Verify that the current user is part of this chat
    if (!userIds.includes(userId.toString())) {
      return res.status(401).json({ message: 'Not authorized to access this chat' });
    }
    
    // Get messages
    const messages = await Message.find({ chatId }).sort('createdAt');
    
    // Mark messages as read
    await Message.updateMany(
      { chatId, receiverId: userId, read: false },
      { read: true }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/messages/chats
// @access  Private
export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort('-createdAt');
    
    // Extract unique chat IDs
    const chatIds = [...new Set(messages.map(message => message.chatId))];
    
    // Get the last message for each chat
    const chats = await Promise.all(
      chatIds.map(async (chatId) => {
        const lastMessage = await Message.findOne({ chatId }).sort('-createdAt');
        
        // Get the other user's ID
        const otherUserId = lastMessage.senderId.toString() === userId.toString()
          ? lastMessage.receiverId
          : lastMessage.senderId;
        
        // Get the other user's details
        const otherUser = await User.findById(otherUserId).select('name photoUrl');
        
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          chatId,
          receiverId: userId,
          read: false,
        });
        
        return {
          id: chatId,
          user: {
            id: otherUser._id,
            name: otherUser.name,
            photoUrl: otherUser.photoUrl,
          },
          lastMessage: {
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            read: lastMessage.read,
          },
          unreadCount,
        };
      })
    );
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};