import { RequestHandler } from "express";
import { ScheduleItem, ScheduleItemInterface } from "../models/schedule";
import { Todo,TodoItem,TodoItemInterface } from "../models/todo";
import { addPairedScheduleItem, updatePairedScheduleItem,deletePairedScheduleItem } from "./schedule-controllers";


const getTodos:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let todoCluster
    try {
        todoCluster = await Todo.findOne({userId:userId},{todoList:{$filter:{input:"$todoList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve todo data.')
    }   
    // Returns an array of objects
    res.status(200).json(todoCluster!.todoList);
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
    res.status(200).json(todoCluster!.todoList);
}

const addNewTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,description,creationDate,targetDate,targetTime,status,creationUTCOffset,alarmUsed} = req.body as TodoItemInterface;
    const newTodoItem = new TodoItem({title,description,creationDate,targetDate,targetTime,status,creationUTCOffset,alarmUsed});
    let scheduleItem:ScheduleItemInterface | boolean = true;
    try {
        await Todo.findOneAndUpdate({userId:userId},{$push:{todoList:newTodoItem}});
        // Add paired schedule item
        scheduleItem = await addPairedScheduleItem(targetTime,targetDate,title,'todo',alarmUsed,creationUTCOffset,newTodoItem._id,userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to add new todo.');
    }
    const response = {todoId:newTodoItem._id,scheduleId:""}
    if (scheduleItem !== true) {
        response.scheduleId = scheduleItem._id
    }
    res.status(200).json(response);
}

const updateTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,description,targetDate,targetTime,status,dateCompleted,_id,isArchived,alarmUsed,creationUTCOffset} = req.body as TodoItemInterface;
    let scheduleItem:ScheduleItemInterface | boolean;
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
        scheduleItem = await updatePairedScheduleItem(targetTime,targetDate,title,"todo",alarmUsed,creationUTCOffset,isArchived,dateCompleted,status,_id,userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to update todo.');
    }
    if(scheduleItem !== true) {
        res.status(200).json({scheduleId:scheduleItem._id});
    } else {
        res.status(200).send("Successfully updated todo.");
    }
}

const deleteTodo:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    try {
        await Todo.findOneAndUpdate({userId:userId},{$pull:{todoList:{"_id":_id}}},);
        // Delete paired schedule item
        const scheduleRes:boolean = await deletePairedScheduleItem(userId,_id);
        if (!scheduleRes) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to delete todo.');
    }
    res.status(200).send("Successfully deleted todo")
}

export {getTodos,getArchivedTodos,addNewTodo,updateTodo,deleteTodo}