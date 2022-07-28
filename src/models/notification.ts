import mongoose from "mongoose";

interface NotificationItemInterface {
    date:Date /* Date format : .toLocaleString() */
    time:string | null, /* Date format : .toLocaleTimeString() */
    notificationParentId:string, 
    notificationParentTitle:string,
    dateCompleted:Date | null,
    alarmUsed:boolean,
    utcOffset:string,
    isArchived:boolean,
    clientSelectedDayStartTime:number,
    clientTimezoneOffset:number,
    _id:string
}
const notificationItemSchema = new mongoose.Schema<NotificationItemInterface>({
    date:{type:Date,required:true},
    time:{type:String,required:true},
    notificationParentId:{type:String,required:true},
    notificationParentTitle:{type:String,required:true},
    dateCompleted:{type:Date, default:null},
    alarmUsed:{type:Boolean,required:true},
    utcOffset:{type:String,required:true},
    isArchived:{type:Boolean,required:true,default:false},
})

interface NotificationInterface{
    userId:string, 
    user:string,
    notificationList:NotificationItemInterface[],
}
const notificationSchema = new mongoose.Schema<NotificationInterface>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    notificationList:[notificationItemSchema],
})

const Notification = mongoose.model<NotificationInterface>('Notification',notificationSchema);
const NotificationItem = mongoose.model<NotificationItemInterface>('Notification List Item',notificationItemSchema);

export {NotificationItemInterface,NotificationItem,Notification}