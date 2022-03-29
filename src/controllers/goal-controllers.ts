import { RequestHandler } from "express";
const {Goal,GoalItem} = require('../models/goal');
const {Habit,HabitEntry,HabitsListItem} = require('../models/habit');

const getGoals:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let goalCluster
    try {
        goalCluster = await Goal.findOne({"_id":userId});
    } catch (error) {
        return res.status(500).send('Failed to retrieve goal data.')
    }
    // Returns an array of objects
    res.status(200).send(goalCluster.goalList)
}

const addNewGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {goalTitle,goalCreationDate,goalTargetDate,goalStatus} = req.body as {goalTitle:string,goalCreationDate:string,goalTargetDate:string,goalStatus:string};
    const newGoalItem = new GoalItem({goalTitle,goalCreationDate,goalTargetDate,goalStatus});
    try {
        await Goal.findOneAndUpdate({_id:userId},{$push:{goalList:newGoalItem}})
    } catch (error) {
        return res.status(500).send('Failed to add new goal.')
    }
    // Returns an object
    res.status(201).send(newGoalItem)
}

const updateGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {goalTitle,goalTargetDate,goalStatus,habitId,_id} = req.body;
    try {
        await Goal.findOneAndUpdate(
            {_id:userId,"goalList._id":_id},
            {$set:{
                "goalList.$.goalTitle":goalTitle,
                "goalList.$.goalTargetDate":goalTargetDate,
                "goalList.$.goalStatus":goalStatus,
                "goalList.$.habitId":habitId,
            }}
        )
    } catch (error) {
        return res.status(500).send('Failed to update goal.')
    }
    res.status(200).send("Successfully updated goal")
}

const deleteGoal:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {_id} = req.body as {_id:string}
    try {
        await Goal.findOneAndUpdate({_id:userId},{$pull:{goalList:{"_id":_id}}})
    } catch (error) {
        return res.status(500).send("Failed to delete goal.")
    }
    res.status(200).send("Successfully deleted goal")
}

exports.getGoals = getGoals
exports.addNewGoal = addNewGoal
exports.updateGoal = updateGoal
exports.deleteGoal = deleteGoal