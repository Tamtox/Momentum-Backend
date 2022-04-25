"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Habit, HabitEntry, HabitsListItem } = require('../models/habit');
// Habit Entries generation algorithm
const populateWeekWithHabitEntries = (habitList, weekStartTime, weekStart, weekEnd) => {
    const newHabitEntries = [];
    for (let habitListItem of habitList) {
        const habitId = habitListItem._id;
        for (let i = 1; i <= 7; i++) {
            const weekDate = new Date(weekStartTime + 86400000 * (i - 1));
            const year = weekDate.getFullYear();
            const month = weekDate.getMonth() + 1;
            const date = weekDate.getDate();
            const weekday = i === 7 ? 0 : i;
            // Stop creating entries if selected date is before habit creation weeks' start
            const creationDateWeekday = new Date(habitListItem.habitCreationDate).getDay();
            const creationDateWeekStart = new Date(new Date(habitListItem.habitCreationDate).getTime() + 86400000 * (creationDateWeekday ? 1 - creationDateWeekday : -6)).setHours(0, 0, 0, 0);
            if (creationDateWeekStart > weekStartTime + 86400000 * 6) {
                break;
            }
            // Stop creating entries if target paired goals date reached
            if (habitListItem.goalTargetDate) {
                if (weekDate.getTime() >= new Date(habitListItem.goalTargetDate).setHours(23, 59, 59, 999)) {
                    break;
                }
            }
            if (habitListItem.habitWeekdays[weekday]) {
                const newHabitEntry = new HabitEntry({ weekStart, weekEnd, habitId, habitEntryStatus: "Pending", weekday, year, month, date, isArchived: false });
                newHabitEntries.push(newHabitEntry);
            }
        }
    }
    return newHabitEntries;
};
const getHabits = async (req, res, next) => {
    const userId = req.params.userId;
    const { selectedDate } = req.body;
    let habitListCluster;
    let habitEntriesCluster;
    const weekday = new Date(selectedDate).getDay();
    const weekStartTime = new Date(selectedDate).setHours(0, 0, 0, 0) + 86400000 * (weekday ? 1 - weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime + 86400000 * 6).toLocaleDateString('en-GB');
    try {
        habitListCluster = await Habit.findOne({ "_id": userId }, { habitList: { $filter: { input: "$habitList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
        habitEntriesCluster = await Habit.findOne({ "_id": userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $eq: ["$$entry.weekStart", weekStart] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    // Create habit entries for the week of selected day if they do not exist 
    if (habitEntriesCluster.habitEntries.length < 1) {
        const newHabitEntries = populateWeekWithHabitEntries(habitListCluster.habitList, weekStartTime, weekStart, weekEnd);
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
const getArchivedHabits = async (req, res, next) => {
    const userId = req.params.userId;
    let archivedHabitListCluster;
    try {
        archivedHabitListCluster = await Habit.findOne({ "_id": userId }, { habitList: { $filter: { input: "$habitList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    res.status(200).json({ archivedHabitList: archivedHabitListCluster.habitList });
};
const addNewHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { habitTitle, habitWeekdays, habitCreationDate, habitTime, goalTargetDate } = req.body;
    const weekday = new Date(habitCreationDate).getDay();
    const weekStartTime = new Date(habitCreationDate).setHours(0, 0, 0, 0) + 86400000 * (weekday ? 1 - weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime + 86400000 * 6).toLocaleDateString('en-GB');
    const newHabit = new HabitsListItem({ habitTitle, habitWeekdays, habitCreationDate, habitTime, goalTargetDate });
    const newHabitEntries = populateWeekWithHabitEntries([newHabit], weekStartTime, weekStart, weekEnd);
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
    const { habitTitle, habitWeekdays, habitTime, goalId, goalTargetDate, _id, isArchived, currentDate } = req.body;
    const weekday = new Date(currentDate).getDay();
    const weekStartTime = new Date(currentDate).setHours(0, 0, 0, 0) + 86400000 * (weekday ? 1 - weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime + 86400000 * 6).toLocaleDateString('en-GB');
    let existingEntriesCluster;
    try {
        await Habit.findOneAndUpdate({ "_id": userId, "habitList._id": _id }, { $set: {
                "habitList.$.habitTitle": habitTitle,
                "habitList.$.habitWeekdays": habitWeekdays,
                "habitList.$.habitTime": habitTime,
                "habitList.$.goalId": goalId,
                "habitList.$.goalTargetDate": goalTargetDate,
                "habitList.$.isArchived": isArchived
            }
        });
        existingEntriesCluster = await Habit.findOne({ "_id": userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $eq: ["$$entry.weekStart", weekStart] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Repopulate habit entries based on updated habit if weekdays change
    if (habitWeekdays) {
        const newHabitEntries = [];
        for (let i = 1; i <= 7; i++) {
            const weekDate = new Date(weekStartTime + 86400000 * (i - 1));
            const year = weekDate.getFullYear();
            const month = weekDate.getMonth() + 1;
            const date = weekDate.getDate();
            const weekday = i === 7 ? 0 : i;
            // Stop creating entries if target paired goals date reached
            if (goalTargetDate) {
                if (weekDate.getTime() >= new Date(goalTargetDate).setHours(23, 59, 59, 999)) {
                    break;
                }
            }
            // Check if existing entry status complete
            let habitEntryStatus;
            existingEntriesCluster.habitEntries.map((entry) => {
                if (entry.weekday == weekday) {
                    entry.habitEntryStatus === 'Complete' ? habitEntryStatus = 'Complete' : habitEntryStatus = 'Pending';
                }
            });
            if (habitWeekdays[weekday]) {
                const newHabitEntry = new HabitEntry({ weekStart, weekEnd, habitId: _id, habitEntryStatus, weekday, year, month, date, isArchived: false });
                newHabitEntries.push(newHabitEntry);
            }
        }
        // Delete old entries
        try {
            await Habit.updateMany({ "_id": userId }, { $pull: { habitEntries: { "weekStart": weekStart } } }, { "multi": true });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        // Push new entries
        try {
            await Habit.findOneAndUpdate({ "_id": userId }, { $push: { habitEntries: { $each: newHabitEntries } } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).send(newHabitEntries);
    }
    else {
        res.status(200).send("Habit updated successfully.");
    }
};
const updateHabitArchiveStatus = async (req, res, next) => {
    const userId = req.params.userId;
    const { habitTitle, habitWeekdays, habitTime, goalId, goalTargetDate, _id, isArchived, currentDate } = req.body;
    const weekday = new Date(currentDate).getDay();
    const weekStartTime = new Date(currentDate).setHours(0, 0, 0, 0) + 86400000 * (weekday ? 1 - weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime + 86400000 * 6).toLocaleDateString('en-GB');
    // Update archivation status in habit list
    try {
        await Habit.findOneAndUpdate({ "_id": userId, "habitList._id": _id }, { $set: {
                "habitList.$.isArchived": isArchived
            }
        });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Populate habit entries for this week if restored habit has none
    if (!isArchived) {
        let habitEntriesCluster;
        try {
            habitEntriesCluster = await Habit.findOne({ "_id": userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $eq: ["$$entry.weekStart", weekStart] } } } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        const habitEntries = habitEntriesCluster.habitEntries.filter((item) => item.habitId === _id);
        if (habitEntries.length < 1) {
            console.log('Empty');
            const newHabitEntries = populateWeekWithHabitEntries([req.body], weekStartTime, weekStart, weekEnd);
            try {
                await Habit.findOneAndUpdate({ "_id": userId }, { $push: { habitEntries: { $each: newHabitEntries } } });
            }
            catch (error) {
                return res.status(500).send("Failed to retrieve habit data.");
            }
            res.status(200).json({ habitEntries: newHabitEntries });
        }
        else {
            res.status(200).json({ habitEntries: habitEntriesCluster.habitEntries });
        }
    }
    else {
        res.status(200).send("Habit successfully archived.");
    }
};
const deleteHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Habit.findOneAndUpdate({ _id: userId }, { $pull: { habitList: { "_id": _id } } });
        // Delete entries
        await Habit.updateMany({ "_id": userId }, { $pull: { habitEntries: { "habitId": _id } } }, { "multi": true });
    }
    catch (error) {
        return res.status(500).send("Failed to delete habit.");
    }
    res.status(200).send("Successfully deleted habit");
};
exports.getHabits = getHabits;
exports.getArchivedHabits = getArchivedHabits;
exports.addNewHabit = addNewHabit;
exports.updateHabitEntryStatus = updateHabitEntryStatus;
exports.updateHabit = updateHabit;
exports.updateHabitArchiveStatus = updateHabitArchiveStatus;
exports.deleteHabit = deleteHabit;
