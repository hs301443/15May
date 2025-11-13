"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Banner_1 = require("../../controllers/admin/Banner");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router
    .route("/")
    .get((0, catchAsync_1.catchAsync)(Banner_1.getAllBanners))
    .post((0, catchAsync_1.catchAsync)(Banner_1.createBanner));
router
    .route("/:id")
    .get((0, catchAsync_1.catchAsync)(Banner_1.getBanner))
    .put((0, catchAsync_1.catchAsync)(Banner_1.updateBanner))
    .delete((0, catchAsync_1.catchAsync)(Banner_1.deleteBanner));
exports.default = router;
