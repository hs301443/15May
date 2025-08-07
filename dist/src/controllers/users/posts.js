"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactPost = exports.getPostsWithReactsByCategory = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const uuid_1 = require("uuid");
const CATEGORY_IDS = {
    cultural: "63b99a53-60b3-11f0-908d-0050564dafeb",
    sport: "63b9af5e-60b3-11f0-908d-0050564dafeb",
    social: "779a5031-60b3-11f0-908d-0050564dafeb", // looks same as social? Check if typo
};
const getPostsWithReactsByCategory = async (req, res) => {
    const { type } = req.params;
    const userId = req.user?.id;
    const categoryId = CATEGORY_IDS[type];
    if (!categoryId)
        throw new Errors_1.NotFound("Category Not Found");
    // Get posts
    const postsData = await db_1.db
        .select()
        .from(schema_1.posts)
        .where((0, drizzle_orm_1.eq)(schema_1.posts.categoryId, categoryId));
    const postIds = postsData.map((p) => p.id);
    // Get all images for these posts
    const images = await db_1.db
        .select()
        .from(schema_1.postsImages)
        .where((0, drizzle_orm_1.inArray)(schema_1.postsImages.postId, postIds));
    // Group images by postId
    const imagesByPost = {};
    for (const img of images) {
        if (!imagesByPost[img.postId])
            imagesByPost[img.postId] = [];
        imagesByPost[img.postId].push(img);
    }
    // Get react counts
    const reactsData = await db_1.db
        .select({
        postId: schema_1.reacts.postId,
        count: (0, drizzle_orm_1.sql) `count(*)`.as("count"),
    })
        .from(schema_1.reacts)
        .where((0, drizzle_orm_1.inArray)(schema_1.reacts.postId, postIds))
        .groupBy(schema_1.reacts.postId);
    // Get user reacts
    const userReacts = userId
        ? await db_1.db
            .select({ postId: schema_1.reacts.postId })
            .from(schema_1.reacts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.reacts.postId, postIds), (0, drizzle_orm_1.eq)(schema_1.reacts.userId, userId)))
        : [];
    const postsWithExtras = postsData.map((post) => {
        const postImages = imagesByPost[post.id] || [];
        const reactData = reactsData.find((r) => r.postId === post.id);
        const hasReacted = userReacts.some((r) => r.postId === post.id);
        return {
            ...post,
            images: postImages,
            reactsCount: reactData?.count || 0,
            reacted: hasReacted,
        };
    });
    (0, response_1.SuccessResponse)(res, { posts: postsWithExtras }, 200);
};
exports.getPostsWithReactsByCategory = getPostsWithReactsByCategory;
const reactPost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const [post] = await db_1.db.select().from(schema_1.posts).where((0, drizzle_orm_1.eq)(schema_1.posts.id, postId));
    if (!post)
        throw new Errors_1.NotFound("Post not found");
    const [liked] = await db_1.db
        .select()
        .from(schema_1.reacts)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.reacts.postId, postId), (0, drizzle_orm_1.eq)(schema_1.reacts.userId, userId)));
    if (liked)
        await db_1.db
            .delete(schema_1.reacts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.reacts.postId, postId), (0, drizzle_orm_1.eq)(schema_1.reacts.userId, userId)));
    else
        await db_1.db.insert(schema_1.reacts).values({ id: (0, uuid_1.v4)(), postId, userId });
    (0, response_1.SuccessResponse)(res, { messafe: "User Liked Success" }, 200);
};
exports.reactPost = reactPost;
