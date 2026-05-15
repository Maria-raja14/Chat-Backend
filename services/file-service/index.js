import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import db from './models/index.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// AWS S3 Configuration
const s3Config = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'your_access_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'your_secret_key',
  },
});

// Multer S3 configuration
const upload = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: process.env.AWS_S3_BUCKET_NAME || 'your_bucket_name',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      // Organize files in a 'chat-uploads' directory within the bucket
      cb(null, `chat-uploads/${uniqueName}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
});

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save file metadata to the database
    const fileRecord = await db.File.create({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      s3Url: req.file.location,
      s3Key: req.file.key,
    });

    // Return the uploaded file URL and details
    res.status(200).json({
      message: 'File uploaded and saved to database successfully',
      fileUrl: req.file.location, // S3 Object URL
      fileRecord,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'File Service is running' });
});

const PORT = process.env.PORT || 4004;

db.sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`File Service is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
