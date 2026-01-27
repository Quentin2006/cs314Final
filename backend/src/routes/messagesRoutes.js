import express from 'express';
import { getAllMessages } from "../controllers/messagesController.js"

const router = express.Router();

router.post('/get-messages', getAllMessages); // body has id:contactorId (string)

export default router;
