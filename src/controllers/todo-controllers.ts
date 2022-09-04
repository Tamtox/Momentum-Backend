import {RequestHandler} from "express";
import { TodoItemInterface } from "../models/todo";
const {Todo,TodoItem} = require('../models/todo');
const {addPairedScheduleItem,updatePairedScheduleItem,deletePairedScheduleItem} = require('./schedule-controllers');


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
    const {title,description,creationDate,targetDate,targetTime,status,creationUTCOffset,alarmUsed} = req.body as TodoItemInterface;
    const newTodoItem = new TodoItem({title,description,creationDate,targetDate,targetTime,status,creationUTCOffset});
    let scheduleItem = null;
    try {
        await Todo.findOneAndUpdate({userId:userId},{$push:{todoList:newTodoItem}});
        // Add schedule item
        if(targetDate) {
            scheduleItem = await addPairedScheduleItem(title,targetTime,'todo',targetDate,alarmUsed,creationUTCOffset,newTodoItem._id,userId);
            if(scheduleItem === false) {
                return res.status(500).send('Failed to add new todo schedule item.');
            }
        }
    } catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    res.status(201).json({newTodoItem,scheduleItem});
}

const updateTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,description,targetDate,targetTime,status,dateCompleted,_id,isArchived,alarmUsed} = req.body as TodoItemInterface;
    let scheduleItem = null;
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
        // Update schedule item
        if(targetDate) {
            scheduleItem = updatePairedScheduleItem(title,targetTime,targetDate,alarmUsed,isArchived,_id,userId);
            if(!scheduleItem) {
                return res.status(500).send('Failed to update todo schedule item.');
            }
        } else {
            const scheduleItemDelete = await deletePairedScheduleItem(_id,userId);
            if(scheduleItemDelete === false) {
                return res.status(500).send('Failed to update todo schedule item.');
            }
        }
    } catch (error) {
        return res.status(500).send('Failed to update todo.');
    }
    res.status(200).send("Successfully updated todo")
}

const deleteTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    try {
        await Todo.findOneAndUpdate({userId:userId},{$pull:{todoList:{"_id":_id}}},);
        // Delete schedule item
        const scheduleItemDelete = await deletePairedScheduleItem(_id,userId);
        if(!scheduleItemDelete) {
            return res.status(500).send('Failed to delete todo schedule item.');
        }
    } catch (error) {
        return res.status(500).send('Failed to delete todo.');
    }
    res.status(200).send("Successfully deleted todo")
}

export {getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo}