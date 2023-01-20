"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastOnline = exports.deleteUser = exports.resetPassword = exports.changePassword = exports.sendVerificationLetter = exports.getUserData = exports.verifyUser = exports.login = exports.signup = void 0;
//Models
const User = require('../models/user');
const { Todo } = require('../models/todo');
const { Habit } = require('../models/habit');
const { Journal } = require('../models/journal');
const { Goal } = require('../models/goal');
const { Schedule } = require('../models/schedule');
//Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_STRING, EMAIL, PASS, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, SMTP_PORT, SMTP_HOST } = process.env;
const nodemailer = require("nodemailer");
const sendVerificationMail = async (email, verificationCode, verificationMode) => {
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        // secure: true,
        auth: {
            user: EMAIL,
            pass: PASS,
        }
    });
    const mailOptions = {
        from: EMAIL,
        to: email,
        subject: `${verificationMode ? 'Verification letter for Momentum application' : 'Password reset letter for Momentum application'}`,
        text: `${verificationMode ? 'Verification code' : 'Temporary password'} : ${verificationCode}`
    };
    return await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
};
//Controllers
const signup = async (req, res, next) => {
    const { name, email, password, creationDate, timezoneOffset } = req.body;
    // Check existing user
    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    }
    catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.');
    }
    if (existingUser) {
        return res.status(404).send('User already exists. Try to sign in.');
    }
    // Hash password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    }
    catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.');
    }
    // Confirmation Code for verification
    let verificationCode = '';
    for (let i = 0; i < 7; i++) {
        verificationCode += Math.floor(Math.random() * 10);
    }
    // Create new user in database
    const newUser = new User({ name, email, password: hashedPassword, creationDate, lastLogin: new Date(), lastOnline: new Date(), utcOffset: timezoneOffset, emailConfirmationStatus: "Pending", verificationCode });
    try {
        await newUser.save();
    }
    catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.');
    }
    // Create blank entries in database
    const newUserTodo = new Todo({
        userId: newUser._id,
        user: email,
        todoList: [],
    });
    const newUserHabit = new Habit({
        userId: newUser._id,
        user: email,
        habitEntries: [],
        habitList: []
    });
    const newUserGoal = new Goal({
        userId: newUser._id,
        user: email,
        goalList: []
    });
    const newUserJournal = new Journal({
        userId: newUser._id,
        user: email,
        journalEntries: []
    });
    const newUserSchedule = new Schedule({
        userId: newUser._id,
        user: email,
        scheduleList: [],
        scheduleEntries: []
    });
    try {
        await newUserTodo.save();
        await newUserHabit.save();
        await newUserGoal.save();
        await newUserJournal.save();
        await newUserSchedule.save();
    }
    catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.');
    }
    // JWT
    let token;
    try {
        token = await jwt.sign({ userId: newUser._id, email: newUser.email }, SECRET_STRING, { expiresIn: '7d', });
    }
    catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.');
    }
    // Send confirmation letter
    try {
        await sendVerificationMail(email, verificationCode, true);
    }
    catch (error) {
        return res.status(500).send('Failed to create new user. Please try again later.');
    }
    res.status(201).json({ name, email, token, emailConfirmationStatus: "Pending" });
};
exports.signup = signup;
const login = async (req, res, next) => {
    const { email, password, timezoneOffset } = req.body;
    // Check existing user
    let existingUser;
    let users;
    try {
        existingUser = await User.findOne({ email: email });
        users = await User.find({});
    }
    catch (error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    if (!existingUser) {
        return res.status(404).send('User does not exist!');
    }
    // Validate password
    let isValidPassword;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    }
    catch (error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    if (!isValidPassword) {
        return res.status(401).send("Invalid Password!");
    }
    try {
        await User.findOneAndUpdate({ email: email }, { $set: { lastLogin: new Date(), lastOnline: new Date(), utcOffset: timezoneOffset } });
    }
    catch (error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    // JWT
    let token;
    try {
        token = jwt.sign({ userId: existingUser._id, email: existingUser.email }, SECRET_STRING, { expiresIn: '7d', });
    }
    catch (error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    res.status(200).json({ token, emailConfirmationStatus: existingUser.emailConfirmationStatus, email: existingUser.email, name: existingUser.name });
};
exports.login = login;
const verifyUser = async (req, res, next) => {
    const userId = req.params.userId;
    const { verificationCode } = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    }
    catch (error) {
        return res.status(500).send('Verification failed. Please try again later.');
    }
    if (existingUser.verificationCode === verificationCode) {
        try {
            await User.findOneAndUpdate({ _id: userId }, { $set: { emailConfirmationStatus: "Complete" } });
        }
        catch (error) {
            return res.status(500).send('Verification failed!');
        }
        res.status(200).json({ message: 'Verification successfull.' });
    }
    else {
        return res.status(403).send('Verification code is incorrect.');
    }
};
exports.verifyUser = verifyUser;
const getUserData = async (req, res, next) => {
    const userId = req.params.userId;
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve data. Please try again later.');
    }
    if (existingUser) {
        res.status(200).send({ emailConfirmationStatus: existingUser.emailConfirmationStatus, email: existingUser.email, name: existingUser.name });
    }
    else {
        return res.status(404).send('User does not exist!');
    }
};
exports.getUserData = getUserData;
const sendVerificationLetter = async (req, res, next) => {
    const userId = req.params.userId;
    const { email } = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve data. Please try again later.');
    }
    const verificationCode = existingUser.verificationCode;
    // Send confirmation letter
    try {
        await sendVerificationMail(email, verificationCode, true);
    }
    catch (error) {
        return res.status(500).send('Failed to send verification letter. Please try again later.');
    }
    res.status(200).json({ message: "Verification code was sent to provided email" });
};
exports.sendVerificationLetter = sendVerificationLetter;
const changePassword = async (req, res, next) => {
    const { currentPass, newPass } = req.body;
    const userId = req.params.userId;
    // Check if user exists
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    }
    catch (error) {
        return res.status(500).send('Failed to change password. Please try again later.');
    }
    if (!existingUser) {
        return res.status(404).send('User does not exist!');
    }
    // Validate password
    let isValidPassword;
    try {
        isValidPassword = await bcrypt.compare(currentPass, existingUser.password);
    }
    catch (error) {
        return res.status(500).send('Failed to change password. Please try again later.');
    }
    if (!isValidPassword) {
        return res.status(401).send("Invalid Current Password!");
    }
    // Hash password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(newPass, 12);
    }
    catch (error) {
        return res.status(500).send('Failed to change password. Please try again later.');
    }
    // Update password in database
    try {
        await User.findOneAndUpdate({ _id: userId }, { $set: { password: hashedPassword } });
    }
    catch (error) {
        return res.status(500).send('Failed to change password. Please try again later.');
    }
    // Return new token
    let token;
    try {
        token = jwt.sign({ userId: existingUser._id, email: existingUser.email }, SECRET_STRING, { expiresIn: '7d', });
    }
    catch (error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    const message = 'Password changed successfully';
    res.status(200).json({ message, token, emailConfirmationStatus: existingUser.emailConfirmationStatus, email: existingUser.email, name: existingUser.name });
};
exports.changePassword = changePassword;
const resetPassword = async (req, res, next) => {
    const { email } = req.body;
    // Check existing user
    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    }
    catch (error) {
        return res.status(500).send('Failed to reset password. Please try again later.');
    }
    if (!existingUser) {
        return res.status(404).send('User with provided email does not exist!');
    }
    // Generate and hash temporary password
    let tempPassword = '';
    const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345678900987654321,._!?_+-=";
    for (let i = 0; i < 10; i++) {
        tempPassword += symbols[Math.floor(Math.random() * symbols.length)];
    }
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(tempPassword, 12);
    }
    catch (error) {
        return res.status(500).send('Failed to reset password. Please try again later.');
    }
    // Update password in database
    try {
        await User.findOneAndUpdate({ userId: existingUser._id }, { $set: { password: hashedPassword } });
    }
    catch (error) {
        return res.status(500).send('Failed to reset password. Please try again later.');
    }
    // Send password reset letter
    try {
        await sendVerificationMail(email, tempPassword, false);
    }
    catch (error) {
        return res.status(500).send('Failed to send verification letter. Please try again later.');
    }
    res.status(200).json({ message: `Temporary password was sent to ${email}` });
};
exports.resetPassword = resetPassword;
const deleteUser = async (req, res, next) => {
    const userId = req.params.userId;
    const { password } = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    }
    catch (error) {
        return res.status(500).send('Account deletion failed. Please try again later.');
    }
    // Validate password
    let isValidPassword;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    }
    catch (error) {
        return res.status(500).send('Account deletion failed. Please try again later.');
    }
    if (!isValidPassword) {
        return res.status(401).send("Invalid Current Password!");
    }
    if (existingUser) {
        try {
            await User.findOneAndDelete({ _id: userId });
            await Todo.findOneAndDelete({ userId: userId });
            await Journal.findOneAndDelete({ userId: userId });
            await Habit.findOneAndDelete({ userId: userId });
            await Goal.findOneAndDelete({ userId: userId });
            await Schedule.findOneAndDelete({ userId: userId });
        }
        catch (error) {
            return res.status(500).send('Failed to delete user. Please try again later.');
        }
        res.status(200).send('User deleted successfully');
    }
    else {
        return res.status(404).send('User not found');
    }
};
exports.deleteUser = deleteUser;
const lastOnline = async (req, res, next) => {
    const userId = req.params.userId;
    try {
        await User.findOneAndUpdate({ _id: userId }, { $set: { lastOnline: new Date() } });
    }
    catch (error) {
        return res.status(500).send('Failed to login. Please try again later.');
    }
    next();
};
exports.lastOnline = lastOnline;
//# sourceMappingURL=user-controllers.js.map