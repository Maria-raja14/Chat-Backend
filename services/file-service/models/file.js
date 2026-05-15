import { Model, DataTypes } from 'sequelize';

class File extends Model {
  static initModel(sequelize) {
    File.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        originalName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        s3Url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        s3Key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'File',
        tableName: 'files',
      }
    );
    return File;
  }
}

export default File;
