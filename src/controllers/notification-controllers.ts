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

const addNotification:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {date,time,notificationParentId,notificationParentTitle,dateCompleted,alarmUsed,utcOffset,clientSelectedDayStartTime,clientTimezoneOffset} = req.body as NotificationItemInterface;
    // Add notification if todo has target date
    // const newTodoNotification = new NotificationItem({
    //     date:todoTargetDate,
    //     time: new Date(todoTargetDate).toLocaleTimeString("en-GB"),
    //     notificationParentId:newTodoItem._id, 
    //     notificationParentTitle:todoTitle,
    //     dateCompleted:null,
    //     alarmUsed:alarmUsed,
    //     utcOffset:creationUTCOffset,   
    // })
    // try {
    //     await Notification.findOneAndUpdate({userId:userId},{$push:{notificationList:newTodoNotification}})
    // } catch (error) {
    //     return res.status(500).send('Failed to add new todo.')
    // }
}

const updateNotification:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {date,time,notificationParentId,notificationParentTitle,dateCompleted,alarmUsed,clientSelectedDayStartTime,clientTimezoneOffset} = req.body as NotificationItemInterface;
    // // Update todo notification
    // if(todoTargetDate) {
    //     try {
    //         await Notification.findOneAndUpdate(
    //             {userId:userId,"notificationList.notificationParentId":_id},
    //             {$set:{
    //                 "notificationList.$.date":todoTargetDate,
    //                 "notificationList.$.time":new Date(todoTargetDate).toLocaleTimeString("en-GB"),
    //                 "notificationList.$.notificationParentTitle":todoTitle,
    //                 "notificationList.$.alarmUsed":alarmUsed,
    //             }}
    //         )
    //     } catch (error) {
    //         return res.status(500).send('Failed to update todo.')
    //     }
    // }
}

const updateNotificationStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {dateCompleted,_id} = req.body as NotificationItemInterface;
    try {
        await Notification.findOneAndUpdate(
            {userId:userId,"notificationList._id":_id},
            {$set:{
                "notificationList.$.dateCompleted":dateCompleted,
            }}
        )
    } catch (error) {
        return res.status(500).send('Failed to update todo.')
    }
    res.status(200).send("Successfully updated notification");
}

const deleteNotification:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    // Delete notification
    try {
        await Notification.findOneAndUpdate({userId:userId},{$pull:{notificationList:{"notificationParentId":_id}}},)
    } catch (error) {
        return res.status(500).send('Failed to delete notification.')
    }
    res.status(200).send("Successfully deleted notification")
}

export {getNotifications,addNotification,updateNotification,updateNotificationStatus,deleteNotification};