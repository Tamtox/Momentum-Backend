import { RequestHandler } from "express";
import { Habit,HabitEntry,HabitsListItem,HabitEntryInterface, HabitsListItemInterface } from "../models/habit";
import { Schedule,ScheduleItem,ScheduleItemInterface } from "../models/schedule";
import { addPairedScheduleItem, updatePairedScheduleItem,deletePairedScheduleItem } from "./schedule-controllers";
import { createHabitEntries,getWeekDates } from "../misc/utility-functions";

const getHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface; 
    const {clientWeekStart,clientNextWeekStart} = getWeekDates(clientSelectedWeekStartTime,clientTimezoneOffset);
    let habitListCluster;
    let habitEntriesCluster;
    try { 
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
        habitEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]}]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.")
    }
    const habitList = habitListCluster!.habitList;
    const habitEntries = habitEntriesCluster!.habitEntries;
    res.status(200).json({habitList,habitEntries});
}

const getArchivedHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    let archivedHabitListCluster;
    try { 
        archivedHabitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",true]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    res.status(200).json({archivedHabitList:archivedHabitListCluster!.habitList});
}

const addNewHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,weekdays,creationDate,time,targetDate,alarmUsed,creationUTCOffset,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    let newHabit:HabitsListItemInterface = new HabitsListItem({title,weekdays,creationDate,time,targetDate,alarmUsed,creationUTCOffset});
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitList:newHabit}});
    } catch (error) {
        return res.status(500).send("Failed to add new habit.");
    }
    // Sends habit id and new schedule entries
    res.status(200).json({habitId:newHabit._id});
}

const updateHabitEntryStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {status,habitId,dateCompleted,_id,date} = req.body as HabitEntryInterface;
    // Updates status for existing entry or creates new habit and schedule entries
    if(_id) {
        try {
            await Habit.findOneAndUpdate({userId:userId,"habitEntries._id":_id},{$set:{[`habitEntries.$.status`]:status,"habitEntries.$.dateCompleted":dateCompleted}});
            await Schedule.findOneAndUpdate({userId:userId,"scheduleList._id":_id},{$set:{[`scheduleList.$.status`]:status,"scheduleList.$.dateCompleted":dateCompleted}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).send("Successfully updated habit");
    } else {
        // Get parent habit
        let habitListCluster;
        try {
            habitListCluster = await Habit.findOne({userId:userId},{habitList:{$elemMatch:{"_id":habitId}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.")
        }
        const selectedHabit:HabitsListItemInterface = habitListCluster!.habitList[0];
        const {time,title,alarmUsed,creationUTCOffset,isArchived} = selectedHabit;
        const newHabitEntry = new HabitEntry({date,status,habitId,dateCompleted});
        let newScheduleEntry:ScheduleItemInterface = new ScheduleItem({
            date,time,parentId:habitId,parentTitle:title,parentType:"habit",alarmUsed,utcOffset:creationUTCOffset,dateCompleted,status,isArchived,_id:newHabitEntry._id
        });
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:newHabitEntry}});
            await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:newScheduleEntry}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({_id:newHabitEntry._id});
    }
}

const updateHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,weekdays,time,targetDate,_id,isArchived,alarmUsed,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    let existingEntriesCluster ;
    let habitListCluster;
    try {
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$elemMatch:{"_id":_id}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    try {
        await Habit.findOneAndUpdate(
            {userId:userId,"habitList._id":_id},
            {$set:{
                "habitList.$.title":title,
                "habitList.$.weekdays":weekdays,
                "habitList.$.time":time,
                "habitList.$.targetDate":targetDate,
                "habitList.$.isArchived":isArchived,
                "habitList.$.alarmUsed":alarmUsed,
            }
        })
        existingEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]},{$eq:["$$entry.habitId",_id]}]}}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    const selectedHabit:HabitsListItemInterface = habitListCluster!.habitList[0];
    const selectedHabitEntries = existingEntriesCluster!.habitEntries;
    // Repopulate habit with new entries for current week if weekdays or target date change
    const weekdaysChange = Object.values(weekdays).toString() !== Object.values(selectedHabit.weekdays).toString();
    const oldTargetDate:string|null = selectedHabit.targetDate ? new Date(selectedHabit.targetDate).toISOString() : null;
    const newTargetDate:string|null = targetDate ? new Date(targetDate).toISOString() : null;
    if(weekdays && (weekdaysChange || oldTargetDate !== newTargetDate)) {
        const {newHabitEntries,newScheduleEntries} = createHabitEntries({...selectedHabit,title,weekdays,time,targetDate,_id,isArchived},utcWeekStartMidDay,utcNextWeekStartMidDay,false,selectedHabitEntries);
        // Delete old habit and schedule entries
        try {
            await Habit.updateMany(
                {userId:userId},
                {$pull:{habitEntries:{habitId:_id,date:{$gte:clientWeekStart,$lt:clientNextWeekStart}}}},
                {"multi": true}
            )
            await Schedule.updateMany(
                {userId:userId},
                {$pull:{scheduleList:{parentId:_id,date:{$gte:clientWeekStart,$lt:clientNextWeekStart}}}},
                {"multi": true}
            )
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        // Push new habit and schedule entries
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}});
            await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:{$each:newScheduleEntries}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({habitEntries:newHabitEntries});
    } else {
        res.status(200).send("Habit updated successfully.")
    }
}

const populateHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {clientSelectedWeekStartTime,clientTimezoneOffset,_id} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,utcNextWeekStartMidDay} = getWeekDates(clientSelectedWeekStartTime,clientTimezoneOffset);
    // Get existing habit
    let habitListCluster;
    try {
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$elemMatch:{"_id":_id}}});
    } catch (error) {
        return res.status(500).send("Failed to populate habit.");
    }
    // Create new entries and schedule items
    const habitItem:HabitsListItemInterface = habitListCluster!.habitList[0];
    const {newHabitEntries,newScheduleEntries} = createHabitEntries(habitItem,utcWeekStartMidDay,utcNextWeekStartMidDay,true,null);
    // Push populated entries
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}});
        await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:{$each:newScheduleEntries}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Send newly populated entries ids and schedule entries
    res.status(200).json({habitEntries:newHabitEntries});
}

const updateHabitArchiveStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,weekdays,time,targetDate,_id,isArchived,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    // Update archivation status of habit and its schedule entries
    try {
        await Habit.findOneAndUpdate({userId:userId,"habitList._id":_id},{$set:{"habitList.$.isArchived":isArchived}});
        await Schedule.findOneAndUpdate({userId:userId,"scheduleList._id":_id},{$set:{"habitList.$.isArchived":isArchived}})
    } catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Send existing entries for this week if habit is restored
    if(!isArchived) {
        let habitEntriesCluster;
        try{
            habitEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]},{$eq:["$$entry.habitId",_id]}]}}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        const existingEntries = habitEntriesCluster!.habitEntries;
        res.status(200).json({existingEntries});
    } else {
        res.status(200).send("Habit successfully archived.");
    }
}

const deleteHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    try {
        await Habit.findOneAndUpdate({userId:userId},{$pull:{habitList:{"_id":_id}}});
        await Habit.updateMany({userId:userId},{$pull:{habitEntries:{"habitId":_id}}},{"multi": true});   
        // Delete paired schedule item
        const scheduleRes:boolean = await deletePairedScheduleItem(userId,_id);
        if (!scheduleRes) {
            throw new Error("Failed");
        }
    } catch (error) {
        return res.status(500).send("Failed to delete habit.");
    }
    res.status(200).send("Successfully deleted habit");
}

export {getHabits,getArchivedHabits,addNewHabit,populateHabit,updateHabitEntryStatus,updateHabit,updateHabitArchiveStatus,deleteHabit};