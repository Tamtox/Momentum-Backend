"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Goal, GoalItem } = require('../models/goal');
const getGoals = async (req, res, next) => {
    const userId = req.params.userId;
    let goalCluster;
    try {
        goalCluster = await Goal.findOne({ "_id": userId }, { goalList: { $filter: { input: "$goalList", as: "item", cond: { $eq: ["$$item.isArchived", false] } } } });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve goal data.');
    }
    // Returns an array of objects
    res.status(200).send(goalCluster.goalList);
};
const getArchivedGoals = async (req, res, next) => {
    const userId = req.params.userId;
    let goalCluster;
    try {
        goalCluster = await Goal.findOne({ "_id": userId }, { goalList: { $filter: { input: "$goalList", as: "item", cond: { $eq: ["$$item.isArchived", true] } } } });
    }
    catch (error) {
        return res.status(500).send('Failed to retrieve goal data.');
    }
    // Returns an array of objects
    res.status(200).send(goalCluster.goalList);
};
const addNewGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { goalTitle, goalCreationDate, goalTargetDate, goalStatus } = req.body;
    const newGoalItem = new GoalItem({ goalTitle, goalCreationDate, goalTargetDate, goalStatus });
    try {
        await Goal.findOneAndUpdate({ _id: userId }, { $push: { goalList: newGoalItem } });
    }
    catch (error) {
        return res.status(500).send('Failed to add new goal.');
    }
    // Returns an object
    res.status(201).send(newGoalItem);
};
const updateGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { goalTitle, goalTargetDate, goalStatus, dateCompleted, habitId, _id, isArchived } = req.body;
    try {
        await Goal.findOneAndUpdate({ _id: userId, "goalList._id": _id }, { $set: {
                "goalList.$.goalTitle": goalTitle,
                "goalList.$.goalTargetDate": goalTargetDate,
                "goalList.$.goalStatus": goalStatus,
                "goalList.$.dateCompleted": dateCompleted,
                "goalList.$.habitId": habitId,
                "goalList.$.isArchived": isArchived,
            } });
    }
    catch (error) {
        return res.status(500).send('Failed to update goal.');
    }
    res.status(200).send("Successfully updated goal");
};
const deleteGoal = async (req, res, next) => {
    const userId = req.params.userId;
    const { _id } = req.body;
    try {
        await Goal.findOneAndUpdate({ _id: userId }, { $pull: { goalList: { "_id": _id } } });
    }
    catch (error) {
        return res.status(500).send("Failed to delete goal.");
    }
    res.status(200).send("Successfully deleted goal");
};
exports.getGoals = getGoals;
exports.getArchivedGoals = getArchivedGoals;
exports.addNewGoal = addNewGoal;
exports.updateGoal = updateGoal;
exports.deleteGoal = deleteGoal;
