import { Router, Request, Response } from 'express';
import { authenticateAdmin,authenticated } from '../../middlewares/authenticated';
import { sendNotificationToAll, getAllNotifications,getNotificationById,deleteNotification,updateNotification} from '../../controllers/admin/Notification';
import { createNotificationSchema,updateNotificationSchema } from '../../validators/admin/notification';
import { validate } from '../../middlewares/validation';
import { catchAsync } from '../../utils/catchAsync';

const router = Router();

router.post('/send', authenticated, validate(createNotificationSchema), catchAsync(sendNotificationToAll));
router.get('/', authenticated, catchAsync(getAllNotifications));
router.get('/:id', authenticated, catchAsync(getNotificationById));
router.put('/:id', authenticated, validate(updateNotificationSchema), catchAsync(updateNotification));
router.delete('/:id', authenticated, catchAsync(deleteNotification));

export default router;