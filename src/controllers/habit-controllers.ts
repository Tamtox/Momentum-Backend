import { RequestHandler } from "express";
import { HabitEntryInterface, HabitsListItemInterface } from "../models/habit";
const {Habit,HabitEntry,HabitsListItem} = require('../models/habit');

// Habit Entries generation algorithm | null if no entry , true if placeholder until status change , entry if it exists
const populateWeekWithHabitEntries = (habitItem:HabitsListItemInterface,weekStartTime:number,populateBeforeCreationDate?:boolean,selectedHabitEntries?:HabitEntryInterface[]) => {
    const newHabitEntries:{[weekday:number]:HabitEntryInterface|null|boolean} = {1:null,2:null,3:null,4:null,5:null,6:null,0:null};
    const habitId = habitItem._id;
    for(let i = 1;i<=7;i++) {
        const date = weekStartTime + 86400000 * (i-1);
        const weekday = i === 7 ? 0 : i;
        let dateCompleted:Date|null = null;
        let status = 'Pending';
        // Stop creating entries if selected date is before habit creation week's start
        const habitCreationTime = new Date(habitItem.creationDate).getTime() + habitItem.creationUTCOffset * - 60000;
        const habitCreationDatesWeekStart = new Date(habitCreationTime).setHours(12,0,0,0) + 86400000 * (new Date(habitCreationTime).getDay()? 1- new Date(habitCreationTime).getDay() : -6);
        if(habitCreationDatesWeekStart>weekStartTime+86400000*7-1 && !populateBeforeCreationDate) {
            break;
        }
        // Stop creating entries if target paired goals date has been reached
        if(habitItem.goalTargetDate) {
            if(date > new Date(habitItem.goalTargetDate).getTime()) {
                break;
            }
        }
        // Check if existing entry status is complete
        if(selectedHabitEntries) {
            selectedHabitEntries.forEach((entry:HabitEntryInterface)=>{
                if(new Date(entry.date).getDay() === weekday ) {
                    entry.status === 'Complete' ? status = 'Complete' : status = 'Pending';
                    dateCompleted = entry.dateCompleted;
                }
            })
        }
        if(habitItem.weekdays[weekday]) {
            newHabitEntries[weekday] = true;
            if(populateBeforeCreationDate || selectedHabitEntries) {
                const newHabitEntry:HabitEntryInterface = new HabitEntry({date:new Date(date),habitId,status,isArchived:false,dateCompleted});
                newHabitEntries[weekday] = newHabitEntry;
            }
        }
    }
    return newHabitEntries;
}

// Attach habit entries to habits
const attachEntriesToItems = (habitList:HabitsListItemInterface[],habitEntries:HabitEntryInterface[],weekStartTime:number) => {
    const habitEntriesCpy = [...habitEntries];
    const newhabitList = habitList.map((habitListItem:any)=>{
        // Create blank entries
        const newHabitEntries = populateWeekWithHabitEntries(habitListItem,weekStartTime);
        habitListItem._doc.entries = newHabitEntries;
        const habitId = habitListItem.id;
        // Insert actual entries 
        for(let i = 0; i < habitEntriesCpy.length; i++) {
            if(habitId === habitEntriesCpy[i].habitId) {
                const weekday = new Date(habitEntriesCpy[i].date).getDay();
                habitListItem._doc.entries[weekday] =  habitEntriesCpy[i];
                habitEntriesCpy.splice(i,1);
                i--;
            }
        }
        return habitListItem;
    })
    return newhabitList;
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
    const habitList = attachEntriesToItems(habitListCluster.habitList,habitEntriesCluster.habitEntries,utcWeekStartMidDay);
    res.status(200).json({habitList});
}

const getArchivedHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    let archivedHabitListCluster;
    try { 
        archivedHabitListCluster = await Habit.findOne({userId:userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",true]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.");
    }
    res.status(200).json({archivedHabitList:archivedHabitListCluster.habitList});
}

const addNewHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {title,weekdays,creationDate,time,goalTargetDate,alarmUsed,creationUTCOffset,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    let newHabit:HabitsListItemInterface = new HabitsListItem({title,weekdays,creationDate,time,goalTargetDate,alarmUsed,creationUTCOffset});
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitList:newHabit}});
    } catch (error) {
        return res.status(500).send("Failed to add new habit.");
    }
    newHabit = attachEntriesToItems([newHabit],[],utcWeekStartMidDay)[0];
    res.status(200).json({newHabit});
}

const updateHabitEntryStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {status,habitId,dateCompleted,_id,date} = req.body as HabitEntryInterface;
    // Updates status for existing exntry and creates for blank entry
    if(_id) {
        try {
            await Habit.findOneAndUpdate(
                {userId:userId,"habitEntries._id":_id},
                {$set:{[`habitEntries.$.status`]:status,"habitEntries.$.dateCompleted":dateCompleted}})
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
        existingEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]},{$eq:["$$entry.habitId",_id]}]}}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    const selectedHabit = habitListCluster.habitList[0];
    const selectedHabitEntries = existingEntriesCluster.habitEntries;
    // Repopulate habit entries based on updated habit if weekdays change
    if(weekdays && (Object.values(weekdays).toString() !== Object.values(selectedHabit.weekdays).toString())) {
        const newEntries:{[weekday:number]:HabitEntryInterface|null|boolean} = populateWeekWithHabitEntries({...selectedHabit,title,weekdays,time,goalId,goalTargetDate,_id,isArchived},utcWeekStartMidDay,false,selectedHabitEntries);
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
        const completeEntries = Object.values(newEntries).filter((entry:HabitEntryInterface|null|boolean) => {
            if(typeof(entry) === 'object') {
                if(entry?.status === 'Complete') {
                    return entry;
                }
            }
        });
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:completeEntries}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({newEntries});
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
    // Create new entries
    const populatedEntries:{[weekday:number]:HabitEntryInterface|null|boolean} = populateWeekWithHabitEntries(habitListCluster.habitList[0],utcWeekStartMidDay,true);
    // Push populated entries
    const entries = Object.values(populatedEntries).filter((entry:HabitEntryInterface|null|boolean) => {
        if(typeof(entry) === 'object') {
            return entry;
        }
    });
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:entries}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.");
    }
    res.status(200).json({populatedEntries});
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
    // Populate habit entries for this week if habit is restored
    if(!isArchived) {
        let habitEntriesCluster;
        try{
            habitEntriesCluster = await Habit.findOne({userId:userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$and:[{$gte:["$$entry.date",clientWeekStart]},{$lt:["$$entry.date",clientNextWeekStart]},{$eq:["$$entry.habitId",_id]}]}}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        const selectedHabitEntries = habitEntriesCluster.habitEntries;
        const newEntries:{[weekday:number]:HabitEntryInterface|null|boolean} = populateWeekWithHabitEntries(req.body,utcWeekStartMidDay,false,selectedHabitEntries);
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
        const completeEntries = Object.values(newEntries).filter((entry:HabitEntryInterface|null|boolean) => {
            if(typeof(entry) === 'object') {
                if(entry?.status === 'Complete') {
                    return entry;
                }
            }
        });
        try {
            await Habit.findOneAndUpdate({userId:userId},{$push:{habitEntries:{$each:completeEntries}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        res.status(200).json({newEntries});
    } else {
        res.status(200).send("Habit successfully archived.");
    }
}

const deleteHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {_id} = req.body as {_id:string};
    try {
        await Habit.findOneAndUpdate({userId:userId},{$pull:{habitList:{"_id":_id}}});
        // Delete entries
        await Habit.updateMany(
            {userId:userId},
            {$pull:{habitEntries:{"habitId":_id}}},
            {"multi": true}
        );   
    } catch (error) {
        return res.status(500).send("Failed to delete habit.");
    }
    res.status(200).send("Successfully deleted habit");
}

export {getHabits,getArchivedHabits,addNewHabit,populateHabit,updateHabitEntryStatus,updateHabit,updateHabitArchiveStatus,deleteHabit};


// Habit Entries generation algorithm
// const populateWeekWithHabitEntries = (habitList:HabitsListItemInterface[],weekStartTime:number,populateBeforeCreationDate?:boolean,selectedHabitEntries?:any[]) => {
//     const newHabitEntries:HabitEntryInterface[] = [];
//     for (let habitListItem of habitList ) {
//         const habitId = habitListItem._id;
//         for(let i = 1;i<=7;i++) {
//             const date = weekStartTime + 86400000 * (i-1);
//             const weekday = i===7 ? 0 : i;
//             const dateCompleted = null;
//             let status = 'Pending';
//             // Stop creating entries if selected date is before habit creation week's start
//             const habitCreationTime = new Date(habitListItem.creationDate).getTime() + habitListItem.creationUTCOffset * - 60000;
//             const habitCreationDatesWeekStart = new Date(habitCreationTime).setHours(12,0,0,0) + 86400000 * (new Date(habitCreationTime).getDay()? 1- new Date(habitCreationTime).getDay() : -6);
//             if(habitCreationDatesWeekStart>weekStartTime+86400000*7 -1 && !populateBeforeCreationDate) {
//                 break;
//             }
//             // Stop creating entries if target paired goals date has been reached
//             if(habitListItem.goalTargetDate) {
//                 if(date > new Date(habitListItem.goalTargetDate).getTime()) {
//                     break;
//                 }
//             }
//             // Check if existing entry status is complete
//             if(selectedHabitEntries) {
//                 selectedHabitEntries.map((entry:HabitEntryInterface)=>{
//                     if(new Date(entry.date).getDay() == weekday ) {
//                         entry.status === 'Complete' ? status = 'Complete' : status = 'Pending';
//                     }
//                 })
//             }
//             if(habitListItem.weekdays[weekday]) {
//                 const newHabitEntry = new HabitEntry({date:new Date(date),habitId,status,isArchived:false,dateCompleted});
//                 newHabitEntries.push(newHabitEntry);
//             }
//         }
//     }
//     return newHabitEntries
// }