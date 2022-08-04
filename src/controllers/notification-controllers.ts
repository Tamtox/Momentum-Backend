import { RequestHandler } from "express";
import { NotificationItemInterface } from "../models/notification";
const {Notification,NotificationItem,NotificationItemInterface} = require('../models/notification');

// Get day start and end of selected day
const getDate = (clientDayStartTime:number,timezoneOffset:number) => {
    const utcDayStartMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
    const clientDayStart = new Date(clientDayStartTime);
    const clientNextDayStart = new Date(clientDayStartTime + 86400000);
    return {utcDayStartMidDay,clientDayStart,clientNextDayStart};
}

const getNotifications:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as NotificationItemInterface;
    const {clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
    let notificationCluster;
    // Retreives notifications for today and tomorrow
    try{
        notificationCluster = await Notification.findOne({userId:userId},{notificationList:{$filter:{input:"$notificationList",as:"listItem",cond:{$and:[{$gte:["$$listItem.date",clientDayStart]},{$lt:["$$listItem.date",clientNextDayStart]}]}}}});
    } catch(error) {
        res.status(500).send("Failed to retrieve notifications.")
    }
    res.status(200).json({notificationList:notificationCluster.notificationList});
}

const addNotification = async (title:string,targetDate:string,time:string|null,alarmUsed:boolean,creationUTCOffset:number,_id:string,userId:string) => {
    let notification =  new NotificationItem({
        date:targetDate,
        time:time,
        notificationParentId:_id,
        notificationParentTitle:title,
        dateCompleted:null,
        alarmUsed:alarmUsed,
        utcOffset:creationUTCOffset
    })
    try {
        await Notification.findOneAndUpdate({userId:userId},{$push:{notificationList:notification}})
    } catch (error) {
        return false;
    }
    return notification;
}

const updateNotification = async (title:string,targetDate:string,time:string|null,alarmUsed:boolean,_id:string,userId:string) => {
    try {
        await Notification.findOneAndUpdate(
            {userId:userId,"notificationList.notificationParentId":_id},
            {$set:{
                "notificationList.$.parentTitle":title,
                "notificationList.$.time":time,
                "notificationList.$.date":targetDate,
                "notificationList.$.alarmUsed":alarmUsed,
            }}
        )
    } catch (error) {
        return false;
    }
    return true;
}

const updateNotificationStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id,dateCompleted} = req.body as NotificationItemInterface;
    try {
        await Notification.findOneAndUpdate(
            {userId:userId,"notificationList._id":_id},
            {$set:{
                "notificationList.$.dateCompleted":dateCompleted,
            }}
        )
    } catch (error) {
        return res.status(500).send("Failed to update notification.");
    }
    res.status(200).send("Successfully updated notification");
}

const deleteNotification = async (_id:string,userId:string) => {
    try {
        await Notification.findOneAndUpdate({userId:userId},{$pull:{notificationList:{"notificationParentId":_id}}},)
    } catch (error) {
        return false;
    }
    return true;
}

export {getNotifications,addNotification,updateNotification,updateNotificationStatus,deleteNotification};