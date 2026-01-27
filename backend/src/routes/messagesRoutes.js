import express from 'express';

// NOTE: ALL OF THE NOTES REST API ENDPOINTS
const router = express.Router();

router.post('/get-messages', getAllNotes); // body has id:contactorId (string)

export default router;
