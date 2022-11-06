import mongoose from "mongoose";

interface TodoItemInterface {
    title:string,
    description:string,
    status:string,
    dateCompleted:Date | null, /* Date format : Date.toISOString()*/
    creationDate:Date, /* Date format : Date.toISOString() */
    targetDate:Date | null /* Date format : Date.toISOString() */
    targetTime:string | null, /* Date format : .toLocaleTimeString() */
    isArchived:boolean,
    creationUTCOffset:string,
    alarmUsed:boolean,
    scheduleAction?:string|null,
    _id:string
}
const todoItemSchema = new mongoose.Schema<TodoItemInterface>({
    title:{type:String,required:true},
    description:{type:String},
    status:{type:String,enum: ['Pending','Complete'],required:true,default:"Pending"},
    dateCompleted:{type:Date,default:null},
    creationDate:{type:Date,required:true},
    targetDate:{type:Date,default:null},
    targetTime:{type:String,default:null},
    isArchived:{type:Boolean,required:true,default:false},
    creationUTCOffset:{type:String,required:true},
    alarmUsed:{type:Boolean,required:true},
})

interface TodoInterface {
    userId:string
    user:string,
    todoList:TodoItemInterface[],
}
const todoSchema = new mongoose.Schema<TodoInterface>({
    userId:{type:String,required:true},
    user:{type:String,required:true},
    todoList:[todoItemSchema]
})

const Todo = mongoose.model<TodoInterface>('Todo',todoSchema);   
const TodoItem = mongoose.model<TodoItemInterface>('Todo Item',todoItemSchema);   

export {TodoItemInterface,Todo,TodoItem};