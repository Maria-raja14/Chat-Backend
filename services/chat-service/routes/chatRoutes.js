import express from 'express';
import { getMyChats, createChat, getChatMessages } from '../controllers/chatController.js';
import { createChatRules, chatIdParamRules } from '../validators/chatValidator.js';
import { validateRequest } from '../validators/requestValidator.js';

const router = express.Router();

router.get('/', getMyChats);
router.post('/', createChatRules, validateRequest, createChat);
router.get('/:chatId/messages', chatIdParamRules, validateRequest, getChatMessages);

export default router;
