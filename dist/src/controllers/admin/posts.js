"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.updatePost = exports.getPost = exports.getAllPosts = exports.createPost = exports.deleteCategory = exports.updateCategory = exports.getCategory = exports.getAllCategories = exports.createCategory = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
// Categories
const createCategory = async (req, res) => {
    const { name } = req.body;
    const categoryId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.postsCategory).values({ id: categoryId, name });
    (0, response_1.SuccessResponse)(res, { message: "Category created", categoryId }, 201);
};
exports.createCategory = createCategory;
const getAllCategories = async (req, res) => {
    const Categories = await db_1.db.select().from(schema_1.postsCategory);
    (0, response_1.SuccessResponse)(res, { categories: Categories }, 200);
};
exports.getAllCategories = getAllCategories;
const getCategory = async (req, res) => {
    const id = req.params.id;
    const [category] = await db_1.db
        .select()
        .from(schema_1.postsCategory)
        .where((0, drizzle_orm_1.eq)(schema_1.postsCategory.id, id));
    if (!category)
        throw new Errors_1.NotFound("Category not found");
    (0, response_1.SuccessResponse)(res, { category }, 200);
};
exports.getCategory = getCategory;
const updateCategory = async (req, res) => {
    const { name } = req.body;
    const id = req.params.id;
    const [existingCategory] = await db_1.db
        .select()
        .from(schema_1.postsCategory)
        .where((0, drizzle_orm_1.eq)(schema_1.postsCategory.id, id));
    if (!existingCategory)
        throw new Errors_1.NotFound("Category not found");
    await db_1.db.update(schema_1.postsCategory).set({ name }).where((0, drizzle_orm_1.eq)(schema_1.postsCategory.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Category updated" }, 200);
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const id = req.params.id;
    const [existingCategory] = await db_1.db
        .select()
        .from(schema_1.postsCategory)
        .where((0, drizzle_orm_1.eq)(schema_1.postsCategory.id, id));
    if (!existingCategory)
        throw new Errors_1.NotFound("Category not found");
    await db_1.db.delete(schema_1.postsCategory).where((0, drizzle_orm_1.eq)(schema_1.postsCategory.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Category deleted" }, 200);
};
exports.deleteCategory = deleteCategory;
// Posts
const createPost = async (req, res) => {
    const { title, categoryId, images } = req.body;
    const postId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.posts).values({
        id: postId,
        title,
        categoryId,
        createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
    });
    if (images !== undefined && Object.keys(images).length > 0) {
        images.forEach(async (imagePath) => {
            const imageId = (0, uuid_1.v4)();
            await db_1.db.insert(schema_1.postsImages).values({
                id: imageId,
                postId: postId,
                imagePath: await (0, handleImages_1.saveBase64Image)(imagePath, imageId, req, "posts"),
            });
        });
    }
    (0, response_1.SuccessResponse)(res, { message: "Post created", postId }, 201);
};
exports.createPost = createPost;
const getAllPosts = async (req, res) => {
    const data = await db_1.db
        .select()
        .from(schema_1.posts)
        .leftJoin(schema_1.postsImages, (0, drizzle_orm_1.eq)(schema_1.posts.id, schema_1.postsImages.postId))
        .leftJoin(schema_1.postsCategory, (0, drizzle_orm_1.eq)(schema_1.posts.categoryId, schema_1.postsCategory.id)) // JOIN categories
        .orderBy(schema_1.posts.createdAt);
    const groupedPosts = data.reduce((acc, curr) => {
        const post = curr.posts;
        const image = curr.posts_images?.imagePath || null;
        const categoryName = curr.posts_category?.name || null; // get name
        const existing = acc.find((p) => p.id === post.id);
        if (existing) {
            if (image)
                existing.images.push(image);
        }
        else {
            acc.push({
                id: post.id,
                title: post.title,
                category: categoryName, // use name instead of id
                images: image ? [image] : [],
            });
        }
        return acc;
    }, []);
    (0, response_1.SuccessResponse)(res, { posts: groupedPosts }, 200);
};
exports.getAllPosts = getAllPosts;
const getPost = async (req, res) => {
    const postId = req.params.id;
    const [post] = await db_1.db.select().from(schema_1.posts).where((0, drizzle_orm_1.eq)(schema_1.posts.id, postId));
    if (!post)
        throw new Errors_1.NotFound("Post not found");
    const images = await db_1.db
        .select()
        .from(schema_1.postsImages)
        .where((0, drizzle_orm_1.eq)(schema_1.postsImages.postId, postId));
    (0, response_1.SuccessResponse)(res, { post, images }, 200);
};
exports.getPost = getPost;
const updatePost = async (req, res) => {
    const postId = req.params.id;
    const { title, categoryId, images } = req.body;
    // Check if post exists
    const [existingPost] = await db_1.db
        .select()
        .from(schema_1.posts)
        .where((0, drizzle_orm_1.eq)(schema_1.posts.id, postId));
    if (!existingPost)
        throw new Errors_1.NotFound("Post not found");
    await db_1.db.transaction(async (tx) => {
        // Update title and category
        await tx
            .update(schema_1.posts)
            .set({ title, categoryId })
            .where((0, drizzle_orm_1.eq)(schema_1.posts.id, postId));
        if (Array.isArray(images)) {
            // 1. Delete images that have { id, imagePath }
            const deletions = images.filter((img) => img.id && img.imagePath && !img.imagePath.startsWith("data:"));
            for (const img of deletions) {
                const success = await (0, deleteImage_1.deletePhotoFromServer)(new URL(img.imagePath).pathname);
                if (!success) {
                    throw new Errors_1.ConflictError("Failed to delete post image from server");
                }
                await tx.delete(schema_1.postsImages).where((0, drizzle_orm_1.eq)(schema_1.postsImages.id, img.id));
            }
            // 2. Add new base64 images (no id)
            const additions = images.filter((img) => !img.id && img.imagePath && img.imagePath.startsWith("data:"));
            for (const img of additions) {
                const imageId = (0, uuid_1.v4)();
                const savedPath = await (0, handleImages_1.saveBase64Image)(img.imagePath, imageId, req, "posts");
                await tx.insert(schema_1.postsImages).values({
                    id: imageId,
                    postId,
                    imagePath: savedPath,
                });
            }
        }
    });
    (0, response_1.SuccessResponse)(res, { message: "Post updated" }, 200);
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    const postId = req.params.id;
    const [existingPost] = await db_1.db
        .select()
        .from(schema_1.posts)
        .where((0, drizzle_orm_1.eq)(schema_1.posts.id, postId));
    if (!existingPost)
        throw new Errors_1.NotFound("Post not found");
    const images = await db_1.db
        .select()
        .from(schema_1.postsImages)
        .where((0, drizzle_orm_1.eq)(schema_1.postsImages.postId, postId));
    if (images && images.length > 0) {
        images.forEach(async (img) => {
            const deleted = await (0, deleteImage_1.deletePhotoFromServer)(new URL(img.imagePath).pathname);
            if (!deleted)
                throw new Errors_1.ConflictError("Failed to delete post image from server");
        });
    }
    await db_1.db.delete(schema_1.postsImages).where((0, drizzle_orm_1.eq)(schema_1.postsImages.id, postId));
    await db_1.db.delete(schema_1.posts).where((0, drizzle_orm_1.eq)(schema_1.posts.id, postId));
    (0, response_1.SuccessResponse)(res, { message: "Post deleted" }, 200);
};
exports.deletePost = deletePost;
