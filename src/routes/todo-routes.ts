import express from "express";
const router = express.Router();
import { getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo } from "../controllers/todo-controllers";
import { lastOnline } from "../controllers/user-controllers";
import { authCheck } from "../middleware/auth-check";

router.get('/getTodos',authCheck,lastOnline,getTodos)
router.get('/getArchivedTodos',authCheck,lastOnline,getArchivedTodos)
router.post('/addNewTodo',authCheck,lastOnline,addNewTodo)
router.patch('/updateTodo',authCheck,lastOnline,updateTodo)
router.delete('/deleteTodo',authCheck,lastOnline,deleteTodo)

module.exports = router 