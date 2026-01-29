import express from 'express';
import { searchContacts, getAllContacts, getContactsForList, deleteContact } from "../controllers/contacts.js"

const router = express.Router();

router.post('/search', searchContacts); // body has searchTerm (string)
router.get('/all-contacts', getAllContacts);
router.get('/get-contacts-for-list', getContactsForList);
router.delete('/contacts/delete-dm/:dmId', deleteContact);

export default router;
