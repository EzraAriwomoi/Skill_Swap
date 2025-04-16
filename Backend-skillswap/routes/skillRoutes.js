import express from 'express';
import { getSkills, searchSkills } from '../controllers/skillController.js';

const router = express.Router();

router.get('/', getSkills);
router.get('/search', searchSkills);

export default router;