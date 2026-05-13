import { Op } from 'sequelize';
import models from '../models/index.js';
import { encryptId } from '../utils/secureId.js';
import { sendSuccess, RESPONSE_CODES } from '../utils/response.js';

const { User } = models;

async function getUsers(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: currentUserId },
      },
      attributes: ['id', 'username', 'displayName'],
      order: [['username', 'ASC']],
    });

    const payload = users.map((user) => ({
      id: encryptId(user.id),
      username: user.username,
      displayName: user.displayName,
    }));

    return sendSuccess(res, { users: payload }, 'Users retrieved successfully.', RESPONSE_CODES.OK);
  } catch (error) {
    next(error);
  }
}

export {
  getUsers,
};
