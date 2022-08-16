"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = exports.ScheduleItem = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const scheduleItemSchema = new mongoose_1.default.Schema({
    date: { type: Date, required: true },
    parentId: { type: String, required: true },
    parentTitle: { type: String, required: true },
    dateCompleted: { type: Date, default: null },
    alarmUsed: { type: Boolean, required: true },
    utcOffset: { type: String, required: true },
    isArchived: { type: Boolean, required: true, default: false },
});
const scheduleSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    user: { type: String, required: true },
    scheduleList: [scheduleItemSchema],
});
const Schedule = mongoose_1.default.model('Schedule', scheduleSchema);
exports.Schedule = Schedule;
const ScheduleItem = mongoose_1.default.model('Schedule List Item', scheduleItemSchema);
exports.ScheduleItem = ScheduleItem;
