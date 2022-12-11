import { RequestHandler } from "express";
import { Habit,HabitEntry,HabitsListItem,HabitEntryInterface, HabitsListItemInterface } from "../models/habit";
import { Schedule,ScheduleItem,ScheduleItemInterface } from "../models/schedule";
import { addPairedScheduleItem, updatePairedScheduleItem,deletePairedScheduleItem } from "./schedule-controllers";

// Habit Entries generation algorithm | null if no entry , true if placeholder until status change , entry if it exists
const createHabitEntries = (habitItem:HabitsListItemInterface,startTime:number,endTime:number,populateBeforeCreationDate?:boolean,existingHabitEntries?:HabitEntryInterface[]) => {
    const newHabitEntries:{[weekday:number]:HabitEntryInterface|null|boolean} = {1:null,2:null,3:null,4:null,5:null,6:null,0:null};
    const newHabitSchedule:ScheduleItemInterface[] = []
    const habitId = habitItem._id;
    for (let currentTime = startTime; currentTime < endTime; currentTime += 86400000) {
        const date = new Date(currentTime).setHours(12,0,0,0);
        const weekday = new Date(currentTime).getDay();
        const weekStartTime = new Date(currentTime).setHours(0,0,0,0) + 86400000 * (weekday? 1 - weekday : -6);
        let dateCompleted:Date|null = null;
        let status = 'Pending';
        // Stop creating entries if selected date is before habit creation week's start
        const habitCreationTime = new Date(habitItem.creationDate).getTime() + habitItem.creationUTCOffset * - 60000;
        const habitCreationWeekday = new Date(habitCreationTime).getDay();
        const habitCreationDatesWeekStart = new Date(habitCreationTime).setHours(12,0,0,0) + 86400000 * (habitCreationWeekday ? 1 - habitCreationWeekday : -6);
        if(habitCreationDatesWeekStart > weekStartTime + 86400000 * 7 - 1 && !populateBeforeCreationDate) break;
        // Stop creating entries if target paired goals date has been reached
        if(habitItem.goalTargetDate && date > new Date(habitItem.goalTargetDate).getTime()) break;
        // Check if existing entry status is complete
        if(existingHabitEntries) {
            existingHabitEntries.forEach((entry:HabitEntryInterface)=>{
                if (new Date(entry.date).getDay() === weekday ) {
                    status = entry.status;
                    dateCompleted = entry.dateCompleted;
                }
            })
        }
        if(habitItem.weekdays[weekday]) {
            newHabitEntries[weekday] = true;
            if (populateBeforeCreationDate) {
                const newHabitEntry:HabitEntryInterface = new HabitEntry({date,habitId,status,dateCompleted});
                newHabitEntries[weekday] = newHabitEntry;
            }
            if (existingHabitEntries && status === "Complete") {
                const newHabitEntry:HabitEntryInterface = new HabitEntry({date,habitId,status,dateCompleted});
                newHabitEntries[weekday] = newHabitEntry;
            }
            const {time,_id:parentId,title:parentTitle,alarmUsed,creationUTCOffset:utcOffset} = habitItem;
            const newHabitScheduleItem = new ScheduleItem({date,time,parentId,parentTitle,parentType:'habit',alarmUsed,utcOffset});
            newHabitSchedule.push(newHabitScheduleItem);
        }
    }
    return newHabitEntries;
}

// Attach habit entries to habits
const attachEntriesToItems = (habitList:HabitsListItemInterface[],habitEntries:HabitEntryInterface[],startTime:number,endTime:number) => {
    const habitEntriesCpy = [...habitEntries];
    const newhabitList = habitList.map((habitListItem:any)=>{
        // Create blank entries
        const newHabitEntries = createHabitEntries(habitListItem,startTime,endTime);
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
    const utcWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
    const utcNextWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0) + 86400000 * 7;
    const clientWeekStart = new Date(clientWeekStartTime);
    const clientNextWeekStart = new Date(clientWeekStartTime + 86400000 * 7);
    return {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart};
}

const getHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface; 
    const {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart} = getWeekDates(clientSelectedWeekStartTime,clientTimezoneOffset);
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
    const {title,weekdays,creationDate,time,goalTargetDate,alarmUsed,creationUTCOffset,clientCurrentWeekStartTime,clientTimezoneOffset} = req.body as HabitsListItemInterface;
    const {utcWeekStartMidDay,utcNextWeekStartMidDay} = getWeekDates(clientCurrentWeekStartTime,clientTimezoneOffset);
    let newHabit:HabitsListItemInterface = new HabitsListItem({title,weekdays,creationDate,time,goalTargetDate,alarmUsed,creationUTCOffset});
    let scheduleItems;
    try {
        await Habit.findOneAndUpdate({userId:userId},{$push:{habitList:newHabit}});
    } catch (error) {
        return res.status(500).send("Failed to add new habit.");
    }
    const habitEntries = createHabitEntries(newHabit,utcWeekStartMidDay,utcNextWeekStartMidDay,false);
    newHabit = attachEntriesToItems([newHabit],[],utcWeekStartMidDay,utcNextWeekStartMidDay)[0];
    res.status(200).json({habitId:newHabit._id,scheduleEntries:null,habitEntries});
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
    const selectedHabit:HabitsListItemInterface = habitListCluster!.habitList[0];
    const selectedHabitEntries = existingEntriesCluster!.habitEntries;
    // Repopulate habit with new entries for current week if weekdays or target date change
    const weekdaysChange = Object.values(weekdays).toString() !== Object.values(selectedHabit.weekdays).toString();
    let targetDateChange = false;
    if(selectedHabit.goalTargetDate !== goalTargetDate ) targetDateChange = true;
    if(weekdays && (weekdaysChange || targetDateChange)) {
        const newHabitEntries = createHabitEntries({...selectedHabit,title,weekdays,time,goalId,goalTargetDate,_id,isArchived},utcWeekStartMidDay,utcNextWeekStartMidDay,false,selectedHabitEntries);
        // Delete old entries
        try {
            await Habit.updateMany(
                {userId:userId},
                {$pull:{habitEntries:{habitId:_id,date:{$gte:clientWeekStart,$lt:clientNextWeekStart}}}},
                {"multi": true}
            )
        } catch (error) {
            return res.status(500).send("Failed to update habit.");
        }
        // Push new entries
        const completeEntries = Object.values(newHabitEntries).filter((entry:HabitEntryInterface|null|boolean) => {
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
    const populatedEntries = createHabitEntries(habitItem,utcWeekStartMidDay,utcNextWeekStartMidDay,true);
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
        const selectedHabitEntries = habitEntriesCluster!.habitEntries;
        const newEntries = createHabitEntries(req.body,utcWeekStartMidDay,utcNextWeekStartMidDay,false,selectedHabitEntries);
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