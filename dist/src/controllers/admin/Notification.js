"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.updateNotification = exports.getNotificationById = exports.getAllNotifications = exports.sendNotificationToAll = void 0;
const firebase_1 = require("../../utils/firebase");
const schema_1 = require("../../models/schema");
const schema_2 = require("../../models/schema");
const db_1 = require("../../models/db");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const uuid_1 = require("uuid");
const drizzle_orm_1 = require("drizzle-orm");
const sendNotificationToAll = async (req, res) => {
    const { title, body } = req.body;
    if (!title || !body) {
        throw new BadRequest_1.BadRequest("Title and body are required");
    }
    // إنشاء إشعار جديد في قاعدة البيانات
    const newNotificationId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.notifications).values({
        id: newNotificationId,
        title,
        body,
    });
    // جلب كل المستخدمين
    const allUsers = await db_1.db.select({ id: schema_2.users.id, token: schema_2.users.fcmtoken }).from(schema_2.users);
    if (!allUsers.length) {
        throw new NotFound_1.NotFound("No users found");
    }
    // تجهيز بيانات user_notifications
    const userNotificationsData = allUsers.map(user => ({
        id: (0, uuid_1.v4)(),
        userId: user.id,
        notificationId: newNotificationId,
        status: "unseen",
        createdAt: new Date(),
    }));
    await db_1.db.insert(schema_1.userNotifications).values(userNotificationsData);
    // جمع كل التوكنات الصالحة
    const tokens = allUsers
        .map(u => u.token)
        .filter(Boolean);
    if (!tokens.length) {
        res.json({
            success: true,
            message: "Notification saved but no valid FCM tokens found",
        });
        return;
    }
    // تقسيم التوكنات في دفعات لو كبيرة
    const BATCH_SIZE = 500; // FCM يسمح حتى 500 توكن للدفعة الواحدة
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE);
        const message = {
            notification: { title, body },
            tokens: batchTokens,
        };
        const response = await firebase_1.messaging.sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;
    }
    res.json({
        success: true,
        message: "Notification sent successfully",
        results: { successCount, failureCount },
    });
};
exports.sendNotificationToAll = sendNotificationToAll;
// ✅ Get All
const getAllNotifications = async (req, res) => {
    const data = await db_1.db
        .select()
        .from(schema_1.notifications)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt));
    res.json({ success: true, data });
};
exports.getAllNotifications = getAllNotifications;
// ✅ Get by ID
const getNotificationById = async (req, res) => {
    const { id } = req.params;
    const data = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    if (!data.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    res.json({ success: true, data: data[0] });
};
exports.getNotificationById = getNotificationById;
// ✅ Update
const updateNotification = async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    if (!title || !body) {
        throw new BadRequest_1.BadRequest("Title and body are required");
    }
    const existing = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    if (!existing.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    await db_1.db
        .update(schema_1.notifications)
        .set({ title, body })
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    res.json({
        success: true,
        message: "Notification updated successfully",
        data: { ...existing[0], title, body },
    });
};
exports.updateNotification = updateNotification;
// ✅ Delete
const deleteNotification = async (req, res) => {
    const { id } = req.params;
    const existing = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    if (!existing.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    await db_1.db.delete(schema_1.notifications).where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    res.json({
        success: true,
        message: "Notification deleted successfully",
    });
};
exports.deleteNotification = deleteNotification;
