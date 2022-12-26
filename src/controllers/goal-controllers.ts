import { RequestHandler } from "express";
import { Goal,GoalItem,GoalItemInterface } from "../models/goal";
import { ScheduleItemInterface } from "../models/schedule";
import { addPairedScheduleItem, updatePairedScheduleItem,deletePairedScheduleItem } from "./schedule-controllers";

const getGoals:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let goalCluster
    try {
        goalCluster = await Goal.findOne({userId:userId},{goalList:{$filter:{input:"$goalList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve goal data.')
    }
    // Returns an array of objects
    res.status(200).send(goalCluster!.goalList)
}

const getArchivedGoals:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let goalCluster
    try {
        goalCluster = await Goal.findOne({userId:userId},{goalList:{$filter:{input:"$goalList",as:"item",cond:{$eq:["$$item.isArchived",true]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve goal data.')
    }
    // Returns an array of objects
    res.status(200).send(goalCluster!.goalList);
}

const addNewGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,creationDate,targetDate,status,creationUTCOffset,alarmUsed} = req.body as GoalItemInterface;
    const newGoalItem = new GoalItem({title,creationDate,targetDate,status,creationUTCOffset,alarmUsed});
    let scheduleItem:ScheduleItemInterface | boolean;
    try {
        await Goal.findOneAndUpdate({userId:userId},{$push:{goalList:newGoalItem}});
        // Add paired schedule item
        scheduleItem = await addPairedScheduleItem(null,targetDate,title,'goal',alarmUsed,creationUTCOffset,newGoalItem._id,userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to add new goal.');
    }
    const response = {goalId:newGoalItem._id,scheduleId:""}
    if (scheduleItem !== true) {
        response.scheduleId = scheduleItem._id
    }
    res.status(200).json(response);
}

const updateGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,targetDate,status,dateCompleted,_id,isArchived,alarmUsed,creationUTCOffset} = req.body as GoalItemInterface;
    let scheduleItem:ScheduleItemInterface | boolean;
    try {
        await Goal.findOneAndUpdate(
            {userId:userId,"goalList._id":_id},
            {$set:{
                "goalList.$.title":title,
                "goalList.$.targetDate":targetDate,
                "goalList.$.status":status,
                "goalList.$.dateCompleted":dateCompleted,
                "goalList.$.isArchived":isArchived,
                "goalList.$.alarmUsed":alarmUsed,
            }}
        );
        scheduleItem = await updatePairedScheduleItem(null,targetDate,title,"goal",alarmUsed,creationUTCOffset,isArchived,_id,userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send('Failed to update goal.');
    }
    if (scheduleItem !== true) {
        res.status(200).json({scheduleId:scheduleItem._id});
    } else {
        res.status(200).send("Successfully updated goal.");
    }
}

const deleteGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {_id} = req.body as {_id:string}
    try {
        await Goal.findOneAndUpdate({userId:userId},{$pull:{goalList:{"_id":_id}}});
        const scheduleRes:boolean = await deletePairedScheduleItem(userId,_id);
        if (!scheduleRes) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send("Failed to delete goal.");
    }
    res.status(200).send("Successfully deleted goal");
}

export {getGoals,getArchivedGoals,addNewGoal,updateGoal,deleteGoal}
