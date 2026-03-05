import express from 'express';
import multer from 'multer';
import path from 'path';
import { getAllMessages, uploadFile } from '../controllers/messages.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Multer config for file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/files');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadFileMulter = multer({ storage: fileStorage });

router.post('/get-messages', verifyToken, getAllMessages);
router.post('/upload-file', verifyToken, uploadFileMulter.single('file'), uploadFile);

export default router;
