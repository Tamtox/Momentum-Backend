import mongoose from "mongoose";

interface HabitEntryInterface {
    date:Date /* Date format : .getTime() */
    habitEntryStatus:string,
    dateCompleted:Date | null /* Date format : .getTime() */
    habitId:string,
    _id:string
}
const habitEntrySchema = new mongoose.Schema<HabitEntryInterface>({
    date:{type:Date,required:true},
    habitId:{type:String,required:true},
    habitEntryStatus:{type:String,enum: ['Pending','Complete'],required:true,default:"Pending"},
    dateCompleted:{type:Date,default:null},
})

interface HabitsListItemInterface {
    title:string,
    time:string | null, /* Date format : .toLocaleTimeString() */
    creationDate:Date, /* Date format : .getTime() */
    weekdays:{0:boolean,1:boolean,2:boolean,3:boolean,4:boolean,5:boolean,6:boolean},
    goalId:string | null,
    goalTargetDate:Date | null, /* Date format : .getTime() */
    isArchived:boolean,
    creationUTCOffset:number,
    alarmUsed:boolean
    _id:string,
    clientCurrentWeekStartTime:number,
    clientSelectedWeekStartTime:number,
    clientTimezoneOffset:number,
}
const habitsListItemSchema = new mongoose.Schema<HabitsListItemInterface>({
    title:{type:String,required:true},
    time:{type:String,default:null},
    creationDate:{type:Date,required:true}, 
    weekdays:{0:{type:Boolean,required:true},1:{type:Boolean,required:true},2:{type:Boolean,required:true},3:{type:Boolean,required:true},4:{type:Boolean,required:true},5:{type:Boolean,required:true},6:{type:Boolean,required:true}},
    goalId:{type:String,default:null},
    goalTargetDate:{type:Date,default:null},
    isArchived:{type:Boolean,required:true,default:false},
    creationUTCOffset:{type:Number,required:true},
    alarmUsed:{type:Boolean,required:true},
})

interface HabitInterface{
    userId:string, 
    user:string,
    habitEntries:HabitEntryInterface[],
    habitList:HabitsListItemInterface[],
}
const habitSchema = new mongoose.Schema<HabitInterface>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    habitEntries:[habitEntrySchema],
    habitList:[habitsListItemSchema],
})

const Habit = mongoose.model<HabitInterface>('Habit',habitSchema);
const HabitEntry = mongoose.model<HabitEntryInterface>('Habit Entry',habitEntrySchema);
const HabitsListItem = mongoose.model<HabitsListItemInterface>('Habits List Item',habitsListItemSchema);

export {HabitEntryInterface,HabitsListItemInterface,Habit,HabitEntry,HabitsListItem};