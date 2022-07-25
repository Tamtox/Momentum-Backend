"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getTodos, getArchivedTodos, addNewTodo, updateTodo, deleteTodo } = require('../controllers/todo-controllers');
const { lastOnline } = require('../controllers/user-controllers');
const { authCheck } = require('../middleware/auth-check');
router.get('/getTodos', authCheck, lastOnline, getTodos);
router.get('/getArchivedTodos', authCheck, lastOnline, getArchivedTodos);
router.post('/addNewTodo', authCheck, lastOnline, addNewTodo);
router.patch('/updateTodo', authCheck, lastOnline, updateTodo);
router.delete('/deleteTodo', authCheck, lastOnline, deleteTodo);
module.exports = router;
