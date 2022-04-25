import express from "express";
const router = express.Router();
const {getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo} = require('../controllers/todo-controllers');
const {authCheck} = require('../middleware/auth-check');

router.get('/getTodos',authCheck,getTodos)

router.get('/getArchivedTodos',authCheck,getArchivedTodos)

router.post('/addNewTodo',authCheck,addNewTodo)

router.patch('/updateTodo',authCheck,updateTodo)

router.delete('/deleteTodo',authCheck,deleteTodo)

module.exports = router 