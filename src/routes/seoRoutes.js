import express from 'express';
import { upsertSeo, getSeo, deleteSeo } from '../controllers/seoController.js';

const router = express.Router();

router.get('/', getSeo);
router.post('/', upsertSeo);
router.delete('/:id', deleteSeo);

export default router;



