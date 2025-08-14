import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middlewares/authenticated';
import { sendNotificationToAll, getAllNotifications,getNotificationById,deleteNotification,updateNotification} from '../../controllers/admin/Notification';
import { createNotificationSchema,updateNotificationSchema } from '../../validators/admin/notification';
import { validate } from '../../middlewares/validation';
import { catchAsync } from '../../utils/catchAsync';

const router = Router();

router.post('/send', authenticateAdmin, validate(createNotificationSchema), catchAsync(sendNotificationToAll));
router.get('/', authenticateAdmin, catchAsync(getAllNotifications));
router.get('/:id', authenticateAdmin, catchAsync(getNotificationById));
router.put('/:id', authenticateAdmin, validate(updateNotificationSchema), catchAsync(updateNotification));
router.delete('/:id', authenticateAdmin, catchAsync(deleteNotification));

export default router;