import { Model, DataTypes } from 'sequelize';

class User extends Model {
  static initModel(sequelize) {
    return User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: DataTypes.STRING(32),
          allowNull: false,
          unique: true,
          validate: {
            len: [3, 32],
          },
        },
        email: {
          type: DataTypes.STRING(128),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        displayName: {
          type: DataTypes.STRING(64),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        defaultScope: {
          attributes: { exclude: ['password'] },
        },
        scopes: {
          withPassword: {
            attributes: { },
          },
        },
      }
    );
  }
}

export default User;
