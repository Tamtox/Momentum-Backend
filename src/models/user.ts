import mongoose from "mongoose";

interface User {
    name:string,
    email:string,
    password:string,
    creationDate:Date, /* Date format : new Date */
    lastLogin:Date,
    lastOnline:Date,
    utcOffset:number,
    emailConfirmationStatus:string,
    verificationCode:string
}   

const userSchema = new mongoose.Schema<User>({
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,require:true,minlength:6},
    creationDate:{type:Date,required:true},
    lastLogin:{type:Date},
    utcOffset:{type:Number},
    emailConfirmationStatus:{type:String,required:true,default:"Pending"},
    verificationCode:{type:String,required:true}
})

module.exports = mongoose.model<User>('User',userSchema);