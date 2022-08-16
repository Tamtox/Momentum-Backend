"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { authCheck } = require('../middleware/auth-check');
const { getSchedule, updateScheduleItemStatus } = require('../controllers/schedule-controllers');
router.post('/getSchedule', authCheck, getSchedule);
router.patch('/updateScheduleItemStatus', authCheck, updateScheduleItemStatus);
module.exports = router;
