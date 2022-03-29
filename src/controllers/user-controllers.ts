//Models
const User = require('../models/user');
const {Todo} = require('../models/todo');
const {Habit} = require('../models/habit');
const {Journal} = require('../models/journal');
const {Goal} = require('../models/goal');
//Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import { RequestHandler } from "express";
const { SECRET_STRING,EMAIL,REFRESH_TOKEN,CLIENT_ID,CLIENT_SECRET } = process.env;
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const sendVerificationMail = async (email:string,verificationCode:string,verificationMode:boolean) => {
    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({
        refresh_token: REFRESH_TOKEN
    });
    // getAccessToken requires a callback and does not support using async await
    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err:any, token:any) => {
            if (err) {
                reject("Failed to create access token");
            }
            resolve(token);
        });
    });
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: "OAuth2",
            user: EMAIL,
            accessToken,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN
        }
    });
    const mailOptions = {
        from: EMAIL,
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
    const {name,email,password,creationDate} = req.body as {name:string,email:string,password:string,creationDate:string}
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
    const newUser = new User({name,email,password:hashedPassword,creationDate,emailConfirmationStatus:"Pending",verificationCode});
    try{
        await newUser.save();
    } catch(error) {
        return res.status(500).send('Failed to create new user. Please try again later.')
    }
    // Create blank entries in database
    const newUserTodo = new Todo({
        _id:newUser.id,
        user:email,
        todoList:[]
    })
    const newUserHabit = new Habit({
        _id:newUser.id,
        user:email,
        habitEntries:[],
        habitList:[]
    });
    const newUserGoal = new Goal({
        _id:newUser.id,
        user:email,
        goalList:[]
    });
    const newUserJournal = new Journal({
        _id:newUser.id,
        user:email,
        journalEntries:[]
    });
    try {
        await newUserTodo.save();
        await newUserHabit.save();
        await newUserGoal.save();
        await newUserJournal.save();
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
        await sendVerificationMail(email,verificationCode,true)
    } catch(error) {
        console.log(error)
    }   
    res.status(201).json({name,email,token,emailConfirmationStatus:"Pending"})
}

const login:RequestHandler = async (req,res,next) => {
    const {email,password} = req.body as {email:string,password:string}
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
        return res.status(500).send('Failed to login. Please try again later.')
    }
    if(!isValidPassword) {
        return res.status(401).send("Invalid Password!")
        // return next(new HttpError('Incorrect password',401))
    }
    // JWT
    let token
    try{
        token = jwt.sign({userId:existingUser.id,email:existingUser.email},SECRET_STRING,{expiresIn:'7d',})
    } catch(error) {
        return res.status(500).send('Failed to login. Please try again later.')
    }
    res.status(200).json({token,emailConfirmationStatus:existingUser.emailConfirmationStatus,email:existingUser.email,name:existingUser.name})
}

const verifyUser:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {verificationCode} = req.body as {verificationCode:string}
    let existingUser
    try{
        existingUser = await User.findOne({_id:userId});
    } catch(error) {
        return res.status(500).send('Verification failed. Please try again later.')
    }
    if(existingUser.verificationCode === verificationCode) {
        try{
            await User.findOneAndUpdate({_id:userId},{$set:{emailConfirmationStatus:"Complete"}})
        } catch(error) {
            return res.status(500).send('Verification failed!')
        }
        res.status(200).send('Verification successfull!')
    } else {
        return res.status(403).send('Verification code is incorrect!')
    }
}

const getUserData:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let existingUser
    try{
        existingUser = await User.findOne({_id:userId});
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
        existingUser = await User.findOne({_id:userId});
    } catch(error) {
        return res.status(500).send('Failed to retrieve data. Please try again later.')
    }
    const verificationCode = existingUser.verificationCode
     // Send confirmation letter
    try{
        await sendVerificationMail(email,verificationCode,true)
    } catch(error) {
        console.log(error)
    }   
    res.status(200).send("Verification code was sent to provided email")
}

const changePassword:RequestHandler<{userId:string}> = async (req,res,next) => {
    const {currentPass,newPass} = req.body as {currentPass:string,newPass:string};
    const userId = req.params.userId;
    // Check if user exists
    let existingUser
    try{
        existingUser = await User.findOne({_id:userId});
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
        await User.findOneAndUpdate({_id:userId},{$set:{password:hashedPassword}})
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
    res.status(200).json({token,emailConfirmationStatus:existingUser.emailConfirmationStatus,email:existingUser.email,name:existingUser.name})
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
        return res.status(404).send('User does not exist!')
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
        await User.findOneAndUpdate({_id:existingUser._id},{$set:{password:hashedPassword}})
    } catch(error) {
        return res.status(500).send('Failed to reset password. Please try again later.')
    }
    // Send password reset letter
    try{
        await sendVerificationMail(email,tempPassword,false);
    } catch(error) {
        console.log(error)
    }   
    res.status(200).send("Temporary password was sent to provided email")
}

const deleteUser:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let existingUser
    try{
        existingUser = await User.findOne({_id:userId});
    } catch(error) {
        return res.status(500).send('Verification failed. Please try again later.')
    }
    if(existingUser) {
        try{
            await User.findOneAndDelete({ "_id": userId })
            await Todo.findOneAndDelete({ "_id": userId  })
            await Journal.findOneAndDelete({ "_id": userId  })
            await Habit.findOneAndDelete({ "_id": userId  })
            await Goal.findOneAndDelete({ "_id": userId  })
        } catch(error) {
            return res.status(500).send('Failed to delete user. Please try again later.')
        }
        res.status(200).send('User deleted successfully')
    } else {
        return res.status(404).send('User not found')
    }
}



exports.signup = signup
exports.login = login
exports.verifyUser = verifyUser
exports.getUserData = getUserData
exports.sendVerificationLetter = sendVerificationLetter
exports.changePassword = changePassword
exports.resetPassword = resetPassword
exports.deleteUser = deleteUser
