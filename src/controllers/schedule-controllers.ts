import { RequestHandler } from "express";
import { ScheduleItemInterface } from "../models/schedule";
const {Schedule,ScheduleItem,ScheduleItemInterface} = require('../models/schedule');

// Get day start and end of selected day
const getDate = (clientDayStartTime:number,timezoneOffset:number) => {
    const utcDayStartMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
    const clientDayStart = new Date(clientDayStartTime);
    const clientNextDayStart = new Date(clientDayStartTime + 86400000);
    return {utcDayStartMidDay,clientDayStart,clientNextDayStart};
}

const getSchedule:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as ScheduleItemInterface;
    const {clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
    let scheduleCluster;
    // Retreives schedule for selected day
    try{
        scheduleCluster = await Schedule.findOne({userId:userId},{scheduleList:{$filter:{input:"$scheduleList",as:"listItem",cond:{$and:[{$gte:["$$listItem.date",clientDayStart]},{$lt:["$$listItem.date",clientNextDayStart]}]}}}});
    } catch(error) {
        res.status(500).send("Failed to retrieve schedule.")
    }
    res.status(200).json({scheduleList:scheduleCluster.scheduleList});
}

const addScheduleItem = async (title:string,targetDate:string,alarmUsed:boolean,creationUTCOffset:number,_id:string,userId:string) => {
    let scheduleItem =  new ScheduleItem({
        date:targetDate,
        parentId:_id,
        parentTitle:title,
        dateCompleted:null,
        alarmUsed:alarmUsed,
        utcOffset:creationUTCOffset
    })
    try {
        await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:scheduleItem}})
    } catch (error) {
        return false;
    }
    return scheduleItem;
}

const updateScheduleItem = async (title:string,targetDate:string,alarmUsed:boolean,_id:string,userId:string) => {
    try {
        await Schedule.findOneAndUpdate(
            {userId:userId,"scheduleList.parentId":_id},
            {$set:{
                "scheduleList.$.parentTitle":title,
                "scheduleList.$.date":targetDate,
                "scheduleList.$.alarmUsed":alarmUsed,
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
    try {
        await Schedule.findOneAndUpdate(
            {userId:userId,"scheduleList._id":_id},
            {$set:{
                "scheduleList.$.dateCompleted":dateCompleted,
            }}
        )
    } catch (error) {
        return res.status(500).send("Failed to update schedule.");
    }
    res.status(200).send("Successfully updated schedule");
}

const deleteScheduleItem = async (_id:string,userId:string) => {
    try {
        await Schedule.findOneAndUpdate({userId:userId},{$pull:{scheduleList:{"parentId":_id}}},)
    } catch (error) {
        return false;
    }
    return true;
}

export {getSchedule,addScheduleItem,updateScheduleItem,updateScheduleItemStatus,deleteScheduleItem};