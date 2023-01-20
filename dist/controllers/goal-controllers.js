"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.updateGoal = exports.addNewGoal = exports.getArchivedGoals = exports.getGoals = void 0;
const goal_1 = require("../models/goal");
const schedule_controllers_1 = require("./schedule-controllers");
const getGoals = async (req, res, next) => {
    const userId = req.params.userId;
    let goalCluster;
    try {
        goalCluster = await goal_1.Goal.findOne({ userId: userId }, { goalList: { $filter: { input: "$goalList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve goal data.');
    }
    // Returns an array of objects
    res.status(200).send(goalCluster.goalList);
};
exports.getGoals = getGoals;
const getArchivedGoals = async (req, res, next) => {
    const userId = req.params.userId;
    let goalCluster;
    try {
        goalCluster = await goal_1.Goal.findOne({ userId: userId }, { goalList: { $filter: { input: "$goalList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve goal data.');
    }
    // Returns an array of objects
    res.status(200).send(goalCluster.goalList);
};
exports.getArchivedGoals = getArchivedGoals;
const addNewGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, creationDate, targetDate, status, creationUTCOffset, alarmUsed } = req.body;
    const newGoalItem = new goal_1.GoalItem({ title, creationDate, targetDate, status, creationUTCOffset, alarmUsed });
    let scheduleItem;
    try {
        await goal_1.Goal.findOneAndUpdate({ userId: userId }, { $push: { goalList: newGoalItem } });
        // Add paired schedule item
        scheduleItem = await (0, schedule_controllers_1.addPairedScheduleItem)(null, targetDate, title, 'goal', alarmUsed, creationUTCOffset, newGoalItem._id, userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send('Failed to add new goal.');
    }
    const response = { goalId: newGoalItem._id, scheduleId: "" };
    if (scheduleItem !== true) {
        response.scheduleId = scheduleItem._id;
    }
    res.status(200).json(response);
};
exports.addNewGoal = addNewGoal;
const updateGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, targetDate, status, dateCompleted, _id, isArchived, alarmUsed, creationUTCOffset } = req.body;
    let scheduleItem;
    try {
        await goal_1.Goal.findOneAndUpdate({ userId: userId, "goalList._id": _id }, { $set: {
                "goalList.$.title": title,
                "goalList.$.targetDate": targetDate,
                "goalList.$.status": status,
                "goalList.$.dateCompleted": dateCompleted,
                "goalList.$.isArchived": isArchived,
                "goalList.$.alarmUsed": alarmUsed,
            } });
        scheduleItem = await (0, schedule_controllers_1.updatePairedScheduleItem)(null, targetDate, title, "goal", alarmUsed, creationUTCOffset, isArchived, dateCompleted, status, _id, userId);
        if (!scheduleItem) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send('Failed to update goal.');
    }
    if (scheduleItem !== true) {
        res.status(200).json({ scheduleId: scheduleItem._id });
    }
    else {
        res.status(200).send("Successfully updated goal.");
    }
};
exports.updateGoal = updateGoal;
const deleteGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await goal_1.Goal.findOneAndUpdate({ userId: userId }, { $pull: { goalList: { "_id": _id } } });
        const scheduleRes = await (0, schedule_controllers_1.deletePairedScheduleItem)(userId, _id);
        if (!scheduleRes) {
            throw new Error("Failed");
        }
    }
    catch (error) {
        return res.status(500).send("Failed to delete goal.");
    }
    res.status(200).send("Successfully deleted goal");
};
exports.deleteGoal = deleteGoal;
//# sourceMappingURL=goal-controllers.js.map