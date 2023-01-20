"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePairedScheduleItem = exports.updateScheduleItemStatus = exports.updatePairedScheduleItem = exports.addPairedScheduleItem = exports.getSchedule = void 0;
const schedule_1 = require("../models/schedule");
const utility_functions_1 = require("../misc/utility-functions");
const getSchedule = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedDayStartTime, clientTimezoneOffset } = req.body;
    const { utcDayStartMidDay, utcNextDayMidDay, clientDayStart, clientNextDayStart } = (0, utility_functions_1.getDate)(clientSelectedDayStartTime, clientTimezoneOffset);
    let scheduleCluster;
    // Retreives schedule for selected day
    try {
        scheduleCluster = await schedule_1.Schedule.findOne({ userId: userId }, { scheduleList: { $filter: { input: "$scheduleList", as: "item", cond: { $and: [{ $gte: ["$$item.date", clientDayStart] }, { $lt: ["$$item.date", clientNextDayStart] }, { $eq: ["$$item.isArchived", false] }] } } } });
    }
    catch (error) {
        res.status(500).send("Failed to retrieve schedule.");
    }
    const scheduleList = scheduleCluster.scheduleList;
    res.status(200).json({ scheduleList });
};
exports.getSchedule = getSchedule;
const addPairedScheduleItem = async (time, targetDate, parentTitle, parentType, alarmUsed, utcOffset, parentId, userId) => {
    if (targetDate) {
        const { utcDayStartMidDay: date } = (0, utility_functions_1.getDate)(new Date(targetDate).getTime(), Number(utcOffset));
        let scheduleItem = new schedule_1.ScheduleItem({ date, time, parentId, parentTitle, parentType, alarmUsed, utcOffset });
        try {
            await schedule_1.Schedule.findOneAndUpdate({ userId: userId }, { $push: { scheduleList: scheduleItem } });
        }
        catch (error) {
            return false;
        }
        return scheduleItem;
    }
    else {
        return true;
    }
};
exports.addPairedScheduleItem = addPairedScheduleItem;
const updatePairedScheduleItem = async (time, targetDate, parentTitle, parentType, alarmUsed, utcOffset, isArchived, dateCompleted, status, parentId, userId) => {
    // Check old schedule item
    let scheduleCluster;
    try {
        scheduleCluster = await schedule_1.Schedule.findOne({ userId: userId }, { scheduleList: { $elemMatch: { "parentId": parentId } } });
    }
    catch (error) {
        return false;
    }
    const selectedScheduleItem = scheduleCluster.scheduleList[0];
    let scheduleItemResponse;
    // Add new schedule item if there was no old item
    if (!selectedScheduleItem) {
        if (targetDate) {
            const { utcDayStartMidDay: date } = (0, utility_functions_1.getDate)(new Date(targetDate).getTime(), utcOffset);
            let scheduleItem = new schedule_1.ScheduleItem({ date, time, parentId, parentTitle, parentType, alarmUsed, utcOffset });
            try {
                await schedule_1.Schedule.findOneAndUpdate({ userId: userId }, { $push: { scheduleList: scheduleItem } });
            }
            catch (error) {
                return false;
            }
            return scheduleItem;
        }
        else {
            return true;
        }
    }
    else {
        // Delete schedule item if no target date
        if (!targetDate) {
            try {
                await schedule_1.Schedule.updateMany({ userId: userId }, { $pull: { scheduleList: { "parentId": parentId } } }, { "multi": true });
            }
            catch (error) {
                return false;
            }
            return true;
        }
        // Update schedule item
        else {
            let updatedScheduleCluster;
            try {
                await schedule_1.Schedule.findOneAndUpdate({ userId: userId, "scheduleList.parentId": parentId }, { $set: {
                        "scheduleList.$.date": targetDate,
                        "scheduleList.$.time": time,
                        "scheduleList.$.parentTitle": parentTitle,
                        "scheduleList.$.alarmUsed": alarmUsed,
                        "scheduleList.$.isArchived": isArchived,
                        "scheduleList.$.dateCompleted": dateCompleted,
                        "scheduleList.$.status": status,
                    } });
                updatedScheduleCluster = await schedule_1.Schedule.findOne({ userId: userId }, { scheduleList: { $filter: { input: "$scheduleList", as: "item", cond: { $eq: ["$$item.parentId", parentId] } } } });
            }
            catch (error) {
                return false;
            }
            if (isArchived) {
                return true;
            }
            else {
                // Return schedule item if it gets unarchived
                if (selectedScheduleItem.isArchived === true && isArchived === false) {
                    const updatedScheduleItem = updatedScheduleCluster.scheduleList[0];
                    return updatedScheduleItem;
                }
                else {
                    return true;
                }
            }
        }
    }
};
exports.updatePairedScheduleItem = updatePairedScheduleItem;
const updateScheduleItemStatus = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id, dateCompleted } = req.body;
    const status = dateCompleted ? "Complete" : "Pending";
    try {
        await schedule_1.Schedule.findOneAndUpdate({ userId: userId, "scheduleList._id": _id }, { $set: {
                "scheduleList.$.dateCompleted": dateCompleted,
                "scheduleList.$.status": status,
            } });
    }
    catch (error) {
        return res.status(500).send("Failed to update schedule.");
    }
    res.status(200).send("Successfully updated schedule");
};
exports.updateScheduleItemStatus = updateScheduleItemStatus;
const deletePairedScheduleItem = async (userId, parentId) => {
    try {
        await schedule_1.Schedule.updateMany({ userId: userId }, { $pull: { scheduleList: { "parentId": parentId } } }, { "multi": true });
    }
    catch (error) {
        return false;
    }
    return true;
};
exports.deletePairedScheduleItem = deletePairedScheduleItem;
//# sourceMappingURL=schedule-controllers.js.map