import { Model, DataTypes } from 'sequelize';

class Message extends Model {
  static initModel(sequelize) {
    return Message.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        chatId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        senderId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
      },
      {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
      }
    );
  }
}

export default Message;
