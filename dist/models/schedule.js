"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const scheduleEntrySchema = new mongoose_1.default.Schema({
    time: { type: String, required: true },
    title: { type: String, required: true },
    weekdays: { 0: { type: Boolean, required: true }, 1: { type: Boolean, required: true }, 2: { type: Boolean, required: true }, 3: { type: Boolean, required: true }, 4: { type: Boolean, required: true }, 5: { type: Boolean, required: true }, 6: { type: Boolean, required: true } }
});
const scheduleSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    user: { type: String, required: true },
    scheduleEntries: [scheduleEntrySchema]
});
exports.Schedule = mongoose_1.default.model('Schedule', scheduleSchema);
exports.ScheduleEntry = mongoose_1.default.model('Schedule Entry', scheduleEntrySchema);
