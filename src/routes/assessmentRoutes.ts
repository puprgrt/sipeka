import express from 'express';
import {
  get_assessments,
  post_seed_sample_building,
  post_assessments,
  get_assessments_by_id,
  get_buildings,
  get_buildings_by_id_history,
  put_assessments_by_id_verification,
  get_assessments_by_id_logs,
  put_assessments_bulk_status,
  put_assessments_by_id_status,
  put_assessments_by_id_disposisi,
  put_assessments_by_id,
  delete_assessments_by_id,
  get_assessment_ikm,
  post_assessment_ikm,
  get_ikm_stats,
  get_ikm_responses,
  get_ikm_questions,
  create_ikm_question,
  update_ikm_question,
  delete_ikm_question,
} from '../controllers/assessmentController';

const router = express.Router();

router.get('/api/assessments', get_assessments);
router.post('/api/seed-sample-building', post_seed_sample_building);
router.post('/api/assessments', post_assessments);
router.get('/api/assessments/:id', get_assessments_by_id);
router.get('/api/buildings', get_buildings);
router.get('/api/buildings/:id/history', get_buildings_by_id_history);
router.put('/api/assessments/:id/verification', put_assessments_by_id_verification);
router.get('/api/assessments/:id/logs', get_assessments_by_id_logs);
router.put('/api/assessments/bulk-status', put_assessments_bulk_status);
router.put('/api/assessments/:id/status', put_assessments_by_id_status);
router.put('/api/assessments/:id/disposisi', put_assessments_by_id_disposisi);
router.get('/api/assessments/:id/ikm', get_assessment_ikm);
router.post('/api/assessments/:id/ikm', post_assessment_ikm);
router.put('/api/assessments/:id', put_assessments_by_id);
router.delete('/api/assessments/:id', delete_assessments_by_id);

router.get('/api/ikm/stats', get_ikm_stats);
router.get('/api/ikm/responses', get_ikm_responses);

router.get('/api/settings/ikm-questions', get_ikm_questions);
router.post('/api/settings/ikm-questions', create_ikm_question);
router.put('/api/settings/ikm-questions/:id', update_ikm_question);
router.delete('/api/settings/ikm-questions/:id', delete_ikm_question);

export default router;
