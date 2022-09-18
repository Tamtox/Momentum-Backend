import { RequestHandler } from "express";
import { GoalItemInterface } from "../models/goal";
const {Goal,GoalItem,GoalItemInterface} = require('../models/goal');
const {Schedule} = require('../models/schedule');
const {createPairedScheduleItem,updatePairedScheduleItem,deletePairedScheduleItem} = require('./schedule-controllers');

const getGoals:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let goalCluster
    try {
        goalCluster = await Goal.findOne({userId:userId},{goalList:{$filter:{input:"$goalList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
    } catch (error) {
        return res.status(500).send('Failed to retrieve goal data.')
    }
    // Returns an array of objects
    res.status(200).send(goalCluster.goalList)
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
    res.status(200).send(goalCluster.goalList);
}

const addNewGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,creationDate,targetDate,status,creationUTCOffset,alarmUsed} = req.body as GoalItemInterface;
    const newGoalItem = new GoalItem({title,creationDate,targetDate,status,creationUTCOffset,alarmUsed});
    const scheduleItem = createPairedScheduleItem(null,targetDate,title,'goal',alarmUsed,creationUTCOffset,newGoalItem._id,userId);
    try {
        await Goal.findOneAndUpdate({userId:userId},{$push:{goalList:newGoalItem}});
        targetDate && await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:scheduleItem}});
    } catch (error) {
        return res.status(500).send('Failed to add new goal.');
    }
    // Returns an object
    res.status(200).json({newGoalItem,scheduleItem});
}

const updateGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,targetDate,status,dateCompleted,habitId,_id,isArchived,alarmUsed} = req.body as GoalItemInterface;
    let scheduleItem = null;
    try {
        await Goal.findOneAndUpdate(
            {userId:userId,"goalList._id":_id},
            {$set:{
                "goalList.$.title":title,
                "goalList.$.targetDate":targetDate,
                "goalList.$.status":status,
                "goalList.$.dateCompleted":dateCompleted,
                "goalList.$.habitId":habitId,
                "goalList.$.isArchived":isArchived,
                "goalList.$.alarmUsed":alarmUsed,
            }}
        );
         // Update schedule item
        if(targetDate) {
            scheduleItem = updatePairedScheduleItem(null,targetDate,title,alarmUsed,isArchived,_id,userId);
            if(!scheduleItem) {
                return res.status(500).send('Failed to update goal schedule item.');
            }
        } else {
            await Schedule.updateMany({userId:userId},{$pull:{scheduleList:{"parentId":_id}}},{"multi": true});
        }
    } catch (error) {
        return res.status(500).send('Failed to update goal.');
    }
    res.status(200).send("Successfully updated goal");
}

const deleteGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {_id} = req.body as {_id:string}
    try {
        await Goal.findOneAndUpdate({userId:userId},{$pull:{goalList:{"_id":_id}}});
        await Schedule.updateMany({userId:userId},{$pull:{scheduleList:{"parentId":_id}}},{"multi": true});
    } catch (error) {
        return res.status(500).send("Failed to delete goal.");
    }
    res.status(200).send("Successfully deleted goal");
}

export {getGoals,getArchivedGoals,addNewGoal,updateGoal,deleteGoal}
