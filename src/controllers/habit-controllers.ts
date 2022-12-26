import { RequestHandler } from "express";
import { Habit,HabitEntry,HabitsListItem,HabitEntryInterface, HabitsListItemInterface } from "../models/habit";
import { Schedule,ScheduleItem,ScheduleItemInterface } from "../models/schedule";
import { addPairedScheduleItem, updatePairedScheduleItem,deletePairedScheduleItem } from "./schedule-controllers";
import { createHabitEntries,getWeekDates } from "../misc/utility-functions";

// // Habit Entries generation algorithm | null if no entry , true if placeholder until status change , entry if it exists
// const createHabitEntries = (habitItem:HabitsListItemInterface,startTime:number,endTime:number,populateBeforeCreationDate:boolean,existingHabitEntries:HabitEntryInterface[]|null) => {
//     const newHabitEntries:HabitEntryInterface[] = [];
//     const newScheduleEntries:ScheduleItemInterface[] = [];
//     const habitId = habitItem._id;
//     for (let currentTime = startTime; currentTime < endTime; currentTime += 86400000) {
//         const date = new Date(currentTime).setHours(12,0,0,0);
//         const weekday = new Date(currentTime).getDay();
//         const weekStartTime = new Date(currentTime).setHours(0,0,0,0) + 86400000 * (weekday? 1 - weekday : -6);
//         let dateCompleted:Date|null = null;
//         let status = 'Pending';
//         // Stop creating entries if selected date is before habit creation week's start
//         const habitCreationTime = new Date(habitItem.creationDate).getTime() + habitItem.creationUTCOffset * - 60000;
//         const habitCreationWeekday = new Date(habitCreationTime).getDay();
//         const habitCreationDatesWeekStart = new Date(habitCreationTime).setHours(12,0,0,0) + 86400000 * (habitCreationWeekday ? 1 - habitCreationWeekday : -6);
//         if(habitCreationDatesWeekStart > weekStartTime + 86400000 * 7 - 1 && !populateBeforeCreationDate) break;
//         // Stop creating entries if target paired goals date has been reached
//         if(habitItem.targetDate && date > new Date(habitItem.targetDate).getTime()) break;
//         // Check if existing entry status is complete
//         if(existingHabitEntries) {
//             existingHabitEntries.forEach((entry:HabitEntryInterface)=>{
//                 if (new Date(entry.date).getDay() === weekday ) {
//                     status = entry.status;
//                     dateCompleted = entry.dateCompleted;
//                 }
//             })
//         }
//         if(habitItem.weekdays[weekday]) {
//             if (populateBeforeCreationDate) {
//                 const newHabitEntry:HabitEntryInterface = new HabitEntry({date,habitId,status,dateCompleted});
//                 newHabitEntries.push(newHabitEntry);
//             }
//             if (existingHabitEntries && status === "Complete") {
//                 const newHabitEntry:HabitEntryInterface = new HabitEntry({date,habitId,status,dateCompleted});
//                 newHabitEntries.push(newHabitEntry);
//             }
//             const {time,title,_id,alarmUsed,creationUTCOffset} = habitItem
//             let newScheduleItem:ScheduleItemInterface = new ScheduleItem({date,time,parentId:_id,parentTitle:title,parentType:"habit",alarmUsed,utcOffset:creationUTCOffset,dateCompleted,status});
//             newScheduleEntries.push(newScheduleItem);
//         }
//     }
//     return {newHabitEntries,newScheduleEntries};
// }

// const getWeekDates = (clientWeekStartTime:number,timezoneOffset:number) => {
//     const utcWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
//     const utcNextWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0) + 86400000 * 7;
//     const clientWeekStart = new Date(clientWeekStartTime);
//     const clientNextWeekStart = new Date(clientWeekStartTime + 86400000 * 7);
//     return {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart};
// }   

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
    const {newScheduleEntries} = createHabitEntries(newHabit,utcWeekStartMidDay,utcNextWeekStartMidDay,false,null);
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitList:newHabit}});
        await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:{$each:newScheduleEntries}}});
    } catch (error) {
        return res.status(500).send("Failed to add new habit.");
    }
    res.status(200).json({habitId:newHabit._id,scheduleEntries:newScheduleEntries});
}

const updateHabitEntryStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {status,habitId,dateCompleted,_id,date} = req.body as HabitEntryInterface;
    // Updates status for existing exntry or creates new for blank entry
    if(_id) {
        try {
            await Habit.findOneAndUpdate({userId:userId,"habitEntries._id":_id},{$set:{[`habitEntries.$.status`]:status,"habitEntries.$.dateCompleted":dateCompleted}})
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).send("Successfully updated habit");
    } else {
        const newEntry = new HabitEntry({date,status,habitId,dateCompleted});
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:newEntry}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({_id:newEntry._id});
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
    let targetDateChange = false;
    if(selectedHabit.targetDate !== targetDate ) targetDateChange = true;
    if(weekdays && (weekdaysChange || targetDateChange)) {
        const {newHabitEntries,newScheduleEntries} = createHabitEntries({...selectedHabit,title,weekdays,time,targetDate,_id,isArchived},utcWeekStartMidDay,utcNextWeekStartMidDay,false,selectedHabitEntries);
        // Delete old habit and schedule entries
        try {
            await Habit.updateMany(
                {userId:userId},
                {$pull:{habitEntries:{habitId:_id,date:{$gte:clientWeekStart,$lt:clientNextWeekStart}}}},
                {"multi": true}
            )
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        // Push new habit and schedule entries
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({habitEntries:newHabitEntries,scheduleEntries:newScheduleEntries});
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
    const populatedEntriesIds:{[weekday:number]:string|null} = {0:null,1:null,2:null,3:null,4:null,5:null,6:null};
    newHabitEntries.forEach((entry:HabitEntryInterface) => {
        const weekday = new Date(entry.date).getDay();
        populatedEntriesIds[weekday] = entry._id;
    })
    // Push populated entries
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:newHabitEntries}}});
        await Schedule.findOneAndUpdate({userId:userId},{$push:{scheduleList:{$each:newScheduleEntries}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Send newly populated entries ids and schedule entries
    res.status(200).json({populatedEntriesIds,scheduleEntries:newScheduleEntries});
}

const updateHabitArchiveStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {title,weekdays,time,targetDate,_id,isArchived,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    // Update archivation status in habit list
    try {
        await Habit.findOneAndUpdate({userId:userId,"habitList._id":_id},{$set:{"habitList.$.isArchived":isArchived}})
    } catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    // Populate habit entries for this week if habit is restored
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
    