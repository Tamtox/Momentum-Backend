import mongoose from "mongoose";

interface ScheduleItemInterface {
    date:Date /* Date format : .toLocaleString() */
    time:string|null,
    parentId:string, 
    parentTitle:string,
    parentType:string,
    dateCompleted:Date | null,
    alarmUsed:boolean,
    utcOffset:string,
    isArchived:boolean,
    clientSelectedDayStartTime:number,
    clientTimezoneOffset:number,
    _id:string
}
const scheduleItemSchema = new mongoose.Schema<ScheduleItemInterface>({
    date:{type:Date,required:true},
    time:{type:String,required:false,default:null},
    parentId:{type:String,required:true},
    parentTitle:{type:String,required:true},
    parentType:{type:String,required:true},
    dateCompleted:{type:Date, default:null},
    alarmUsed:{type:Boolean,required:true},
    utcOffset:{type:String,required:true},
    isArchived:{type:Boolean,required:true,default:false},
})

interface ScheduleInterface{
    userId:string, 
    user:string,
    scheduleList:ScheduleItemInterface[],
}
const scheduleSchema = new mongoose.Schema<ScheduleInterface>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    scheduleList:[scheduleItemSchema],
})

const Schedule = mongoose.model<ScheduleInterface>('Schedule',scheduleSchema);
const ScheduleItem = mongoose.model<ScheduleItemInterface>('Schedule List Item',scheduleItemSchema);

export {ScheduleItemInterface,ScheduleItem,Schedule}