"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationSchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
exports.createNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required"),
        body: zod_1.z.string().min(1, "Body is required"),
    }),
});
exports.updateNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required").optional(),
        body: zod_1.z.string().min(1, "Body is required").optional(),
    }),
});
