import {RequestHandler} from "express";
import { TodoItemInterface } from "../models/todo";
const {Todo,TodoItem} = require('../models/todo');
const {Schedule,ScheduleItem} = require('../models/notification');
const {addScheduleItem,updateScheduleItem,deleteScheduleItem} = require('./notification-controllers');


const getTodos:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let todoCluster
    try {
        todoCluster = await Todo.findOne({userId:userId},{todoList:{$filter:{input:"$todoList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve todo data.')
    }
    // Returns an array of objects
    res.status(200).json(todoCluster.todoList)
}

const getArchivedTodos:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let todoCluster
    try {
        todoCluster = await Todo.findOne({userId:userId},{todoList:{$filter:{input:"$todoList",as:"item",cond:{$eq:["$$item.isArchived",true]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve todo data.')
    }
    // Returns an array of objects
    res.status(200).json(todoCluster.todoList)
}

const addNewTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,description,creationDate,targetDate,status,creationUTCOffset,alarmUsed} = req.body as TodoItemInterface;
    const newTodoItem = new TodoItem({title,description,creationDate,targetDate,status,creationUTCOffset});
    try {
        await Todo.findOneAndUpdate({userId:userId},{$push:{todoList:newTodoItem}})
    } catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    // Add schedule item
    let scheduleItem = null;
    if(targetDate) {
        scheduleItem = await addScheduleItem(title,targetDate,alarmUsed,creationUTCOffset,newTodoItem._id,userId);
        if(scheduleItem === false) {
            return res.status(500).send('Failed to add new todo schedule item.');
        }
    }
    res.status(201).json({newTodoItem,scheduleItem});
}

const updateTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,description,targetDate,status,dateCompleted,_id,isArchived,alarmUsed} = req.body as TodoItemInterface;
    try {
        await Todo.findOneAndUpdate(
            {userId:userId,"todoList._id":_id},
            {$set:{
                "todoList.$.title":title,
                "todoList.$.description":description,
                "todoList.$.targetDate":targetDate,
                "todoList.$.status":status,
                "todoList.$.dateCompleted":dateCompleted,
                "todoList.$.alarmUsed":alarmUsed,
                "todoList.$.isArchived":isArchived,
            }}
        )
    } catch (error) {
        return res.status(500).send('Failed to update todo.');
    }
    // Update schedule item
    let scheduleItem = null;
    if(targetDate) {
        scheduleItem = updateScheduleItem(title,targetDate,alarmUsed,_id,userId);
        if(scheduleItem === false) {
            return res.status(500).send('Failed to update todo schedule item.');
        }
    } else {
        const scheduleItem = await deleteScheduleItem(_id,userId);
        if(scheduleItem === false) {
            return res.status(500).send('Failed to update todo schedule item.');
        }
    }
    res.status(200).send("Successfully updated todo")
}

const deleteTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    try {
        await Todo.findOneAndUpdate({userId:userId},{$pull:{todoList:{"_id":_id}}},)
    } catch (error) {
        return res.status(500).send('Failed to delete todo.')
    }
    // Delete schedule item
    try {
        await Schedule.findOneAndUpdate({userId:userId},{$pull:{notificationList:{"notificationParentId":_id}}},)
    } catch (error) {
        return res.status(500).send('Failed to delete todo schedule item.');
    }
    res.status(200).send("Successfully deleted todo")
}

export {getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo}