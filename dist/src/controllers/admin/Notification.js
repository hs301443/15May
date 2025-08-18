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
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            throw new BadRequest_1.BadRequest("Title and body are required");
        }
        console.log("🚀 Starting notification process...");
        // 1. حفظ الإشعار في جدول notifications
        const newNotificationId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.notifications).values({
            id: newNotificationId,
            title,
            body,
        });
        console.log(`✅ Notification saved with ID: ${newNotificationId}`);
        // 2. جلب كل المستخدمين مع التوكنات في استعلام واحد
        const allUsersWithTokens = await db_1.db
            .select({
            id: schema_2.users.id,
            fcmtoken: schema_2.users.fcmtoken
        })
            .from(schema_2.users);
        if (!allUsersWithTokens.length) {
            throw new NotFound_1.NotFound("No users found");
        }
        console.log(`📊 Total users found: ${allUsersWithTokens.length}`);
        // 3. ربط الإشعار بكل المستخدمين
        const userNotificationsData = allUsersWithTokens.map(user => ({
            id: (0, uuid_1.v4)(),
            userId: user.id,
            notificationId: newNotificationId,
            status: "unseen",
        }));
        await db_1.db.insert(schema_1.userNotifications).values(userNotificationsData);
        console.log(`✅ Created ${userNotificationsData.length} user-notification relationships`);
        // 4. جلب التوكنات الصحيحة فقط
        const tokens = allUsersWithTokens
            .map(user => user.fcmtoken)
            .filter(token => {
            // تحقق من إن التوكن موجود ومش فاضي ومش null
            return token &&
                typeof token === 'string' &&
                token.trim().length > 0 &&
                token !== 'null' &&
                token !== 'undefined';
        });
        console.log(`📊 Users with valid FCM tokens: ${tokens.length}`);
        console.log(`🔍 Sample tokens:`, tokens.slice(0, 2).map(t => `${t.substring(0, 20)}...`));
        if (!tokens.length) {
            res.json({
                success: true,
                message: "Notification saved but no valid FCM tokens found",
                notificationId: newNotificationId,
                stats: {
                    totalUsers: allUsersWithTokens.length,
                    validTokens: 0,
                    usersWithTokens: allUsersWithTokens.filter(u => u.fcmtoken).length,
                },
            });
            return;
        }
        // 5. إرسال الإشعار لكل التوكنات
        const message = {
            notification: {
                title,
                body
            },
            tokens,
        };
        console.log("🚀 Sending FCM notification...");
        console.log(`📤 Message payload:`, { title, body, tokenCount: tokens.length });
        const response = await firebase_1.messaging.sendEachForMulticast(message);
        console.log("✅ FCM Response received:");
        console.log(`✅ Success: ${response.successCount}`);
        console.log(`❌ Failures: ${response.failureCount}`);
        // 6. تسجيل تفاصيل الأخطاء إن وجدت
        if (response.failureCount > 0) {
            console.log("❌ Failed deliveries details:");
            response.responses.forEach((resp, index) => {
                if (!resp.success && resp.error) {
                    console.log(`  Token ${index}: ${resp.error.code} - ${resp.error.message}`);
                }
            });
        }
        res.json({
            success: true,
            message: "Notification sent successfully",
            notificationId: newNotificationId,
            results: {
                successCount: response.successCount,
                failureCount: response.failureCount,
                totalTokens: tokens.length,
            },
            stats: {
                totalUsers: allUsersWithTokens.length,
                validTokens: tokens.length,
                usersWithTokens: allUsersWithTokens.filter(u => u.fcmtoken).length,
            },
        });
    }
    catch (error) {
        console.error("❌ Error in sendNotificationToAll:", error);
        // طباعة تفاصيل الخطأ
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        throw error;
    }
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
