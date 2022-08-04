"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTodo = exports.updateTodo = exports.addNewTodo = exports.getArchivedTodos = exports.getTodos = void 0;
const { Todo, TodoItem } = require('../models/todo');
const { Notification, NotificationItem } = require('../models/notification');
const getTodos = async (req, res, next) => {
    const userId = req.params.userId;
    let todoCluster;
    try {
        todoCluster = await Todo.findOne({ userId: userId }, { todoList: { $filter: { input: "$todoList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve todo data.');
    }
    // Returns an array of objects
    res.status(200).json(todoCluster.todoList);
};
exports.getTodos = getTodos;
const getArchivedTodos = async (req, res, next) => {
    const userId = req.params.userId;
    let todoCluster;
    try {
        todoCluster = await Todo.findOne({ userId: userId }, { todoList: { $filter: { input: "$todoList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve todo data.');
    }
    // Returns an array of objects
    res.status(200).json(todoCluster.todoList);
};
exports.getArchivedTodos = getArchivedTodos;
const addNewTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, description, creationDate, targetDate, status, creationUTCOffset, alarmUsed } = req.body;
    const newTodoItem = new TodoItem({ title, description, creationDate, targetDate, status, creationUTCOffset });
    try {
        await Todo.findOneAndUpdate({ userId: userId }, { $push: { todoList: newTodoItem } });
    }
    catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    // Add notification
    let notification = null;
    if (targetDate) {
        notification = new NotificationItem({
            date: targetDate,
            time: null,
            notificationParentId: newTodoItem._id,
            notificationParentTitle: title,
            dateCompleted: null,
            alarmUsed: alarmUsed,
            utcOffset: creationUTCOffset
        });
        try {
            await Notification.findOneAndUpdate({ userId: userId }, { $push: { notificationList: notification } });
        }
        catch (error) {
            return res.status(500).send('Failed to add new todo notification.');
        }
    }
    res.status(201).json({ newTodoItem, notification });
};
exports.addNewTodo = addNewTodo;
const updateTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, description, targetDate, status, dateCompleted, _id, isArchived, alarmUsed } = req.body;
    try {
        await Todo.findOneAndUpdate({ userId: userId, "todoList._id": _id }, { $set: {
                "todoList.$.title": title,
                "todoList.$.description": description,
                "todoList.$.targetDate": targetDate,
                "todoList.$.status": status,
                "todoList.$.dateCompleted": dateCompleted,
                "todoList.$.alarmUsed": alarmUsed,
                "todoList.$.isArchived": isArchived,
            } });
    }
    catch (error) {
        return res.status(500).send('Failed to update todo.');
    }
    // Update notification
    if (targetDate) {
        try {
            await Notification.findOneAndUpdate({ userId: userId, "notificationList._id": _id }, { $set: {
                    "notificationList.$.date": targetDate,
                    "notificationList.$.alarmUsed": alarmUsed,
                } });
        }
        catch (error) {
            return res.status(500).send('Failed to update todo notification.');
        }
    }
    res.status(200).send("Successfully updated todo");
};
exports.updateTodo = updateTodo;
const deleteTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Todo.findOneAndUpdate({ userId: userId }, { $pull: { todoList: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send('Failed to delete todo.');
    }
    // Delete notification
    try {
        await Notification.findOneAndUpdate({ userId: userId }, { $pull: { notificationList: { "notificationParentId": _id } } });
    }
    catch (error) {
        return res.status(500).send('Failed to delete todo notification.');
    }
    res.status(200).send("Successfully deleted todo");
};
exports.deleteTodo = deleteTodo;
