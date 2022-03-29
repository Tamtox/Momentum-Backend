import mongoose from "mongoose";

interface User {
    name:string,
    email:string,
    password:string,
    creationDate:string, /* Date format : Date.toString() */
    emailConfirmationStatus:string,
    verificationCode:string
}   

const userSchema = new mongoose.Schema<User>({
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,require:true,minlength:6},
    creationDate:{type:String,required:true},
    emailConfirmationStatus:{type:String,required:true,default:"Pending"},
    verificationCode:{type:String,required:true}
})

module.exports = mongoose.model<User>('User',userSchema);