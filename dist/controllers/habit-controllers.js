"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Habit, HabitEntry, HabitsListItem } = require('../models/habit');
const getHabits = async (req, res, next) => {
    const userId = req.params.userId;
    const { selectedDate } = req.body;
    let habitListCluster;
    let habitEntriesCluster;
    const weekday = new Date(selectedDate).getDay();
    const weekStartTime = new Date(selectedDate).getTime() + 86400000 * (weekday ? 1 - weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime + 86400000 * 6).toLocaleDateString('en-GB');
    try {
        habitListCluster = await Habit.findOne({ "_id": userId }, { habitList: { $filter: { input: "$habitList", as: "item", cond: {} } } });
        habitEntriesCluster = await Habit.findOne({ "_id": userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $eq: ["$$entry.weekStart", weekStart] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    // Create habit entries for the week of selected day if they do not exist
    if (habitEntriesCluster.habitEntries.length < 1) {
        const newHabitEntries = [];
        for (let habitListItem of habitListCluster.habitList) {
            const habitId = habitListItem._id;
            for (let i = 1; i <= 7; i++) {
                const weekDate = new Date(weekStartTime + 86400000 * (i - 1));
                const year = weekDate.getFullYear();
                const month = weekDate.getMonth() + 1;
                const date = weekDate.getDate();
                const weekday = i === 7 ? 0 : i;
                // Stop creating entries if selected date is before creation weeks start
                const creationDateWeekday = new Date(habitListItem.habitCreationDate).getDay();
                const creationDateWeekStart = new Date(new Date(habitListItem.habitCreationDate).getTime() + 86400000 * (creationDateWeekday ? 1 - creationDateWeekday : -6)).setHours(0, 0, 0, 0);
                if (creationDateWeekStart > weekStartTime + 86400000 * 6) {
                    break;
                }
                // Stop creating entries if target date reached
                if (habitListItem.goalTargetDate) {
                    if (weekDate.getTime() >= new Date(habitListItem.goalTargetDate).setHours(23, 59, 59)) {
                        break;
                    }
                }
                const newHabitEntry = new HabitEntry({ weekStart, weekEnd, habitId, habitEntryStatus: "Pending", weekday, year, month, date });
                if (i === 7 && habitListItem.habitWeekdays[0]) {
                    newHabitEntries.push(newHabitEntry);
                }
                else if (habitListItem.habitWeekdays[i]) {
                    newHabitEntries.push(newHabitEntry);
                }
            }
        }
        try {
            await Habit.findOneAndUpdate({ "_id": userId }, { $push: { habitEntries: { $each: newHabitEntries } } });
        }
        catch (error) {
            return res.status(500).send("Failed to retrieve habit data.");
        }
        res.status(200).json({ habitList: habitListCluster.habitList, habitEntries: newHabitEntries });
    }
    else {
        res.status(200).json({ habitList: habitListCluster.habitList, habitEntries: habitEntriesCluster.habitEntries });
    }
};
const addNewHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { habitTitle, habitWeekdays, habitCreationDate, habitTime, goalId, goalTargetDate } = req.body;
    const weekday = new Date(habitCreationDate).getDay();
    const weekStartTime = new Date(habitCreationDate).getTime() + 86400000 * (weekday ? 1 - weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime + 86400000 * 6).toLocaleDateString('en-GB');
    const newHabit = new HabitsListItem({ habitTitle, habitWeekdays, habitCreationDate, habitTime, goalTargetDate });
    const newHabitEntries = [];
    const habitId = newHabit._id;
    for (let i = 1; i <= 7; i++) {
        const weekDate = new Date(weekStartTime + 86400000 * (i - 1));
        // Stop creating entries if target date reached
        if (goalTargetDate) {
            if (weekDate.getTime() >= new Date(goalTargetDate).setHours(23, 59, 59, 59)) {
                break;
            }
        }
        const year = weekDate.getFullYear();
        const month = weekDate.getMonth() + 1;
        const date = weekDate.getDate();
        const newHabitEntry = new HabitEntry({ weekStart, weekEnd, habitId, habitEntryStatus: "Pending", weekday: i === 7 ? 0 : i, year, month, date });
        if (i === 7 && habitWeekdays[0]) {
            newHabitEntries.push(newHabitEntry);
        }
        else if (habitWeekdays[i]) {
            newHabitEntries.push(newHabitEntry);
        }
    }
    try {
        await Habit.findOneAndUpdate({ "_id": userId }, { $push: { habitList: newHabit } });
        await Habit.findOneAndUpdate({ "_id": userId }, { $push: { habitEntries: { $each: newHabitEntries } } });
    }
    catch (error) {
        return res.status(500).send("Failed to add new habit.");
    }
    res.status(200).json({ newHabit, newHabitEntries });
};
const updateHabitEntryStatus = async (req, res, next) => {
    const userId = req.params.userId;
    const { habitEntryStatus, _id } = req.body;
    try {
        await Habit.findOneAndUpdate({ "_id": userId, "habitEntries._id": _id }, { $set: { [`habitEntries.$.habitEntryStatus`]: habitEntryStatus } });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    res.status(200).send("Successfully updated habit");
};
const updateHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { habitTitle, habitWeekdays, habitTime, goalId, goalTargetDate, _id } = req.body;
    try {
        await Habit.findOneAndUpdate({ "_id": userId, "habitList._id": _id }, { $set: {
                "habitList.$.habitTitle": habitTitle,
                "habitList.$.habitWeekdays": habitWeekdays,
                "habitList.$.habitTime": habitTime,
                "habitList.$.goalId": goalId,
                "habitList.$.goalTargetDate": goalTargetDate
            }
        });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    res.status(200).send("Successfully updated habit");
};
const deleteHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Habit.findOneAndUpdate({ _id: userId }, { $pull: { habitList: { "_id": _id } } });
        // Deletes entries
        await Habit.updateMany({ "_id": userId }, { $pull: { habitEntries: { "habitId": _id } } }, { "multi": true });
    }
    catch (error) {
        return res.status(500).send("Failed to delete habit.");
    }
    res.status(200).send("Successfully deleted habit");
};
exports.getHabits = getHabits;
exports.addNewHabit = addNewHabit;
exports.updateHabitEntryStatus = updateHabitEntryStatus;
exports.updateHabit = updateHabit;
exports.deleteHabit = deleteHabit;
