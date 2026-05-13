import { Model, DataTypes } from 'sequelize';

class Chat extends Model {
  static initModel(sequelize) {
    return Chat.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        userAId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        userBId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        lastMessage: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Chat',
        tableName: 'chats',
        indexes: [
          {
            fields: ['user_a_id', 'user_b_id'],
          },
        ],
      }
    );
  }
}

export default Chat;
