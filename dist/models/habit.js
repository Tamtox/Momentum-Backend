"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsListItem = exports.HabitEntry = exports.Habit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const habitEntrySchema = new mongoose_1.default.Schema({
    date: { type: Date, required: true },
    habitId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Complete'], required: true, default: "Pending" },
    dateCompleted: { type: Date, default: null },
});
const habitsListItemSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    time: { type: String, default: null },
    creationDate: { type: Date, required: true },
    weekdays: { 0: { type: Boolean, required: true }, 1: { type: Boolean, required: true }, 2: { type: Boolean, required: true }, 3: { type: Boolean, required: true }, 4: { type: Boolean, required: true }, 5: { type: Boolean, required: true }, 6: { type: Boolean, required: true } },
    targetDate: { type: Date, default: null },
    isArchived: { type: Boolean, required: true, default: false },
    creationUTCOffset: { type: Number, required: true },
    alarmUsed: { type: Boolean, required: true },
});
const habitSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    user: { type: String, required: true },
    habitEntries: [habitEntrySchema],
    habitList: [habitsListItemSchema],
});
const Habit = mongoose_1.default.model('Habit', habitSchema);
exports.Habit = Habit;
const HabitEntry = mongoose_1.default.model('Habit Entry', habitEntrySchema);
exports.HabitEntry = HabitEntry;
const HabitsListItem = mongoose_1.default.model('Habits List Item', habitsListItemSchema);
exports.HabitsListItem = HabitsListItem;
//# sourceMappingURL=habit.js.map