import express from 'express';
import { signup, login, logout, getUserInfo, updateProfile } from "../controllers/authController.js";

const router = express.Router();

router.post('/signup', signup); // body has email and password (both strings)
router.post('/login', login); // body has email and password (both strings)
router.post('/logout', logout); // no body
router.get('/userinfo', getUserInfo);
router.post('/update-profile', updateProfile); // body has firstName, lastName, color (all strings)

export default router;
