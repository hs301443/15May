"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Banner_1 = require("../../controllers/users/Banner");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router
    .route("/")
    .get((0, catchAsync_1.catchAsync)(Banner_1.getAllBanners));
router
    .route("/:id")
    .get((0, catchAsync_1.catchAsync)(Banner_1.getBanner));
exports.default = router;
