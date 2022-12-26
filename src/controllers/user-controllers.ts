//Models
const User = require('../models/user');
const {Todo} = require('../models/todo');
const {Habit} = require('../models/habit');
const {Journal} = require('../models/journal');
const {Goal} = require('../models/goal');
const {Schedule} = require('../models/schedule');
//Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import { RequestHandler } from "express";
const { SECRET_STRING,EMAIL,CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,SMTP_PORT,SMTP_HOST} = process.env;
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const sendVerificationMail = async (email:string,verificationCode:string,verificationMode:boolean) => {
    const transporter = nodemailer.createTransport({
        host:SMTP_HOST,
        port:SMTP_PORT,
        secure: true,
        auth: {
            type: "OAuth2",
            user: EMAIL,
            // accessToken,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN
        }
    });
    const mailOptions = {
        from:EMAIL,
        to: email,  
        subject: `${verificationMode ? 'Verification letter for Momentum' : 'Password reset letter for Momentum'}`,
        text: `${verificationMode ? 'Verification code' : 'Temporary password'} : ${verificationCode}`
    };
    return await transporter.sendMail(mailOptions, function(error:any, info:any){
        if (error) {
            console.log(error); 
        }
    }); 
}

//Controllers
const signup:RequestHandler = async (req,res,next) => {
    const {name,email,password,creationDate,timezoneOffset} = req.body as {name:string,email:string,password:string,creationDate:Date,timezoneOffset:string}
    // Check existing user
    let existingUser
    try{
        existingUser = await User.findOne({email:email});
    } catch(error) {
        return res.status(500).send('Failed to create new user. Please try again later.')
    }
    if(existingUser) {
        return res.status(404).send('User already exists. Try to sign in.')
    }
    // Hash password
    let hashedPassword 
    try{
        hashedPassword = await bcrypt.hash(password,12);
    } catch(error) {
        return res.status(500).send('Failed to create new user. Please try again later.')
    }
    // Confirmation Code for verification
    let verificationCode = ''
    for(let i=0;i<7;i++) {
        verificationCode += Math.floor(Math.random() * 10);
    }
    // Create new user in database
    const newUser = new User({name,email,password:hashedPassword,creationDate,lastLogin:new Date(),lastOnline:new Date(),utcOffset:timezoneOffset,emailConfirmationStatus:"Pending",verificationCode});
    try{
        await newUser.save();
    } catch(error) {
        return res.status(500).send('Failed to create new user. Please try again later.')
    }
    // Create blank entries in database
    const newUserTodo = new Todo({
        userId:newUser.id,
        user:email,
        todoList:[],
    })
    const newUserHabit = new Habit({
        userId:newUser.id,
        user:email,
        habitEntries:[],
        habitList:[]
    });
    const newUserGoal = new Goal({
        userId:newUser.id,
        user:email,
        goalList:[]
    });
    const newUserJournal = new Journal({
        userId:newUser.id,
        user:email,
        journalEntries:[]
    });
    const newUserSchedule = new Schedule({
        userId:newUser.id,
        user:email,
        scheduleList:[],
        scheduleEntries:[]
    });
    try {
        await newUserTodo.save();
        await newUserHabit.save();
        await newUserGoal.save();
        await newUserJournal.save();
        await newUserSchedule.save();
    } catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.')
    }
    // JWT
    let token
    try{
        token = await jwt.sign({userId:newUser.id,email:newUser.email},SECRET_STRING,{expiresIn:'7d',})
    } catch(error) {
        return res.status(500).send('Failed to create new user. Please try again later.')
    }
    // Send confirmation letter
    try{
        // await sendVerificationMail(email,verificationCode,true)
    } catch(error) {
        console.log(error);
    }   
    res.status(201).json({name,email,token,emailConfirmationStatus:"Pending"})
}

const login:RequestHandler = async (req,res,next) => {
    const {email,password,timezoneOffset} = req.body as {email:string,password:string,timezoneOffset:string}
    // Check existing user
    let existingUser
    try{
        existingUser = await User.findOne({email:email});
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.')
    }
    if(!existingUser) {
        return res.status(404).send('User does not exist!')
    } 
    // Validate password
    let isValidPassword
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    if(!isValidPassword) {
        return res.status(401).send("Invalid Password!");
    }
    try{
        await User.findOneAndUpdate({email:email},{$set:{lastLogin:new Date(),lastOnline:new Date(),utcOffset:timezoneOffset}});
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    // JWT
    let token
    try{
        token = jwt.sign({userId:existingUser.id,email:existingUser.email},SECRET_STRING,{expiresIn:'7d',})
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    res.status(200).json({token,emailConfirmationStatus:existingUser.emailConfirmationStatus,email:existingUser.email,name:existingUser.name})
}

const verifyUser:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {verificationCode} = req.body as {verificationCode:string}
    let existingUser
    try{
        existingUser = await User.findOne({userId:userId});
    } catch(error) {
        return res.status(500).send('Verification failed. Please try again later.')
    }
    if(existingUser.verificationCode === verificationCode) {
        try{
            await User.findOneAndUpdate({userId:userId},{$set:{emailConfirmationStatus:"Complete"}})
        } catch(error) {
            return res.status(500).send('Verification failed!')
        }
        res.status(200).json({message:'Verification successfull.'})
    } else {
        return res.status(403).send('Verification code is incorrect.')
    }
}

const getUserData:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let existingUser
    try{
        existingUser = await User.findOne({userId:userId});
    } catch(error) {
        return res.status(500).send('Failed to retrieve data. Please try again later.')
    }
    if(existingUser) {
        res.status(200).send({emailConfirmationStatus:existingUser.emailConfirmationStatus,email:existingUser.email,name:existingUser.name})
    } else {
        return res.status(404).send('User does not exist!')
    }
}

const sendVerificationLetter:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {email} = req.body as {email:string}
    let existingUser
    try{
        existingUser = await User.findOne({userId:userId});
    } catch(error) {
        return res.status(500).send('Failed to retrieve data. Please try again later.')
    }
    const verificationCode = existingUser.verificationCode
     // Send confirmation letter
    try{
        // await sendVerificationMail(email,verificationCode,true)
    } catch(error) {
        return res.status(500).send('Failed to send verification letter. Please try again later.')
    }   
    res.status(200).json({message:"Verification code was sent to provided email"})
}

const changePassword:RequestHandler<{userId:string}> = async (req,res,next) => {
    const {currentPass,newPass} = req.body as {currentPass:string,newPass:string};
    const userId = req.params.userId;
    // Check if user exists
    let existingUser
    try{
        existingUser = await User.findOne({userId:userId});
    } catch(error) {
        return res.status(500).send('Failed to change password. Please try again later.')
    }
    if(!existingUser) {
        return res.status(404).send('User does not exist!')
    } 
    // Validate password
    let isValidPassword
    try{
        isValidPassword = await bcrypt.compare(currentPass, existingUser.password);
    } catch(error) {
        return res.status(500).send('Failed to change password. Please try again later.')
    }
    if(!isValidPassword) {
        return res.status(401).send("Invalid Current Password!")
    }
    // Hash password
    let hashedPassword 
    try{
        hashedPassword = await bcrypt.hash(newPass,12);
    } catch(error) {
        return res.status(500).send('Failed to change password. Please try again later.')
    }
    // Update password in database
    try{
        await User.findOneAndUpdate({userId:userId},{$set:{password:hashedPassword}})
    } catch(error) {
        return res.status(500).send('Failed to change password. Please try again later.')
    }
    // Return new token
    let token
    try {
        token = jwt.sign({userId:existingUser.id,email:existingUser.email},SECRET_STRING,{expiresIn:'7d',})
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.')
    }
    const message = 'Password changed successfully'
    res.status(200).json({message,token,emailConfirmationStatus:existingUser.emailConfirmationStatus,email:existingUser.email,name:existingUser.name})
}

const resetPassword:RequestHandler<{userId:string}> = async (req,res,next) => {
    const {email} = req.body as {email:string};
     // Check existing user
    let existingUser
    try{
        existingUser = await User.findOne({email:email});
    } catch(error) {
        return res.status(500).send('Failed to reset password. Please try again later.')
    }
    if(!existingUser) {
        return res.status(404).send('User with provided email does not exist!')
    } 
    // Generate and hash temporary password
    let tempPassword = '';
    const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345678900987654321,._!?_+-="; 
    for(let i=0;i<10;i++) {
        tempPassword += symbols[Math.floor(Math.random() * symbols.length)];
    }
    let hashedPassword
    try{
        hashedPassword = await bcrypt.hash(tempPassword,12);
    } catch(error) {
        return res.status(500).send('Failed to reset password. Please try again later.')
    }
    // Update password in database
    try{
        await User.findOneAndUpdate({userId:existingUser._id},{$set:{password:hashedPassword}})
    } catch(error) {
        return res.status(500).send('Failed to reset password. Please try again later.')
    }
    // Send password reset letter
    try{
        // await sendVerificationMail(email,tempPassword,false);
    } catch(error) {
        return res.status(500).send('Failed to send verification letter. Please try again later.')
    }   
    res.status(200).json({message:`Temporary password was sent to ${email}`})
}

const deleteUser:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {password} = req.body as {password:string};
    let existingUser
    try{
        existingUser = await User.findOne({userId:userId});
    } catch(error) {
        return res.status(500).send('Account deletion failed. Please try again later.')
    }
     // Validate password
    let isValidPassword
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch(error) {
        return res.status(500).send('Account deletion failed. Please try again later.')
    }
    if(!isValidPassword) {
        return res.status(401).send("Invalid Current Password!")
    }
    if(existingUser) {
        try{
            await User.findOneAndDelete({userId:userId});
            await Todo.findOneAndDelete({userId:userId});
            await Journal.findOneAndDelete({userId:userId});
            await Habit.findOneAndDelete({userId:userId});
            await Goal.findOneAndDelete({userId:userId});
            await Schedule.findOneAndDelete({userId:userId})
        } catch(error) {
            return res.status(500).send('Failed to delete user. Please try again later.')
        }
        res.status(200).send('User deleted successfully')
    } else {
        return res.status(404).send('User not found')
    }
}

const lastOnline:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    try{
        await User.findOneAndUpdate({userId:userId},{$set:{lastOnline:new Date()}});
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    next()
}

export {signup,login,verifyUser,getUserData,sendVerificationLetter,changePassword,resetPassword,deleteUser,lastOnline}
