import { RequestHandler } from "express";
import { Schedule,ScheduleItem,ScheduleItemInterface } from "../models/schedule";
import { HabitsListItemInterface } from "../models/habit";
import { TodoItemInterface } from "../models/todo";
import { GoalItemInterface } from "../models/goal";
import { Habit } from "../models/habit";
import { getDate,createHabitEntries } from "../misc/utility-functions";


const getSchedule:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as ScheduleItemInterface;
    const {utcDayStartMidDay,utcNextDayMidDay,clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
    let scheduleCluster:any;
    // Retreives schedule for selected day
    try{
        scheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$filter:{input:"$scheduleList",as:"item",cond:{$and:[{$gte:["$$item.date",clientDayStart]},{$lt:["$$item.date",clientNextDayStart]},{$eq:["$$item.isArchived",false]}]}}}});
    } catch(error) {
        res.status(500).send("Failed to retrieve schedule.");
    }   
    const scheduleList:ScheduleItemInterface[] = scheduleCluster!.scheduleList;
    res.status(200).json({scheduleList}); 
}

const addPairedScheduleItem = async (time:string|null,targetDate:Date|string|null,parentTitle:string,parentType:string,alarmUsed:boolean,utcOffset:number,parentId:string,userId:string) => {
    if (targetDate) {
        const {utcDayStartMidDay:date} = getDate(new Date(targetDate).getTime(),Number(utcOffset));
        let scheduleItem:ScheduleItemInterface =  new ScheduleItem({date,time,parentId,parentTitle,parentType,alarmUsed,utcOffset});
        try{
            await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:scheduleItem}});
        } catch(error) {
            return false;
        }   
        return scheduleItem;
    } else {
        return true
    }
}

const updatePairedScheduleItem = async (time:string|null,targetDate:Date|string|null,parentTitle:string,parentType:string,alarmUsed:boolean,utcOffset:number,isArchived:boolean,dateCompleted:Date|null,status:string,parentId:string,userId:string) => {
    // Check old schedule item
    let scheduleCluster;
    try {
        scheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$elemMatch:{"parentId":parentId}}});
    } catch (error) {
        return false;
    }
    const selectedScheduleItem:ScheduleItemInterface | undefined = scheduleCluster!.scheduleList[0]; 
    let scheduleItemResponse:ScheduleItemInterface|string
    // Add new schedule item if there was no old item
    if (!selectedScheduleItem) {
        if (targetDate) {
            const {utcDayStartMidDay:date} = getDate(new Date(targetDate).getTime(),utcOffset);
            let scheduleItem:ScheduleItemInterface =  new ScheduleItem({date,time,parentId,parentTitle,parentType,alarmUsed,utcOffset});
            try{
                await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:scheduleItem}});
            } catch(error) {
                return false;
            }   
            return scheduleItem;
        } else {
            return true
        }
    } else {
        // Delete schedule item if no target date
        if (!targetDate) {
            try{
                await Schedule.updateMany({userId:userId},{$pull:{scheduleList:{"parentId":parentId}}},{"multi": true});
            } catch(error) {
                return false;
            }   
            return true;
        } 
        // Update schedule item
        else {
            let updatedScheduleCluster
            try {
                await Schedule.findOneAndUpdate(
                    {userId:userId,"scheduleList.parentId":parentId},
                    {$set:{
                        "scheduleList.$.date":targetDate,
                        "scheduleList.$.time":time,
                        "scheduleList.$.parentTitle":parentTitle,
                        "scheduleList.$.alarmUsed":alarmUsed,
                        "scheduleList.$.isArchived":isArchived,
                        "scheduleList.$.dateCompleted":dateCompleted,
                        "scheduleList.$.status":status,
                    }}
                )
                updatedScheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$filter:{input:"$scheduleList",as:"item",cond:{$eq:["$$item.parentId",parentId]}}}});
            } catch (error) {
                return false;
            }
            if (isArchived) {
                return true
            } else {
                // Return schedule item if it gets unarchived
                if (selectedScheduleItem.isArchived === true && isArchived === false) {
                    const updatedScheduleItem = updatedScheduleCluster!.scheduleList[0];
                    return updatedScheduleItem;
                } else {
                    return true
                }
            }
        }
    }
}

const updateScheduleItemStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id,dateCompleted} = req.body as ScheduleItemInterface;
    const status = dateCompleted ? "Complete" : "Pending";
    try {
        await Schedule.findOneAndUpdate(
            {userId:userId,"scheduleList._id":_id},
            {$set:{
                "scheduleList.$.dateCompleted":dateCompleted,
                "scheduleList.$.status":status,
            }}
        )
    } catch (error) {
        return res.status(500).send("Failed to update schedule.");
    }
    res.status(200).send("Successfully updated schedule");
}

const deletePairedScheduleItem = async (userId:string,parentId:string) => {
    try{
        await Schedule.updateMany({userId:userId},{$pull:{scheduleList:{"parentId":parentId}}},{"multi": true});
    } catch(error) {
        return false;
    }   
    return true;
}

export {getSchedule,addPairedScheduleItem,updatePairedScheduleItem,updateScheduleItemStatus,deletePairedScheduleItem};

