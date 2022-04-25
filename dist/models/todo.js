"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const todoItemSchema = new mongoose_1.default.Schema({
    todoTitle: { type: String, required: true },
    todoDescription: { type: String },
    todoStatus: { type: String, enum: ['Pending', 'Complete'], required: true, default: "Pending" },
    todoCreationDate: { type: String, required: true },
    todoTargetDate: { type: String, default: null },
    isArchived: { type: Boolean, required: true, default: false }
});
const todoSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    user: { type: String, required: true },
    todoList: [todoItemSchema]
});
const Todo = mongoose_1.default.model('Todo', todoSchema);
const TodoItem = mongoose_1.default.model('Todo Item', todoItemSchema);
exports.Todo = Todo;
exports.TodoItem = TodoItem;
