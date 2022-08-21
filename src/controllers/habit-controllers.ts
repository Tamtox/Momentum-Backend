import { RequestHandler } from "express";
import { ScheduleItem, ScheduleItemInterface } from "../models/schedule";
import { HabitEntryInterface, HabitsListItemInterface } from "../models/habit";
const {Habit,HabitEntry,HabitsListItem} = require('../models/habit');
const {addPairedScheduleItem,updatePairedScheduleItem,deletePairedScheduleItem} = require('./schedule-controllers');

// Habit Entries generation algorithm
const populateWeekWithHabitEntries = (habitList:HabitsListItemInterface[],weekStartTime:number,populateBeforeCreationDate?:boolean,selectedHabitEntries?:any[]) => {
    const newHabitEntries:HabitsListItemInterface[] = [];
    const newHabitScheduleItems:ScheduleItemInterface[] = [];
    for (let habitListItem of habitList ) {
        const habitId = habitListItem._id;
        for(let i = 1;i<=7;i++) {
            const date = weekStartTime + 86400000 * (i-1);
            const weekday = i===7 ? 0 : i;
            const dateCompleted = null;
            let habitEntryStatus = 'Pending';
            // Stop creating entries if selected date is before habit creation week's start
            const habitCreationTime = new Date(habitListItem.creationDate).getTime() + habitListItem.creationUTCOffset * - 60000;
            const habitCreationDatesWeekStart = new Date(habitCreationTime).setHours(12,0,0,0) + 86400000 * (new Date(habitCreationTime).getDay()? 1- new Date(habitCreationTime).getDay() : -6);
            if(habitCreationDatesWeekStart>weekStartTime+86400000*7 -1 && !populateBeforeCreationDate) {
                break;
            }
            // Stop creating entries if target paired goals date has been reached
            if(habitListItem.goalTargetDate) {
                if(date > new Date(habitListItem.goalTargetDate).getTime()) {
                    break;
                }
            }
            // Check if existing entry status is complete
            if(selectedHabitEntries) {
                selectedHabitEntries.map((entry:any)=>{
                    if(new Date(entry.date).getDay() == weekday ) {
                        entry.habitEntryStatus === 'Complete' ? habitEntryStatus = 'Complete' : habitEntryStatus = 'Pending';
                    }
                })
            }
            if(habitListItem.weekdays[weekday]) {
                const newHabitEntry = new HabitEntry({date:new Date(date),habitId,habitEntryStatus,isArchived:false,dateCompleted});
                const newScheduleItem = new ScheduleItem({date:new Date(date),parentId:habitListItem._id,parentTitle:habitListItem.title})
                newHabitEntries.push(newHabitEntry);
            }
        }
    }
    return newHabitEntries
}

const getWeekDates = (clientWeekStartTime:number,timezoneOffset:number) => {
    const utcWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0)
    const clientWeekStart = new Date(clientWeekStartTime);
    const clientNextWeekStart = new Date(clientWeekStartTime+86400000*7);
    return {utcWeekStartMidDay,clientWeekStart,clientNextWeekStart};
}

const getHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface; 
    const {utcWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientSelectedWeekStartTime,clientTimezoneOffset);
    let habitListCluster;
    let habitEntriesCluster;
    try { 
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
        habitEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]}]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.")
    }   
    // Create habit entries for the week of selected day if they do not exist 
    if(habitEntriesCluster.habitEntries.length < 1) {
        const newHabitEntries:any[] = populateWeekWithHabitEntries(habitListCluster.habitList,utcWeekStartMidDay);
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}})
        } catch (error) {
            return res.status(500).send("Failed to retrieve habit data.")
        }
        res.status(200).json({habitList:habitListCluster.habitList,habitEntries:newHabitEntries})
    } else {
        res.status(200).json({habitList:habitListCluster.habitList,habitEntries:habitEntriesCluster.habitEntries})
    }
}

const getArchivedHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    let archivedHabitListCluster
    try { 
        archivedHabitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",true]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.")
    }
    res.status(200).json({archivedHabitList:archivedHabitListCluster.habitList})
}

const addNewHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,weekdays,creationDate,time,goalTargetDate,alarmUsed,creationUTCOffset,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    const newHabit = new HabitsListItem({title,weekdays,creationDate,time,goalTargetDate,alarmUsed,creationUTCOffset});
    const newHabitEntries:any[] = populateWeekWithHabitEntries([newHabit],utcWeekStartMidDay);
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitList:newHabit}},)
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}})
    } catch (error) {
        return res.status(500).send("Failed to add new habit.")
    }
    res.status(200).json({newHabit,newHabitEntries})
}

const updateHabitEntryStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {habitEntryStatus,dateCompleted,_id} = req.body as HabitEntryInterface;
    try {
        await Habit.findOneAndUpdate(
            {userId:userId,"habitEntries._id":_id},
            {$set:{[`habitEntries.$.habitEntryStatus`]:habitEntryStatus,"habitEntries.$.dateCompleted":dateCompleted}})
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    res.status(200).send("Successfully updated habit")
}

const updateHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,weekdays,time,goalId,goalTargetDate,_id,isArchived,alarmUsed,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
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
                "habitList.$.goalId":goalId,
                "habitList.$.goalTargetDate":goalTargetDate,
                "habitList.$.isArchived":isArchived,
                "habitList.$.alarmUsed":alarmUsed,
            }
        })
        existingEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]}]}}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    const selectedHabit = habitListCluster.habitList[0];
    const selectedHabitEntries = existingEntriesCluster.habitEntries.filter((entry:any)=>{
        if(entry.habitId === _id) {
            return entry
        }
    })
    // // Repopulate habit entries based on updated habit if weekdays change
    if(weekdays && (Object.values(weekdays).toString() !== Object.values(selectedHabit.weekdays).toString())) {
        const newHabitEntries:any[] = populateWeekWithHabitEntries([{...selectedHabit,title,weekdays,time,goalId,goalTargetDate,_id,isArchived}],utcWeekStartMidDay,false,selectedHabitEntries);
        // Delete old entries
        try {
            await Habit.updateMany(
                {userId:userId},
                {$pull:{habitEntries:{habitId:_id,date:{$gte:new Date(clientWeekStart),$lt:clientNextWeekStart}}}},
                {"multi": true}
            )
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        // Push new entries
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.")
        }
        res.status(200).send(newHabitEntries);
    } else {
        res.status(200).send("Habit updated successfully.")
    }
}

const populateHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {clientSelectedWeekStartTime,clientTimezoneOffset,_id} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientSelectedWeekStartTime,clientTimezoneOffset);
    // Get existing habit
    let habitListCluster;
    try {
        habitListCluster = await Habit.findOne({userId:userId},{habitList:{$elemMatch:{"_id":_id}}});
    } catch (error) {
        return res.status(500).send("Failed to populate habit.");
    }
    const selectedHabit = habitListCluster.habitList[0];
    // Create new entries
    const newPopulatedEntries:any[] = populateWeekWithHabitEntries([selectedHabit],utcWeekStartMidDay,true);
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newPopulatedEntries}}});
    } catch (error) {
        return res.status(500).send("Failed to populate habit.");
    }
    res.status(200).json({newPopulatedEntries});
}

const updateHabitArchiveStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,weekdays,time,goalId,goalTargetDate,_id,isArchived,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    // Update archivation status in habit list
    try {
        await Habit.findOneAndUpdate(
            {userId:userId,"habitList._id":_id},
            {$set:{
                "habitList.$.isArchived":isArchived
            }
        })
    } catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Populate habit entries for this week if restored habit has none
    if(!isArchived) {
        let habitEntriesCluster
        try{
            habitEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]}]}}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        const habitEntries = habitEntriesCluster.habitEntries.filter((item:any)=>item.habitId === _id);
        if(habitEntries.length < 1) {
            const newHabitEntries:any[] = populateWeekWithHabitEntries([req.body],utcWeekStartMidDay);
            try {
                await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}});
            } catch (error) {
                return res.status(500).send("Failed to update habit.");
            }
            res.status(200).json({habitEntries:newHabitEntries});
        } else {
            res.status(200).json({habitEntries:habitEntriesCluster.habitEntries});
        }
    } else {
        res.status(200).send("Habit successfully archived.");
    }
}

const deleteHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {_id} = req.body as {_id:string}
    try {
        await Habit.findOneAndUpdate({userId:userId},{$pull:{habitList:{"_id":_id}}})
        // Delete entries
        await Habit.updateMany(
            {userId:userId},
            {$pull:{habitEntries:{"habitId":_id}}},
            {"multi": true}
        )
        // Delete schedule items
        const scheduleItemDelete = await deletePairedScheduleItem(_id,userId);
        if(!scheduleItemDelete) {
            return res.status(500).send('Failed to delete habit schedule item.');
        }
    } catch (error) {
        return res.status(500).send("Failed to delete habit.")
    }
    res.status(200).send("Successfully deleted habit")
}

export {getHabits,getArchivedHabits,addNewHabit,populateHabit,updateHabitEntryStatus,updateHabit,updateHabitArchiveStatus,deleteHabit};

