import mongoose from "mongoose";

interface GoalItem {
    goalTitle:string,
    goalCreationDate:string, /* Date format : Date.toString() */
    goalTargetDate:string | null, /* Date format : Date.toString() */
    goalStatus:string,
    dateCompleted:string, /* Date format : Date.toString() */
    habitId:string | null,
    isArchived:boolean
}
const goalItemSchema = new mongoose.Schema<GoalItem>({
    goalTitle:{type:String,required:true},
    goalCreationDate:{type:String,required:true}, /* Date format : Date.toString() */
    goalTargetDate:{type:String,default:null}, /* Date format : Date.toString() */
    goalStatus:{type:String,enum: ['Pending','Complete'],required:true,default:"Pending"},
    dateCompleted:{type:String,default:""},
    habitId:{type:String,default:null},
    isArchived:{type:Boolean,required:true,default:false}
})

interface Goal{
    _id:string, 
    user:string,
    goalList:GoalItem[],
}
const goalSchema = new mongoose.Schema<Goal>({
    _id:{type:String,required:true},
    user:{type:String,required:true},
    goalList:[goalItemSchema],
})

const Goal = mongoose.model<Goal>('Goal',goalSchema);
const GoalItem = mongoose.model<GoalItem>('Goal Item',goalItemSchema);

exports.Goal = Goal;
exports.GoalItem = GoalItem;