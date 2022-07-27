import { RequestHandler } from "express";
import { NotificationItemInterface } from "../models/notification";
const {Notification,NotificationItem,NotificationItemInterface} = require('../models/notification');

const getNotifications:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as NotificationItemInterface;
    let notificationCluster;
    // Retreives notifications for today and tomorrow
    try{
        notificationCluster = await Notification.findOne({userId:userId},{notificationList:{$filter:{input:"$notificationList",as:"listItem",cond:{$and:[{$gte:["$$listItem.date",clientSelectedDayStartTime]},{$lt:["$$listItem.date",new Date(clientSelectedDayStartTime + 86400000)]}]}}}});
    } catch(error) {
        res.status(500).send("Failed to retrieve notifications.")
    }
    res.status(200).json({notificationList:notificationCluster.notificationList});
}

const addNotification = async (notification:NotificationItemInterface,userId:string) => {
    const {date,time,notificationParentId,notificationParentTitle,dateCompleted,alarmUsed,utcOffset} = notification;
    // Add notification if todo has target date
    const newNotification = new NotificationItem({
        date:date,
        time: time,
        notificationParentId:notificationParentId, 
        notificationParentTitle:notificationParentTitle,
        dateCompleted:null,
        alarmUsed:alarmUsed,
        utcOffset:utcOffset,   
    })
    try {
        await Notification.findOneAndUpdate({userId:userId},{$push:{notificationList:newNotification}})
    } catch (error) {
        return null;
    }
    return newNotification;
}

const updateNotification = async (notification:NotificationItemInterface,userId:string) => {
    const {date,time,dateCompleted,alarmUsed,_id} = notification;
    try {
        await Notification.findOneAndUpdate(
            {userId:userId,"notificationList._id":_id},
            {$set:{
                "notificationList.$.date":date,
                "notificationList.$.time":time,
                "notificationList.$.alarmUsed":alarmUsed,
                "notificationList.$.dateCompleted":dateCompleted,
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
        res.status(500).send("Failed to update notification.")
    }
    return true;
}

const deleteNotification = async (_id:string,userId:string) => {
    // Delete notification
    try {
        await Notification.findOneAndUpdate({userId:userId},{$pull:{notificationList:{"notificationParentId":_id}}},)
    } catch (error) {
        return false;
    }
    return true;
}

export {getNotifications,addNotification,updateNotification,updateNotificationStatus,deleteNotification};