import express from 'express';
import { searchContacts, getAllContacts, getContactsForList, deleteDM } from '../controllers/contacts.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/search', verifyToken, searchContacts);
router.get('/all-contacts', verifyToken, getAllContacts);
router.get('/get-contacts-for-list', verifyToken, getContactsForList);
router.delete('/delete-dm/:dmId', verifyToken, deleteDM);

export default router;
