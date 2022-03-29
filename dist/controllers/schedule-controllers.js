"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Schedule, ScheduleEntry } = require('../models/schedule');
const getSchedule = async (req, res, next) => {
    const userId = req.params.userId;
    let scheduleCluster;
    try {
        scheduleCluster = await Schedule.findOne({ "_id": userId });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve schedule data.");
    }
    res.status(200).json(scheduleCluster.scheduleEntries);
};
const addNewScheduleEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { time, title, weekdays } = req.body;
    const newScheduleEntry = new ScheduleEntry({ time, title, weekdays });
    try {
        await Schedule.findOneAndUpdate({ _id: userId }, { $push: { scheduleEntries: newScheduleEntry } });
    }
    catch (error) {
        return res.status(500).send('Failed to add new schedule entry.');
    }
    res.status(200).send(newScheduleEntry);
};
const deleteScheduleEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Schedule.findOneAndUpdate({ _id: userId }, { $pull: { scheduleEntries: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send('Failed to delete schedule entry.');
    }
    res.status(200).send("Successfully deleted schedule entry");
};
exports.getSchedule = getSchedule;
exports.addNewScheduleEntry = addNewScheduleEntry;
exports.deleteScheduleEntry = deleteScheduleEntry;
