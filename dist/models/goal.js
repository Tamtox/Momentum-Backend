"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const goalItemSchema = new mongoose_1.default.Schema({
    goalTitle: { type: String, required: true },
    goalCreationDate: { type: String, required: true },
    goalTargetDate: { type: String, default: null },
    goalStatus: { type: String, enum: ['Pending', 'Complete'], required: true, default: "Pending" },
    dateCompleted: { type: String, default: "" },
    habitId: { type: String, default: null },
    isArchived: { type: Boolean, required: true, default: false }
});
const goalSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    user: { type: String, required: true },
    goalList: [goalItemSchema],
});
const Goal = mongoose_1.default.model('Goal', goalSchema);
const GoalItem = mongoose_1.default.model('Goal Item', goalItemSchema);
exports.Goal = Goal;
exports.GoalItem = GoalItem;
