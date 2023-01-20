"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const todo_controllers_1 = require("../controllers/todo-controllers");
const user_controllers_1 = require("../controllers/user-controllers");
const auth_check_1 = require("../middleware/auth-check");
router.get('/getTodos', auth_check_1.authCheck, user_controllers_1.lastOnline, todo_controllers_1.getTodos);
router.get('/getArchivedTodos', auth_check_1.authCheck, user_controllers_1.lastOnline, todo_controllers_1.getArchivedTodos);
router.post('/addNewTodo', auth_check_1.authCheck, user_controllers_1.lastOnline, todo_controllers_1.addNewTodo);
router.patch('/updateTodo', auth_check_1.authCheck, user_controllers_1.lastOnline, todo_controllers_1.updateTodo);
router.delete('/deleteTodo', auth_check_1.authCheck, user_controllers_1.lastOnline, todo_controllers_1.deleteTodo);
module.exports = router;
//# sourceMappingURL=todo-routes.js.map