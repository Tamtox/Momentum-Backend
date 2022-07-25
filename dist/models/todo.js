"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoItem = exports.Todo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const todoItemSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Pending', 'Complete'], required: true, default: "Pending" },
    dateCompleted: { type: Date, default: null },
    creationDate: { type: Date, required: true },
    targetDate: { type: Date, default: null },
    isArchived: { type: Boolean, required: true, default: false },
    creationUTCOffset: { type: String, required: true },
    alarmUsed: { type: Boolean, required: true },
});
const todoSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    user: { type: String, required: true },
    todoList: [todoItemSchema]
});
const Todo = mongoose_1.default.model('Todo', todoSchema);
exports.Todo = Todo;
const TodoItem = mongoose_1.default.model('Todo Item', todoItemSchema);
exports.TodoItem = TodoItem;
