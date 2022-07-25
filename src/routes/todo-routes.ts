import express from "express";
const router = express.Router();
const {getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo} = require('../controllers/todo-controllers');
const {lastOnline} = require('../controllers/user-controllers');
const {authCheck} = require('../middleware/auth-check');

router.get('/getTodos',authCheck,lastOnline,getTodos)

router.get('/getArchivedTodos',authCheck,lastOnline,getArchivedTodos)

router.post('/addNewTodo',authCheck,lastOnline,addNewTodo)

router.patch('/updateTodo',authCheck,lastOnline,updateTodo)

router.delete('/deleteTodo',authCheck,lastOnline,deleteTodo)

module.exports = router 