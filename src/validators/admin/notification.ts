import {z} from "zod";  
export const createNotificationSchema = z.object({
    body: z.object({    
        title: z.string().min(1, "Title is required"),
        body: z.string().min(1, "Body is required"),

    }),
});
export const updateNotificationSchema = z.object({
    body: z.object({    
        title: z.string().min(1, "Title is required").optional(),
        body: z.string().min(1, "Body is required").optional(),
    }),
});