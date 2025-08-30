import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createNotificationSchema, updateNotificationSchema } from './notificationSchema';
import { createNotificationHandler, getNotificationsHandler, markNotificationAsSeenHandler, deleteNotificationHandler } from './notificationController';

const router = Router();

router.route('/')
  .post(auth, validateRequest(createNotificationSchema, 'body'), createNotificationHandler)
  .get(auth, getNotificationsHandler);

router.route('/:id/seen')
  .patch(auth, markNotificationAsSeenHandler);

router.route('/:id')
  .delete(auth, deleteNotificationHandler);

export default router;
