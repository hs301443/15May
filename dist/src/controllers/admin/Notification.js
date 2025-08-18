"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.updateNotification = exports.getNotificationById = exports.getAllNotifications = exports.sendNotificationToAll = void 0;
const firebase_1 = require("../../utils/firebase");
const schema_1 = require("../../models/schema");
const schema_2 = require("../../models/schema");
const db_1 = require("../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const uuid_1 = require("uuid");
const drizzle_orm_2 = require("drizzle-orm");
const sendNotificationToAll = async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            throw new BadRequest_1.BadRequest("Title and body are required");
        }
        // 🟢 إضافة إشعار واحد فقط
        await db_1.db.insert(schema_1.notifications).values({
            id: (0, uuid_1.v4)(),
            title,
            body,
        });
        // 🟢 جلب كل التوكنات
        const result = await db_1.db
            .select({ token: schema_2.users.fcmtoken })
            .from(schema_2.users)
            .where((0, drizzle_orm_1.isNotNull)(schema_2.users.fcmtoken));
        const tokens = result.map((row) => row.token).filter(Boolean);
        if (!tokens.length) {
            throw new NotFound_1.NotFound("No FCM tokens found");
        }
        // 🟢 إرسال عبر Firebase
        const message = {
            notification: { title, body },
            tokens,
        };
        const response = await firebase_1.messaging.sendEachForMulticast(message);
        res.json({
            success: true,
            message: "Notification sent successfully",
            results: {
                successCount: response.successCount,
                failureCount: response.failureCount,
            },
        });
    }
    catch (error) {
        throw error;
    }
};
exports.sendNotificationToAll = sendNotificationToAll;
// ✅ Get All
const getAllNotifications = async (req, res) => {
    const data = await db_1.db
        .select()
        .from(schema_1.notifications)
        .orderBy((0, drizzle_orm_2.desc)(schema_1.notifications.createdAt));
    res.json({ success: true, data });
};
exports.getAllNotifications = getAllNotifications;
// ✅ Get by ID
const getNotificationById = async (req, res) => {
    const { id } = req.params;
    const data = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
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
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
    if (!existing.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    await db_1.db
        .update(schema_1.notifications)
        .set({ title, body })
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
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
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
    if (!existing.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    await db_1.db.delete(schema_1.notifications).where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
    res.json({
        success: true,
        message: "Notification deleted successfully",
    });
};
exports.deleteNotification = deleteNotification;
