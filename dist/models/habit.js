"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const habitEntrySchema = new mongoose_1.default.Schema({
    weekStart: { type: String, required: true },
    weekEnd: { type: String, required: true },
    habitId: { type: String, required: true },
    year: { type: String, required: true },
    month: { type: String, required: true },
    date: { type: String, required: true },
    weekday: { type: String, required: true },
    habitEntryStatus: { type: String, enum: ['Pending', 'Complete'], required: true, default: "Pending" },
});
const habitsListItemSchema = new mongoose_1.default.Schema({
    habitTitle: { type: String, required: true },
    habitTime: { type: String, default: null },
    habitCreationDate: { type: String, required: true },
    habitWeekdays: { 0: { type: Boolean, required: true }, 1: { type: Boolean, required: true }, 2: { type: Boolean, required: true }, 3: { type: Boolean, required: true }, 4: { type: Boolean, required: true }, 5: { type: Boolean, required: true }, 6: { type: Boolean, required: true } },
    goalId: { type: String, default: null },
    goalTargetDate: { type: String, default: null },
    isArchived: { type: Boolean, required: true, default: false }
});
const habitSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    user: { type: String, required: true },
    habitEntries: [habitEntrySchema],
    habitList: [habitsListItemSchema],
});
const Habit = mongoose_1.default.model('Habit', habitSchema);
const HabitEntry = mongoose_1.default.model('Habit Entry', habitEntrySchema);
const HabitsListItem = mongoose_1.default.model('Habits List Item', habitsListItemSchema);
exports.Habit = Habit;
exports.HabitEntry = HabitEntry;
exports.HabitsListItem = HabitsListItem;
