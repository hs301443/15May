import { Router, Request, Response } from 'express';
import { authenticateAdmin,authenticated } from '../../middlewares/authenticated';
import { sendNotificationToAll, getAllNotifications,getNotificationById,deleteNotification,updateNotification} from '../../controllers/admin/Notification';
import { createNotificationSchema,updateNotificationSchema } from '../../validators/admin/notification';
import { validate } from '../../middlewares/validation';
import { catchAsync } from '../../utils/catchAsync';
import { authorizeRoles } from '../../middlewares/authorized';

const router = Router();

router.post('/send', authorizeRoles('admin'), validate(createNotificationSchema), catchAsync(sendNotificationToAll));
router.get('/', authorizeRoles('admin'), catchAsync(getAllNotifications));
router.get('/:id', authorizeRoles('admin'), catchAsync(getNotificationById));
router.put('/:id', authorizeRoles('admin'), validate(updateNotificationSchema), catchAsync(updateNotification));
router.delete('/:id', authorizeRoles('admin'), catchAsync(deleteNotification));

export default router;