import { Request, Response } from "express";
import { messaging } from "../../utils/firebase";
import { notifications } from "../../models/schema";
import { users } from "../../models/schema";
import { db } from "../../models/db";
import { isNotNull } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { v4 as uuidv4 } from "uuid";
import { eq ,desc} from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";

export const sendNotificationToAll = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      throw new BadRequest("Title and body are required");
    }

    // 🟢 إضافة إشعار واحد فقط
    await db.insert(notifications).values({
      id: uuidv4(),
      title,
      body,
    });

    // 🟢 جلب كل التوكنات
    const result = await db
      .select({ token: users.fcmtoken })
      .from(users)
      .where(isNotNull(users.fcmtoken));

    const tokens = result.map((row) => row.token).filter(Boolean) as string[];

    if (!tokens.length) {
      throw new NotFound("No FCM tokens found");
    }

    // 🟢 إرسال عبر Firebase
    const message = {
      notification: { title, body },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    res.json({
      success: true,
      message: "Notification sent successfully",
      results: {
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    });
  } catch (error) {
    throw error;
  }
};

// ✅ Get All
export const getAllNotifications = async (req: Request, res: Response) => {
  const data = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt));

  res.json({ success: true, data });
};

// ✅ Get by ID
export const getNotificationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const data = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!data.length) {
    throw new NotFound("Notification not found");
  }

  res.json({ success: true, data: data[0] });
};

// ✅ Update
export const updateNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, body } = req.body;

  if (!title || !body) {
    throw new BadRequest("Title and body are required");
  }

  const existing = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!existing.length) {
    throw new NotFound("Notification not found");
  }

  await db
    .update(notifications)
    .set({ title, body })
    .where(eq(notifications.id, id));

  res.json({
    success: true,
    message: "Notification updated successfully",
    data: { ...existing[0], title, body },
  });
};

// ✅ Delete
export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!existing.length) {
    throw new NotFound("Notification not found");
  }

  await db.delete(notifications).where(eq(notifications.id, id));

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
};