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
const response_1 = require("../../utils/response");
const sendNotificationToAll = async (req, res) => {
    try {
        const { title, body } = req.body;
        // ✅ تحقق من المدخلات
        if (!title || !body) {
            throw new BadRequest_1.BadRequest("Title and body are required");
        }
        // 1️⃣ إنشاء Notification واحد فقط للجميع
        const notificationId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.notifications).values({
            id: notificationId,
            userId: "BROADCAST",
            title,
            body,
            status: "unseen",
        });
        // 2️⃣ جلب كل التوكنات
        const result = await db_1.db
            .select({ token: schema_2.users.fcmtoken })
            .from(schema_2.users)
            .where((0, drizzle_orm_1.isNotNull)(schema_2.users.fcmtoken));
        const tokens = result.map((row) => row.token).filter(Boolean);
        if (!tokens.length) {
            throw new NotFound_1.NotFound("No FCM tokens found");
        }
        // 3️⃣ إرسال الإشعار عبر Firebase
        const message = {
            notification: { title, body },
            tokens: tokens,
        };
        const response = await firebase_1.messaging.sendEachForMulticast(message);
        // 4️⃣ الرد النهائي
        res.json({
            success: true,
            message: "Notification sent successfully",
            notificationId, // إرجاع معرف الإشعار
            results: {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses,
            },
        });
    }
    catch (error) {
        throw error;
    }
};
exports.sendNotificationToAll = sendNotificationToAll;
const getAllNotifications = async (req, res) => {
    const data = await db_1.db.select().from(schema_1.notifications);
    (0, response_1.SuccessResponse)(res, { data }, 200); // من غير return
};
exports.getAllNotifications = getAllNotifications;
const getNotificationById = async (req, res) => {
    const { id } = req.params;
    const data = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
    console.log("Result from DB:", data);
    if (!data.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    res.json({
        success: true,
        data: data[0],
    });
};
exports.getNotificationById = getNotificationById;
// 📌 4. تحديث إشعار
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
        data: { ...existing[0], title, body }
    });
};
exports.updateNotification = updateNotification;
// 📌 5. حذف إشعار
const deleteNotification = async (req, res) => {
    const { id } = req.params;
    const existing = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
    if (!existing.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    await db_1.db
        .delete(schema_1.notifications)
        .where((0, drizzle_orm_2.eq)(schema_1.notifications.id, id));
    res.json({
        success: true,
        message: "Notification deleted successfully"
    });
};
exports.deleteNotification = deleteNotification;
