"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catchAsync_1 = require("../../utils/catchAsync");
const authenticated_1 = require("../../middlewares/authenticated");
const checkBirthday_1 = require("../../controllers/users/checkBirthday");
const router = (0, express_1.Router)();
router.get("/", authenticated_1.authenticated, (0, catchAsync_1.catchAsync)(checkBirthday_1.isBirthdayToday));
exports.default = router;
