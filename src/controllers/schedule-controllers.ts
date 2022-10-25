import { RequestHandler } from "express";
import { ScheduleItemInterface } from "../models/schedule";
import { HabitsListItemInterface } from "../models/habit";
import { TodoItemInterface } from "../models/todo";
import { GoalItemInterface } from "../models/goal";
const {Schedule,ScheduleItem} = require('../models/schedule');
const {Habit} = require('../models/habit');

// Generate new schedule items for habits
const generateHabitSchedule = (habitList:HabitsListItemInterface[],existingSchedule:ScheduleItemInterface[],date:number) => {
    const habitSchedule:ScheduleItemInterface[] = existingSchedule.filter((scheduleItem:ScheduleItemInterface)=>scheduleItem.parentType === 'habit');
    const newScheduleItems:ScheduleItemInterface[] = [];
    habitList.forEach((habitItem:any) => {
        const habitExists:ScheduleItemInterface|undefined = habitSchedule.find((item:ScheduleItemInterface) => item.parentId === habitItem.id);
        // Check if habit weekday is active
        const isWeekday = habitItem.weekdays[new Date(date).getDay()];
        // Check if goal target date reached
        const habitGoalTargetReached:boolean = habitItem.goalTargetDate ? new Date(date).getTime() > new Date(habitItem.goalTargetDate).getTime() : false;
        // Check habit creation date
        const afterCreationDate:boolean = new Date(date).getTime() > new Date(habitItem.creationDate).getTime();
        if(!habitExists && isWeekday && !habitGoalTargetReached && afterCreationDate) {
            const newScheduleItem:ScheduleItemInterface = new ScheduleItem({
                date:new Date(date),
                time:habitItem.time,
                parentId:habitItem._id,
                parentTitle:habitItem.title,
                parentType:'habit',
                status:"Pending",
                dateCompleted:null,
                alarmUsed:habitItem.alarmUsed,
                utcOffset:habitItem.creationUTCOffset,
                isArchived:false,
            })
            newScheduleItems.push(newScheduleItem);
        }
    })
    return newScheduleItems;
}

// Get day start and end of selected day
const getDate = (clientDayStartTime:number,timezoneOffset:number) => {
    const utcDayStartMidDay:number = new Date(clientDayStartTime + timezoneOffset * - 60000).setHours(12,0,0,0);
    const clientDayStart:Date = new Date(clientDayStartTime);
    const clientNextDayStart:Date = new Date(clientDayStartTime + 86400000);
    return {utcDayStartMidDay,clientDayStart,clientNextDayStart};
}

const getSchedule:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as ScheduleItemInterface;
    const {utcDayStartMidDay,clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
    let scheduleCluster;
    let habitListCluster;
    // Retreives schedule for selected day
    try{
        scheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$filter:{input:"$scheduleList",as:"item",cond:{$and:[{$gte:["$$item.date",clientDayStart]},{$lt:["$$item.date",clientNextDayStart]},{$eq:["$$item.isArchived",false]}]}}}});
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$and:[{$lt:["$$item.creationDate",clientDayStart]},{$lt:["$$item.goalTargetDate",clientNextDayStart]},{$eq:["$$item.isArchived",false]}]}}}});
    } catch(error) {
        res.status(500).send("Failed to retrieve schedule.");
    }   
    // Generate new habit schedule entries and save them 
    const habitSchedule = generateHabitSchedule(habitListCluster.habitList,scheduleCluster.scheduleList,utcDayStartMidDay);
    try {
        await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:{$each:habitSchedule}}});
    } catch (error) {
        res.status(500).send("Failed to retrieve schedule.");
    }
    const scheduleList:ScheduleItemInterface[] = scheduleCluster.scheduleList.concat(habitSchedule);
    res.status(200).json({scheduleList});
}

const addPairedScheduleItem = async (time:string|null,targetDate:string|null,parentTitle:string,parentType:string,alarmUsed:boolean,utcOffset:number,parentId:string,userId:string) => {
    if (parentType === "habit") {
        
    } else {
        if (targetDate) {
            const {utcDayStartMidDay:date} = getDate(new Date(targetDate).getTime(),utcOffset);
            let scheduleItem:any =  new ScheduleItem({date,time,parentId,parentTitle,parentType,alarmUsed,utcOffset});
            try{
                await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:scheduleItem}});
            } catch(error) {
                return false;
            }   
            return scheduleItem;
        }
    }
}

const updatePairedScheduleItem = async (time:string|null,date:string,parentTitle:string,alarmUsed:boolean,isArchived:boolean,parentId:string,userId:string) => {
    // Check old schedule item
    let scheduleCluster;
    try {
        scheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$elemMatch:{"parentId":parentId}}});
    } catch (error) {
        return false;
    }
    const selectedScheduleItem:ScheduleItemInterface = scheduleCluster.scheduleList[0]; 
    try {
        await Schedule.findOneAndUpdate(
            {userId:userId,"scheduleList.parentId":parentId},
            {$set:{
                "scheduleList.$.date":date,
                "scheduleList.$.time":time,
                "scheduleList.$.parentTitle":parentTitle,
                "scheduleList.$.alarmUsed":alarmUsed,
                "scheduleList.$.isArchived":isArchived,
            }}
        )
    } catch (error) {
        return false;
    }
    return true;
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