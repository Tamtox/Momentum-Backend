"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.updateGoal = exports.addNewGoal = exports.getArchivedGoals = exports.getGoals = void 0;
const { Goal, GoalItem, GoalItemInterface } = require('../models/goal');
const getGoals = async (req, res, next) => {
    const userId = req.params.userId;
    let goalCluster;
    try {
        goalCluster = await Goal.findOne({ userId: userId }, { goalList: { $filter: { input: "$goalList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
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
        goalCluster = await Goal.findOne({ userId: userId }, { goalList: { $filter: { input: "$goalList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
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
    const newGoalItem = new GoalItem({ title, creationDate, targetDate, status, creationUTCOffset, alarmUsed });
    try {
        await Goal.findOneAndUpdate({ userId: userId }, { $push: { goalList: newGoalItem } });
    }
    catch (error) {
        return res.status(500).send('Failed to add new goal.');
    }
    // Returns an object
    res.status(201).send(newGoalItem);
};
exports.addNewGoal = addNewGoal;
const updateGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { title, targetDate, status, dateCompleted, habitId, _id, isArchived, alarmUsed } = req.body;
    ;
    try {
        await Goal.findOneAndUpdate({ userId: userId, "goalList._id": _id }, { $set: {
                "goalList.$.title": title,
                "goalList.$.targetDate": targetDate,
                "goalList.$.status": status,
                "goalList.$.dateCompleted": dateCompleted,
                "goalList.$.habitId": habitId,
                "goalList.$.isArchived": isArchived,
                "goalList.$.alarmUsed": alarmUsed,
            } });
    }
    catch (error) {
        return res.status(500).send('Failed to update goal.');
    }
    res.status(200).send("Successfully updated goal");
};
exports.updateGoal = updateGoal;
const deleteGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Goal.findOneAndUpdate({ userId: userId }, { $pull: { goalList: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send("Failed to delete goal.");
    }
    res.status(200).send("Successfully deleted goal");
};
exports.deleteGoal = deleteGoal;
