import { body, param } from 'express-validator';

const createChatRules = [
  body('participantId')
    .trim()
    .notEmpty()
    .withMessage('participantId is required.'),
];

const chatIdParamRules = [
  param('chatId')
    .trim()
    .notEmpty()
    .withMessage('chatId is required.'),
];

export { createChatRules, chatIdParamRules };
