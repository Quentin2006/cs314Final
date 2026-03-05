import express from 'express';
import multer from 'multer';
import path from 'path';
import { signup, login, logout, getUserInfo, updateProfile, addProfileImage, removeProfileImage } from '../controllers/auth.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Multer config for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadProfileImage = multer({ storage: profileStorage });

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/userinfo', verifyToken, getUserInfo);
router.post('/update-profile', verifyToken, updateProfile);
router.post('/add-profile-image', verifyToken, uploadProfileImage.single('profile-image'), addProfileImage);
router.delete('/remove-profile-image', verifyToken, removeProfileImage);

export default router;
