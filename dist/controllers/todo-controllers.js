"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTodo = exports.updateTodo = exports.addNewTodo = exports.getArchivedTodos = exports.getTodos = void 0;
const todo_1 = require("../models/todo");
const schedule_controllers_1 = require("./schedule-controllers");
const getTodos = async (req, res, next) => {
    const userId = req.params.userId;
    let todoCluster;
    try {
        todoCluster = await todo_1.Todo.findOne({ userId: userId }, { todoList: { $filter: { input: "$todoList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
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
        todoCluster = await todo_1.Todo.findOne({ userId: userId }, { todoList: { $filter: { input: "$todoList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
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
    const { title, description, creationDate, targetDate, targetTime, status, creationUTCOffset, alarmUsed } = req.body;
    const newTodoItem = new todo_1.TodoItem({ title, description, creationDate, targetDate, targetTime, status, creationUTCOffset, alarmUsed });
    let scheduleItem = true;
    try {
        await todo_1.Todo.findOneAndUpdate({ userId: userId }, { $push: { todoList: newTodoItem } });
        // Add paired schedule item
        scheduleItem = await (0, schedule_controllers_1.addPairedScheduleItem)(targetTime, targetDate, title, 'todo', alarmUsed, creationUTCOffset, newTodoItem._id, userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    const response = { todoId: newTodoItem._id, scheduleId: "" };
    if (scheduleItem !== true) {
        response.scheduleId = scheduleItem._id;
    }
    res.status(200).json(response);
};
exports.addNewTodo = addNewTodo;
const updateTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, description, targetDate, targetTime, status, dateCompleted, _id, isArchived, alarmUsed, creationUTCOffset } = req.body;
    let scheduleItem;
    try {
        await todo_1.Todo.findOneAndUpdate({ userId: userId, "todoList._id": _id }, { $set: {
                "todoList.$.title": title,
                "todoList.$.description": description,
                "todoList.$.targetDate": targetDate,
                "todoList.$.targetTime": targetTime,
                "todoList.$.status": status,
                "todoList.$.dateCompleted": dateCompleted,
                "todoList.$.alarmUsed": alarmUsed,
                "todoList.$.isArchived": isArchived,
            } });
        scheduleItem = await (0, schedule_controllers_1.updatePairedScheduleItem)(targetTime, targetDate, title, "todo", alarmUsed, creationUTCOffset, isArchived, dateCompleted, status, _id, userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send('Failed to update todo.');
    }
    if (scheduleItem !== true) {
        res.status(200).json({ scheduleId: scheduleItem._id });
    }
    else {
        res.status(200).send("Successfully updated todo.");
    }
};
exports.updateTodo = updateTodo;
const deleteTodo = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await todo_1.Todo.findOneAndUpdate({ userId: userId }, { $pull: { todoList: { "_id": _id } } });
        // Delete paired schedule item
        const scheduleRes = await (0, schedule_controllers_1.deletePairedScheduleItem)(userId, _id);
        if (!scheduleRes) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send('Failed to delete todo.');
    }
    res.status(200).send("Successfully deleted todo");
};
exports.deleteTodo = deleteTodo;
//# sourceMappingURL=todo-controllers.js.map