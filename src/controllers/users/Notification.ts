import { Request, Response } from "express";
import { notifications } from "../../models/schema";
import { db } from "../../models/db";
import { UnauthorizedError } from "../../Errors";
import { NotFound } from "../../Errors/NotFound";
import { eq,and } from "drizzle-orm";

export const getAllNotifications = async (req:Request, res:Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedError("User not authenticated");
  }
  const userId = req.user.id;

  const allNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt);

  await db
    .update(notifications)
    .set({ status: "seen" })
    .where(and(eq(notifications.userId, userId), eq(notifications.status, "unseen")));

  res.json({ notifications: allNotifications });
};

// ✅ جلب عدد النوتيفيكيشنز الغير مقروءة
export const getUnseenCount =(async (req:Request, res:Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedError("User not authenticated");
  }
  const userId = req.user.id;

  const unseen = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.status, "unseen")));

  res.json({ unseenCount: unseen.length });
});


// ✅ جلب رسالة واحدة وتحويلها إلى seen لو كانت unseen
export const getNotificationById = async (req: Request, res: Response) => {
   if (!req.user?.id) {
    throw new UnauthorizedError("User not authenticated");
  }
  const userId = req.user.id;
  const { id } = req.params;

  const notif = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

  if (!notif.length) {
    throw new NotFound("Notification not found");
  }

  if (notif[0].status === "unseen") {
    await db
      .update(notifications)
      .set({ status: "seen" })
      .where(eq(notifications.id, id));
  }

  res.json(notif[0]);
};  