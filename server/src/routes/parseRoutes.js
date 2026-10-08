import express from 'express';
import { handleParse } from '../controllers/parseController.js';

const router = express.Router();
router.post('/', handleParse);

export default router;
