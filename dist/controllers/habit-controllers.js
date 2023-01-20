"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHabit = exports.updateHabitArchiveStatus = exports.updateHabit = exports.updateHabitEntryStatus = exports.populateHabit = exports.addNewHabit = exports.getArchivedHabits = exports.getHabits = void 0;
const habit_1 = require("../models/habit");
const schedule_1 = require("../models/schedule");
const schedule_controllers_1 = require("./schedule-controllers");
const utility_functions_1 = require("../misc/utility-functions");
const getHabits = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedWeekStartTime, clientTimezoneOffset } = req.body;
    const { clientWeekStart, clientNextWeekStart } = (0, utility_functions_1.getWeekDates)(clientSelectedWeekStartTime, clientTimezoneOffset);
    let habitListCluster;
    let habitEntriesCluster;
    try {
        habitListCluster = await habit_1.Habit.findOne({ userId: userId }, { habitList: { $filter: { input: "$habitList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
        habitEntriesCluster = await habit_1.Habit.findOne({ userId: userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $and: [{ $gte: ["$$entry.date", clientWeekStart] }, { $lt: ["$$entry.date", clientNextWeekStart] }] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    const habitList = habitListCluster.habitList;
    const habitEntries = habitEntriesCluster.habitEntries;
    res.status(200).json({ habitList, habitEntries });
};
exports.getHabits = getHabits;
const getArchivedHabits = async (req, res, next) => {
    const userId = req.params.userId;
    let archivedHabitListCluster;
    try {
        archivedHabitListCluster = await habit_1.Habit.findOne({ userId: userId }, { habitList: { $filter: { input: "$habitList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    res.status(200).json({ archivedHabitList: archivedHabitListCluster.habitList });
};
exports.getArchivedHabits = getArchivedHabits;
const addNewHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, weekdays, creationDate, time, targetDate, alarmUsed, creationUTCOffset, clientCurrentWeekStartTime, clientTimezoneOffset } = req.body;
    const { utcWeekStartMidDay, utcNextWeekStartMidDay, clientWeekStart, clientNextWeekStart } = (0, utility_functions_1.getWeekDates)(clientCurrentWeekStartTime, clientTimezoneOffset);
    let newHabit = new habit_1.HabitsListItem({ title, weekdays, creationDate, time, targetDate, alarmUsed, creationUTCOffset });
    try {
        await habit_1.Habit.findOneAndUpdate({ userId: userId }, { $push: { habitList: newHabit } });
    }
    catch (error) {
        return res.status(500).send("Failed to add new habit.");
    }
    // Sends habit id and new schedule entries
    res.status(200).json({ habitId: newHabit._id });
};
exports.addNewHabit = addNewHabit;
const updateHabitEntryStatus = async (req, res, next) => {
    const userId = req.params.userId;
    const { status, habitId, dateCompleted, _id, date } = req.body;
    // Updates status for existing entry or creates new habit and schedule entries
    if (_id) {
        try {
            await habit_1.Habit.findOneAndUpdate({ userId: userId, "habitEntries._id": _id }, { $set: { [`habitEntries.$.status`]: status, "habitEntries.$.dateCompleted": dateCompleted } });
            await schedule_1.Schedule.findOneAndUpdate({ userId: userId, "scheduleList._id": _id }, { $set: { [`scheduleList.$.status`]: status, "scheduleList.$.dateCompleted": dateCompleted } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).send("Successfully updated habit");
    }
    else {
        // Get parent habit
        let habitListCluster;
        try {
            habitListCluster = await habit_1.Habit.findOne({ userId: userId }, { habitList: { $elemMatch: { "_id": habitId } } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        const selectedHabit = habitListCluster.habitList[0];
        const { time, title, alarmUsed, creationUTCOffset, isArchived } = selectedHabit;
        const newHabitEntry = new habit_1.HabitEntry({ date, status, habitId, dateCompleted });
        let newScheduleEntry = new schedule_1.ScheduleItem({
            date, time, parentId: habitId, parentTitle: title, parentType: "habit", alarmUsed, utcOffset: creationUTCOffset, dateCompleted, status, isArchived, _id: newHabitEntry._id
        });
        try {
            await habit_1.Habit.findOneAndUpdate({ userId: userId }, { $push: { habitEntries: newHabitEntry } });
            await schedule_1.Schedule.findOneAndUpdate({ userId: userId }, { $push: { scheduleList: newScheduleEntry } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({ _id: newHabitEntry._id });
    }
};
exports.updateHabitEntryStatus = updateHabitEntryStatus;
const updateHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, weekdays, time, targetDate, _id, isArchived, alarmUsed, clientCurrentWeekStartTime, clientTimezoneOffset } = req.body;
    const { utcWeekStartMidDay, utcNextWeekStartMidDay, clientWeekStart, clientNextWeekStart } = (0, utility_functions_1.getWeekDates)(clientCurrentWeekStartTime, clientTimezoneOffset);
    let existingEntriesCluster;
    let habitListCluster;
    try {
        habitListCluster = await habit_1.Habit.findOne({ userId: userId }, { habitList: { $elemMatch: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    try {
        await habit_1.Habit.findOneAndUpdate({ userId: userId, "habitList._id": _id }, { $set: {
                "habitList.$.title": title,
                "habitList.$.weekdays": weekdays,
                "habitList.$.time": time,
                "habitList.$.targetDate": targetDate,
                "habitList.$.isArchived": isArchived,
                "habitList.$.alarmUsed": alarmUsed,
            }
        });
        existingEntriesCluster = await habit_1.Habit.findOne({ userId: userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $and: [{ $gte: ["$$entry.date", clientWeekStart] }, { $lt: ["$$entry.date", clientNextWeekStart] }, { $eq: ["$$entry.habitId", _id] }] } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    const selectedHabit = habitListCluster.habitList[0];
    const selectedHabitEntries = existingEntriesCluster.habitEntries;
    // Repopulate habit with new entries for current week if weekdays or target date change
    const weekdaysChange = Object.values(weekdays).toString() !== Object.values(selectedHabit.weekdays).toString();
    const oldTargetDate = selectedHabit.targetDate ? new Date(selectedHabit.targetDate).toISOString() : null;
    const newTargetDate = targetDate ? new Date(targetDate).toISOString() : null;
    if (weekdays && (weekdaysChange || oldTargetDate !== newTargetDate)) {
        const { newHabitEntries, newScheduleEntries } = (0, utility_functions_1.createHabitEntries)({ ...selectedHabit, title, weekdays, time, targetDate, _id, isArchived }, utcWeekStartMidDay, utcNextWeekStartMidDay, false, selectedHabitEntries);
        // Delete old habit and schedule entries
        try {
            await habit_1.Habit.updateMany({ userId: userId }, { $pull: { habitEntries: { habitId: _id, date: { $gte: clientWeekStart, $lt: clientNextWeekStart } } } }, { "multi": true });
            await schedule_1.Schedule.updateMany({ userId: userId }, { $pull: { scheduleList: { parentId: _id, date: { $gte: clientWeekStart, $lt: clientNextWeekStart } } } }, { "multi": true });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        // Push new habit and schedule entries
        try {
            await habit_1.Habit.findOneAndUpdate({ userId: userId }, { $push: { habitEntries: { $each: newHabitEntries } } });
            await schedule_1.Schedule.findOneAndUpdate({ userId: userId }, { $push: { scheduleList: { $each: newScheduleEntries } } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({ habitEntries: newHabitEntries });
    }
    else {
        res.status(200).send("Habit updated successfully.");
    }
};
exports.updateHabit = updateHabit;
const populateHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedWeekStartTime, clientTimezoneOffset, _id } = req.body;
    const { utcWeekStartMidDay, utcNextWeekStartMidDay } = (0, utility_functions_1.getWeekDates)(clientSelectedWeekStartTime, clientTimezoneOffset);
    // Get existing habit
    let habitListCluster;
    try {
        habitListCluster = await habit_1.Habit.findOne({ userId: userId }, { habitList: { $elemMatch: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send("Failed to populate habit.");
    }
    // Create new entries and schedule items
    const habitItem = habitListCluster.habitList[0];
    const { newHabitEntries, newScheduleEntries } = (0, utility_functions_1.createHabitEntries)(habitItem, utcWeekStartMidDay, utcNextWeekStartMidDay, true, null);
    // Push populated entries
    try {
        await habit_1.Habit.findOneAndUpdate({ userId: userId }, { $push: { habitEntries: { $each: newHabitEntries } } });
        await schedule_1.Schedule.findOneAndUpdate({ userId: userId }, { $push: { scheduleList: { $each: newScheduleEntries } } });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Send newly populated entries ids and schedule entries
    res.status(200).json({ habitEntries: newHabitEntries });
};
exports.populateHabit = populateHabit;
const updateHabitArchiveStatus = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, weekdays, time, targetDate, _id, isArchived, clientCurrentWeekStartTime, clientTimezoneOffset } = req.body;
    const { utcWeekStartMidDay, utcNextWeekStartMidDay, clientWeekStart, clientNextWeekStart } = (0, utility_functions_1.getWeekDates)(clientCurrentWeekStartTime, clientTimezoneOffset);
    // Update archivation status of habit and its schedule entries
    try {
        await habit_1.Habit.findOneAndUpdate({ userId: userId, "habitList._id": _id }, { $set: { "habitList.$.isArchived": isArchived } });
        await schedule_1.Schedule.findOneAndUpdate({ userId: userId, "scheduleList._id": _id }, { $set: { "habitList.$.isArchived": isArchived } });
    }
    catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Send existing entries for this week if habit is restored
    if (!isArchived) {
        let habitEntriesCluster;
        try {
            habitEntriesCluster = await habit_1.Habit.findOne({ userId: userId }, { habitEntries: { $filter: { input: "$habitEntries", as: "entry", cond: { $and: [{ $gte: ["$$entry.date", clientWeekStart] }, { $lt: ["$$entry.date", clientNextWeekStart] }, { $eq: ["$$entry.habitId", _id] }] } } } });
        }
        catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        const existingEntries = habitEntriesCluster.habitEntries;
        res.status(200).json({ existingEntries });
    }
    else {
        res.status(200).send("Habit successfully archived.");
    }
};
exports.updateHabitArchiveStatus = updateHabitArchiveStatus;
const deleteHabit = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await habit_1.Habit.findOneAndUpdate({ userId: userId }, { $pull: { habitList: { "_id": _id } } });
        await habit_1.Habit.updateMany({ userId: userId }, { $pull: { habitEntries: { "habitId": _id } } }, { "multi": true });
        // Delete paired schedule item
        const scheduleRes = await (0, schedule_controllers_1.deletePairedScheduleItem)(userId, _id);
        if (!scheduleRes) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send("Failed to delete habit.");
    }
    res.status(200).send("Successfully deleted habit");
};
exports.deleteHabit = deleteHabit;
//# sourceMappingURL=habit-controllers.js.map