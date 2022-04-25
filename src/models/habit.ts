import mongoose from "mongoose";

interface HabitEntry {
    weekStart:string,  /* Date format : "day/month/year" */
    weekEnd:string, /* Date format : "day/month/year" */
    habitId:string,
    year:string, /* Date format : .getFullYear() */
    month:string, /* Date format : .getMonth() + 1 */
    date:string, /* Date format : .getDate() */
    weekday:string,
    habitEntryStatus:string
}
const habitEntrySchema = new mongoose.Schema<HabitEntry>({
    weekStart:{type:String,required:true},
    weekEnd:{type:String,required:true},
    habitId:{type:String,required:true},
    year:{type:String,required:true},
    month:{type:String,required:true},
    date:{type:String,required:true},
    weekday:{type:String,required:true},
    habitEntryStatus:{type:String,enum: ['Pending','Complete'],required:true,default:"Pending"},
})

interface HabitsListItem {
    habitTitle:string,
    habitTime:string | null,
    habitCreationDate:string, /* Date format : Date.toString() */
    habitWeekdays:{0:boolean,1:boolean,2:boolean,3:boolean,4:boolean,5:boolean,6:boolean},
    goalId:string | null,
    goalTargetDate:string | null,
    isArchived:boolean
}
const habitsListItemSchema = new mongoose.Schema<HabitsListItem>({
    habitTitle:{type:String,required:true},
    habitTime:{type:String,default:null},
    habitCreationDate:{type:String,required:true}, 
    habitWeekdays:{0:{type:Boolean,required:true},1:{type:Boolean,required:true},2:{type:Boolean,required:true},3:{type:Boolean,required:true},4:{type:Boolean,required:true},5:{type:Boolean,required:true},6:{type:Boolean,required:true}},
    goalId:{type:String,default:null},
    goalTargetDate:{type:String,default:null},
    isArchived:{type:Boolean,required:true,default:false}
})

interface Habit{
    _id:string, 
    user:string,
    habitEntries:HabitEntry[],
    habitList:HabitsListItem[],
}
const habitSchema = new mongoose.Schema<Habit>({
    _id:{type:String,required:true},
    user:{type:String,required:true},
    habitEntries:[habitEntrySchema],
    habitList:[habitsListItemSchema],
})

const Habit = mongoose.model<Habit>('Habit',habitSchema);
const HabitEntry = mongoose.model<HabitEntry>('Habit Entry',habitEntrySchema);
const HabitsListItem = mongoose.model<HabitsListItem>('Habits List Item',habitsListItemSchema);

exports.Habit = Habit;
exports.HabitEntry = HabitEntry;
exports.HabitsListItem = HabitsListItem;