import {RequestHandler} from "express";
import { TodoItemInterface } from "../models/todo";
import { ScheduleItemInterface } from "../models/schedule";
const {Schedule,ScheduleItem} = require('../models/schedule');
const {Todo,TodoItem} = require('../models/todo');
const {addPairedScheduleItem, updatePairedScheduleItem,deletePairedScheduleItem} = require("./schedule-controllers");


const getTodos:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let todoCluster
    try {
        todoCluster = await Todo.findOne({userId:userId},{todoList:{$filter:{input:"$todoList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve todo data.')
    }   
    // Returns an array of objects
    res.status(200).json(todoCluster.todoList);
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
    res.status(200).json(todoCluster.todoList);
}

const addNewTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,description,creationDate,targetDate,targetTime,status,creationUTCOffset,alarmUsed,} = req.body as TodoItemInterface;
    const newTodoItem = new TodoItem({title,description,creationDate,targetDate,targetTime,status,creationUTCOffset,alarmUsed});
    let scheduleItem = {_id:""};
    try {
        await Todo.findOneAndUpdate({userId:userId},{$push:{todoList:newTodoItem}});
        // Add paired schedule item
        scheduleItem = addPairedScheduleItem(targetTime,targetDate,title,'todo',alarmUsed,creationUTCOffset,newTodoItem._id,userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    res.status(201).json({todoId:newTodoItem._id,scheduleId:scheduleItem._id});
}

const updateTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,description,targetDate,targetTime,status,dateCompleted,_id,isArchived,alarmUsed} = req.body as TodoItemInterface;
    try {
        await Todo.findOneAndUpdate(
            {userId:userId,"todoList._id":_id},
            {$set:{
                "todoList.$.title":title,
                "todoList.$.description":description,
                "todoList.$.targetDate":targetDate,
                "todoList.$.targetTime":targetTime,
                "todoList.$.status":status,
                "todoList.$.dateCompleted":dateCompleted,
                "todoList.$.alarmUsed":alarmUsed,
                "todoList.$.isArchived":isArchived,
            }}
        )
        await updatePairedScheduleItem(targetTime,targetDate,title,alarmUsed,isArchived,_id,userId);
    } catch (error) {
        return res.status(500).send('Failed to update todo.');
        // Update paired schedule item
    }
    res.status(200).send("Successfully updated todo")
}

const deleteTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    let scheduleDelete:boolean;
    try {
        await Todo.findOneAndUpdate({userId:userId},{$pull:{todoList:{"_id":_id}}},);
        scheduleDelete = deletePairedScheduleItem(userId,_id);
        if (!scheduleDelete) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to delete todo.');
    }
    res.status(200).send("Successfully deleted todo")
}

export {getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo}