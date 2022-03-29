"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getTodos, addNewTodo, updateTodo, deleteTodo } = require('../controllers/todo-controllers');
const { authCheck } = require('../middleware/auth-check');
router.get('/getTodos', authCheck, getTodos);
router.post('/addNewTodo', authCheck, addNewTodo);
router.patch('/updateTodo', authCheck, updateTodo);
router.delete('/deleteTodo', authCheck, deleteTodo);
module.exports = router;
