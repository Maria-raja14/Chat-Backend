import models from '../models/index.js';
import { decryptId, encryptId } from '../utils/secureId.js';
import { sendSuccess, sendError, RESPONSE_CODES } from '../utils/response.js';

const { Chat, Message, User, Op } = models;

async function getMyChats(req, res, next) {
  try {
    const userId = req.user.id;

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
      include: [
        { model: User, as: 'userA', attributes: ['id', 'username', 'displayName'] },
        { model: User, as: 'userB', attributes: ['id', 'username', 'displayName'] },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const payload = chats.map((chat) => ({
      id: encryptId(chat.id),
      userA: {
        id: encryptId(chat.userA.id),
        username: chat.userA.username,
        displayName: chat.userA.displayName,
      },
      userB: {
        id: encryptId(chat.userB.id),
        username: chat.userB.username,
        displayName: chat.userB.displayName,
      },
      lastMessage: chat.lastMessage,
      updatedAt: chat.updatedAt,
    }));

    return sendSuccess(res, { chats: payload }, 'Chats retrieved successfully.', RESPONSE_CODES.OK);
  } catch (error) {
    next(error);
  }
}

async function getChatMessages(req, res, next) {
  try {
    const userId = req.user.id;
    const chatId = decryptId(req.params.chatId);

    const chat = await Chat.findByPk(chatId);
    if (!chat || ![chat.userAId, chat.userBId].includes(userId)) {
      return sendError(res, RESPONSE_CODES.NOT_FOUND, 'Chat not found or access denied.', {});
    }

    const messages = await Message.findAll({
      where: { chatId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'displayName'] }],
      order: [['createdAt', 'ASC']],
    });

    const payload = messages.map((message) => ({
      id: encryptId(message.id),
      chatId: encryptId(message.chatId),
      sender: {
        id: encryptId(message.sender.id),
        username: message.sender.username,
        displayName: message.sender.displayName,
      },
      content: message.content,
      createdAt: message.createdAt,
    }));

    return sendSuccess(res, { messages: payload }, 'Messages retrieved successfully.', RESPONSE_CODES.OK);
  } catch (error) {
    next(error);
  }
}

async function createChat(req, res, next) {
  try {
    const userId = req.user.id;
    const participantId = decryptId(req.body.participantId);

    if (participantId === userId) {
      return sendError(res, RESPONSE_CODES.BAD_REQUEST, 'Cannot create a chat with yourself.', {});
    }

    const participant = await User.findByPk(participantId);
    if (!participant) {
      return sendError(res, RESPONSE_CODES.NOT_FOUND, 'Participant not found.', {});
    }

    const includeUsers = [
      { model: User, as: 'userA', attributes: ['id', 'username', 'displayName'] },
      { model: User, as: 'userB', attributes: ['id', 'username', 'displayName'] },
    ];

    let chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { userAId: userId, userBId: participantId },
          { userAId: participantId, userBId: userId },
        ],
      },
      include: includeUsers,
    });

    const isExistingChat = Boolean(chat);

    if (!chat) {
      chat = await Chat.create({
        userAId: userId,
        userBId: participantId,
      });
      await chat.reload({ include: includeUsers });
    }

    return sendSuccess(res, {
      chat: {
        id: encryptId(chat.id),
        userA: {
          id: encryptId(chat.userA.id),
          username: chat.userA.username,
          displayName: chat.userA.displayName,
        },
        userB: {
          id: encryptId(chat.userB.id),
          username: chat.userB.username,
          displayName: chat.userB.displayName,
        },
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
      },
    }, isExistingChat ? 'Chat retrieved successfully.' : 'Chat created successfully.', isExistingChat ? RESPONSE_CODES.OK : RESPONSE_CODES.CREATED);
  } catch (error) {
    next(error);
  }
}

export {
  getMyChats,
  getChatMessages,
  createChat,
};
