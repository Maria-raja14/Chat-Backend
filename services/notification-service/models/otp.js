import { Model, DataTypes } from 'sequelize';

class Otp extends Model {
  static initModel(sequelize) {
    Otp.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        otpCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'Otp',
        tableName: 'otps',
        timestamps: true,
      }
    );
    return Otp;
  }
}

export default Otp;
