import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import models from './models/index.js';

const { sequelize, Otp } = models;

async function ensureDatabaseExists() {
  if ((process.env.DB_DIALECT || 'mysql').toLowerCase() !== 'mysql') {
    return;
  }

  const dbName = process.env.DB_NAME || 'chat_app';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
}

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.post('/api/otp/send', async (req, res) => {
  try {
    const { phone, email } = req.body;
    
    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Phone or email is required.' });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

    const newOtp = await Otp.create({
      email,
      phone,
      otpCode,
      expiresAt,
    });

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    if (email) {
      // Send the OTP via Email
      const mailOptions = {
        from: process.env.EMAIL_USER || '"Chat App" <noreply@chatapp.com>',
        to: email,
        subject: 'Your Chat App Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Chat App OTP Verification</h2>
            <p>Your OTP for verification is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${otpCode}</h1>
            <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
          </div>
        `,
      };

      // Only attempt to send if credentials are provided in .env
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log(`[Notification Service] Email OTP successfully sent to ${email}`);
      } else {
        console.warn(`[Notification Service] Missing EMAIL_USER and EMAIL_PASS in .env! Simulated sending OTP ${otpCode} to ${email}`);
      }
    } else if (phone) {
      // Here you would integrate Twilio or another SMS gateway
      console.warn(`[Notification Service] Simulated sending SMS OTP ${otpCode} to ${phone}`);
    }

    res.json({ success: true, message: 'OTP sent and saved successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const { email, phone, otp, code } = req.body;
    const otpValue = otp || code;

    if (!otpValue || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'Email/Phone and OTP are required.' });
    }

    const otpRecord = await Otp.findOne({
      where: {
        ...(email ? { email } : { phone }),
        otpCode: otpValue,
        isVerified: false,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Mark as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
});

const port = process.env.PORT || 4003;

(async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Automatically creates the otps table

    server.listen(port, () => {
      console.log(`Notification service is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start notification server:', error);
    process.exit(1);
  }
})();
