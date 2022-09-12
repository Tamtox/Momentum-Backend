import { RequestHandler } from "express";
import { ScheduleItemInterface } from "../models/schedule";
import { HabitsListItemInterface } from "../models/habit";
const {Schedule,ScheduleItem} = require('../models/schedule');
const {Habit} = require('../models/habit');

const generateHabitSchedule = (habitList:HabitsListItemInterface[],schedule:ScheduleItemInterface[],date:number) => {
    const habitSchedule:ScheduleItemInterface[] = schedule.filter((scheduleItem:ScheduleItemInterface)=>scheduleItem.parentType === 'habit');
    const newScheduleItems:ScheduleItemInterface[] = [];
    habitList.forEach((habitItem:HabitsListItemInterface) => {
        const habitIndex:number = habitSchedule.findIndex((item:ScheduleItemInterface) => item.parentId === habitItem._id);
        // Check if habit weekday is active
        const isWeekday = habitItem.weekdays[new Date(date).getDay()];
        // Check if goal target date reached
        const habitGoalTargetReached:boolean = habitItem.goalTargetDate ? new Date(date).getTime() > new Date(habitItem.goalTargetDate).getTime() : false;
        // Chekck habit creation date
        const afterCreationDate:boolean = new Date(date).getTime() > new Date(habitItem.creationDate).getTime();
        if(habitIndex < 0 && isWeekday && !habitGoalTargetReached && afterCreationDate) {
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
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$and:[{$gte:["$$item.creationDate",utcDayStartMidDay]},{$lt:["$$item.goalTargetDate",utcDayStartMidDay]},{$eq:["$$item.isArchived",false]}]}}}});
    } catch(error) {
        res.status(500).send("Failed to retrieve schedule.")
    }   
    // Generate new habit schedule entries
    const habitSchedule = generateHabitSchedule(habitListCluster.habitList,scheduleCluster.scheduleList,utcDayStartMidDay);
    console.log(habitSchedule);
    const scheduleList = scheduleCluster.scheduleList;
    res.status(200).json({scheduleList});
}

// const getScheduleItem:RequestHandler<{userId:string}> = async (req,res,next) => {
//     const userId = req.params.userId;
//     const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as ScheduleItemInterface;
//     const {clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
//     let scheduleCluster;
//     // Retreives schedule for selected day
//     try{
//         scheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$filter:{input:"$scheduleList",as:"item",cond:{$and:[{$gte:["$$item.date",clientDayStart]},{$lt:["$$item.date",clientNextDayStart]},{$eq:["$$item.isArchived",false]}]}}}});
//     } catch(error) {
//         res.status(500).send("Failed to retrieve schedule.")
//     }   
//     const scheduleList = scheduleCluster.scheduleList[0];
//     res.status(200).json({scheduleList});
// }

const addPairedScheduleItem = async (time:string|null,targetDate:string,parentTitle:string,parentType:string,alarmUsed:boolean,creationUTCOffset:number,_id:string,userId:string) => {
    const {utcDayStartMidDay} = getDate(new Date(targetDate).getTime(),creationUTCOffset);
    let scheduleItem:any =  new ScheduleItem({
        date:utcDayStartMidDay,
        time:time,
        parentId:_id,
        parentTitle:parentTitle,
        parentType:parentType,
        status:"Pending",
        dateCompleted:null,
        alarmUsed:alarmUsed,
        utcOffset:creationUTCOffset,
        isArchived:false,
    })
    try {
        await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:scheduleItem}});
    } catch (error) {
        return false;
    }
    return scheduleItem;
}

const updatePairedScheduleItem = async (time:string|null,targetDate:string,parentTitle:string,alarmUsed:boolean,isArchived:boolean,_id:string,userId:string) => {
    try {
        await Schedule.findOneAndUpdate(
            {userId:userId,"scheduleList.parentId":_id},
            {$set:{
                "scheduleList.$.date":targetDate,
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

const deletePairedScheduleItem = async (_id:string,userId:string) => {
    try {
        await Schedule.updateMany({userId:userId},{$pull:{scheduleList:{"parentId":_id}}},{"multi": true});
    } catch (error) {
        return false;
    }
    return true;
}

export { getSchedule, addPairedScheduleItem, updatePairedScheduleItem, updateScheduleItemStatus, deletePairedScheduleItem };
