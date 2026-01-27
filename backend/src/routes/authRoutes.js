import express from 'express';

// NOTE: ALL OF THE NOTES REST API ENDPOINTS
const router = express.Router();

router.post('/signup',); // body has email and password (both strings)
router.post('/login',); // body has email and password (both strings)
router.post('/logout',); // no body
router.get('/userinfo');
router.post('/update-profile'); // body has firstName, lastName, color (all strings)

export default router;
