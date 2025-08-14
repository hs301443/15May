"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationById = exports.getUnseenCount = exports.getAllNotifications = void 0;
const schema_1 = require("../../models/schema");
const db_1 = require("../../models/db");
const Errors_1 = require("../../Errors");
const NotFound_1 = require("../../Errors/NotFound");
const drizzle_orm_1 = require("drizzle-orm");
const getAllNotifications = async (req, res) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("User not authenticated");
    }
    const userId = req.user.id;
    const allNotifications = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId))
        .orderBy(schema_1.notifications.createdAt);
    await db_1.db
        .update(schema_1.notifications)
        .set({ status: "seen" })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.notifications.status, "unseen")));
    res.json({ notifications: allNotifications });
};
exports.getAllNotifications = getAllNotifications;
// ✅ جلب عدد النوتيفيكيشنز الغير مقروءة
exports.getUnseenCount = (async (req, res) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("User not authenticated");
    }
    const userId = req.user.id;
    const unseen = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.notifications.status, "unseen")));
    res.json({ unseenCount: unseen.length });
});
// ✅ جلب رسالة واحدة وتحويلها إلى seen لو كانت unseen
const getNotificationById = async (req, res) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("User not authenticated");
    }
    const userId = req.user.id;
    const { id } = req.params;
    const notif = await db_1.db
        .select()
        .from(schema_1.notifications)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.id, id), (0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId)));
    if (!notif.length) {
        throw new NotFound_1.NotFound("Notification not found");
    }
    if (notif[0].status === "unseen") {
        await db_1.db
            .update(schema_1.notifications)
            .set({ status: "seen" })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    }
    res.json(notif[0]);
};
exports.getNotificationById = getNotificationById;
