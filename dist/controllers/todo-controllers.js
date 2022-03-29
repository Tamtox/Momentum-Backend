"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Todo, TodoItem } = require('../models/todo');
const getTodos = async (req, res, next) => {
    const userId = req.params.userId;
    let todoCluster;
    try {
        todoCluster = await Todo.findOne({ "_id": userId });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve todo data.');
    }
    // Returns an array of objects
    res.status(200).json(todoCluster.todoList);
};
const addNewTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { todoTitle, todoDescription, todoCreationDate, todoTargetDate, todoStatus } = req.body;
    const newTodoItem = new TodoItem({ todoTitle, todoDescription, todoCreationDate, todoTargetDate, todoStatus });
    try {
        await Todo.findOneAndUpdate({ _id: userId }, { $push: { todoList: newTodoItem } });
    }
    catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    res.status(201).send(newTodoItem);
};
const updateTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { todoTitle, todoDescription, todoTargetDate, todoStatus, _id } = req.body;
    try {
        await Todo.findOneAndUpdate({ _id: userId, "todoList._id": _id }, { $set: {
                "todoList.$.todoTitle": todoTitle,
                "todoList.$.todoDescription": todoDescription,
                "todoList.$.todoTargetDate": todoTargetDate,
                "todoList.$.todoStatus": todoStatus
            } });
    }
    catch (error) {
        return res.status(500).send('Failed to update todo.');
    }
    res.status(200).send("Successfully updated todo");
};
const deleteTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Todo.findOneAndUpdate({ _id: userId }, { $pull: { todoList: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send('Failed to delete todo.');
    }
    res.status(200).send("Successfully deleted todo");
};
exports.getTodos = getTodos;
exports.addNewTodo = addNewTodo;
exports.updateTodo = updateTodo;
exports.deleteTodo = deleteTodo;
