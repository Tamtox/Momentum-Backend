import mongoose from "mongoose";

export interface GoalItemInterface {
    title:string,
    creationDate:Date, /* Date format : Date.toISOString() */
    targetDate:Date | null, /* Date format : Date.toISOString() */
    targetTime:string | null, /* Date format : .toLocaleTimeString() */
    status:string,
    dateCompleted:Date | null, /* Date format : Date.toISOString() */
    habitId:string | null,
    isArchived:boolean,
    creationUTCOffset:number,
    alarmUsed:boolean,
    _id:string
}
const goalItemSchema = new mongoose.Schema<GoalItemInterface>({
    title:{type:String,required:true},
    creationDate:{type:Date,required:true},
    targetDate:{type:Date,default:null},
    targetTime:{type:String,default:null,required:false},
    status:{type:String,enum: ['Pending','Complete'],required:true,default:"Pending"},
    dateCompleted:{type:Date,default:null},
    habitId:{type:String,default:null},
    isArchived:{type:Boolean,required:true,default:false},
    creationUTCOffset:{type:Number,required:true}, 
    alarmUsed:{type:Boolean,required:true},
})

interface GoalInterface{
    userId:string, 
    user:string,
    goalList:GoalItemInterface[],
}
const goalSchema = new mongoose.Schema<GoalInterface>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    goalList:[goalItemSchema],
})

const Goal = mongoose.model<GoalInterface>('Goal',goalSchema);
const GoalItem = mongoose.model<GoalItemInterface>('Goal Item',goalItemSchema);

export {GoalInterface,Goal,GoalItem};