import { RequestHandler } from "express";
import { NotificationItemInterface } from "../models/notification";
const {Notification,NotificationItem,NotificationItemInterface} = require('../models/notification');

// Get day start and end of selected day
const getDate = (clientDayStartTime:number,timezoneOffset:number) => {
    const utcDayStartMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
    const clientDayStart = new Date(clientDayStartTime);
    const clientNextDayStart = new Date(clientDayStartTime + 86400000 * 2);
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

export {getNotifications,updateNotificationStatus};