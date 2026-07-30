import express from 'express';
import {
  get_assessments,
  post_seed_sample_building,
  post_assessments,
  get_assessments_by_id,
  get_assessments_validate_public,
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
import { requireRole } from '../middleware/authMiddleware';
import {
  ADMIN_ROLES,
  STAFF_ROLES,
  MANAGEMENT_ROLES,
  DISPOSITION_ROLES,
  REPORT_ROLES,
} from '../middleware/rolePolicies';

const router = express.Router();

router.get('/api/assessments', get_assessments);
router.get('/api/assessments/:id/validate-public', get_assessments_validate_public);
router.get('/api/assessments/:id', get_assessments_by_id);
router.post('/api/assessments', post_assessments);
router.put('/api/assessments/:id', put_assessments_by_id);

router.post('/api/seed-sample-building', requireRole(...ADMIN_ROLES), post_seed_sample_building);
router.get('/api/buildings', get_buildings);
router.get('/api/buildings/:id/history', get_buildings_by_id_history);
router.put('/api/assessments/:id/verification', requireRole(...STAFF_ROLES), put_assessments_by_id_verification);
router.get('/api/assessments/:id/logs', get_assessments_by_id_logs);
router.put('/api/assessments/bulk-status', requireRole(...MANAGEMENT_ROLES), put_assessments_bulk_status);
router.put('/api/assessments/:id/status', requireRole(...STAFF_ROLES), put_assessments_by_id_status);
router.put('/api/assessments/:id/disposisi', requireRole(...DISPOSITION_ROLES), put_assessments_by_id_disposisi);
router.delete('/api/assessments/:id', requireRole(...MANAGEMENT_ROLES), delete_assessments_by_id);

router.get('/api/assessments/:id/ikm', get_assessment_ikm);
router.post('/api/assessments/:id/ikm', post_assessment_ikm);

router.get('/api/ikm/stats', requireRole(...REPORT_ROLES), get_ikm_stats);
router.get('/api/ikm/responses', requireRole(...REPORT_ROLES), get_ikm_responses);

router.get('/api/settings/ikm-questions', requireRole(...ADMIN_ROLES), get_ikm_questions);
router.post('/api/settings/ikm-questions', requireRole(...ADMIN_ROLES), create_ikm_question);
router.put('/api/settings/ikm-questions/:id', requireRole(...ADMIN_ROLES), update_ikm_question);
router.delete('/api/settings/ikm-questions/:id', requireRole(...ADMIN_ROLES), delete_ikm_question);

export default router;
