"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getSchedule, addNewScheduleEntry, deleteScheduleEntry } = require('../controllers/schedule-controllers');
const { authCheck } = require('../middleware/auth-check');
router.get('/', authCheck, getSchedule);
router.post('/', authCheck, addNewScheduleEntry);
router.delete('/', authCheck, deleteScheduleEntry);
module.exports = router;
