"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBanner = exports.getAllBanners = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const getAllBanners = async (req, res) => {
    const allBanners = await db_1.db.select().from(schema_1.banners);
    (0, response_1.SuccessResponse)(res, { banners: allBanners }, 200);
};
exports.getAllBanners = getAllBanners;
const getBanner = async (req, res) => {
    const id = req.params.id;
    const [banner] = await db_1.db.select().from(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id));
    if (!banner)
        throw new Errors_1.NotFound("Banner not found");
    (0, response_1.SuccessResponse)(res, { banner }, 200);
};
exports.getBanner = getBanner;
