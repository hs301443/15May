"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationById = exports.getUnseenCount = exports.getAllNotifications = void 0;
const schema_1 = require("../../models/schema");
const db_1 = require("../../models/db");
const Errors_1 = require("../../Errors");
const NotFound_1 = require("../../Errors/NotFound");
const drizzle_orm_1 = require("drizzle-orm");
// 📌 1. جلب كل الإشعارات الخاصة باليوزر
const getAllNotifications = async (req, res) => {
    if (!req.user?.id)
        throw new Errors_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const allNotifications = await db_1.db
        .select({
        id: schema_1.userNotifications.id,
        status: schema_1.userNotifications.status,
        createdAt: schema_1.userNotifications.createdAt,
        title: schema_1.notifications.title,
        body: schema_1.notifications.body,
    })
        .from(schema_1.userNotifications)
        .innerJoin(schema_1.notifications, (0, drizzle_orm_1.eq)(schema_1.userNotifications.notificationId, schema_1.notifications.id))
        .where((0, drizzle_orm_1.eq)(schema_1.userNotifications.userId, userId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.userNotifications.createdAt));
    // ✅ بعد ما يجيبهم، يغيّر الحالات لـ seen
    await db_1.db
        .update(schema_1.userNotifications)
        .set({ status: "seen" })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userNotifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userNotifications.status, "unseen")));
    res.json({ notifications: allNotifications });
};
exports.getAllNotifications = getAllNotifications;
// 📌 2. جلب عدد الإشعارات الغير مقروءة
const getUnseenCount = async (req, res) => {
    if (!req.user?.id)
        throw new Errors_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const unseen = await db_1.db
        .select()
        .from(schema_1.userNotifications)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userNotifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userNotifications.status, "unseen")));
    res.json({ unseenCount: unseen.length });
};
exports.getUnseenCount = getUnseenCount;
// 📌 3. جلب إشعار واحد + تحديث حالته لو كان unseen
const getNotificationById = async (req, res) => {
    if (!req.user?.id)
        throw new Errors_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const { id } = req.params;
    const notif = await db_1.db
        .select({
        id: schema_1.userNotifications.id,
        status: schema_1.userNotifications.status,
        createdAt: schema_1.userNotifications.createdAt,
        title: schema_1.notifications.title,
        body: schema_1.notifications.body,
    })
        .from(schema_1.userNotifications)
        .innerJoin(schema_1.notifications, (0, drizzle_orm_1.eq)(schema_1.userNotifications.notificationId, schema_1.notifications.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userNotifications.id, id), (0, drizzle_orm_1.eq)(schema_1.userNotifications.userId, userId)));
    if (!notif.length)
        throw new NotFound_1.NotFound("Notification not found");
    if (notif[0].status === "unseen") {
        await db_1.db
            .update(schema_1.userNotifications)
            .set({ status: "seen" })
            .where((0, drizzle_orm_1.eq)(schema_1.userNotifications.id, id));
    }
    res.json(notif[0]);
};
exports.getNotificationById = getNotificationById;
