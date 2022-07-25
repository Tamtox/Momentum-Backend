"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalItem = exports.Goal = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const goalItemSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    creationDate: { type: Date, required: true },
    targetDate: { type: Date, default: null },
    status: { type: String, enum: ['Pending', 'Complete'], required: true, default: "Pending" },
    dateCompleted: { type: Date, default: null },
    habitId: { type: String, default: null },
    isArchived: { type: Boolean, required: true, default: false },
    creationUTCOffset: { type: String, required: true },
    alarmUsed: { type: Boolean, required: true },
});
const goalSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    user: { type: String, required: true },
    goalList: [goalItemSchema],
});
const Goal = mongoose_1.default.model('Goal', goalSchema);
exports.Goal = Goal;
const GoalItem = mongoose_1.default.model('Goal Item', goalItemSchema);
exports.GoalItem = GoalItem;
