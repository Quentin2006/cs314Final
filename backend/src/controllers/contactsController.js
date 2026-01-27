import express from 'express';

// NOTE: ALL OF THE NOTES REST API ENDPOINTS
const router = express.Router();

router.post('/search',); // body has searchTerm (string)
router.get('/all-contacts',);
router.get('/get-contacts-for-list',);
router.delete('/contacts/delete-dm/:dmId',);

export default router;
