import mongoose from "mongoose";

interface TodoItem {
    todoTitle:string,
    todoDescription:string,
    todoStatus:string,
    todoCreationDate:string, /* Date format : Date.toString() */
    todoTargetDate:string | null /* Date format : Date.toString() */
}
const todoItemSchema = new mongoose.Schema<TodoItem>({
    todoTitle:{type:String,required:true},
    todoDescription:{type:String},
    todoStatus:{type:String,enum: ['Pending','Complete'],required:true,default:"Pending"},
    todoCreationDate:{type:String,required:true},
    todoTargetDate:{type:String,default:null},
})

interface Todo {
    _id:string
    user:string,
    todoList:TodoItem[]
}
const todoSchema = new mongoose.Schema<Todo>({
    _id:{type:String,required:true},
    user:{type:String,required:true},
    todoList:[todoItemSchema]
})

const Todo = mongoose.model<Todo>('Todo',todoSchema);   
const TodoItem = mongoose.model<TodoItem>('Todo Item',todoItemSchema);   

exports.Todo = Todo
exports.TodoItem = TodoItem