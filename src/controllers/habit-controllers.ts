import { RequestHandler } from "express";
const {Habit,HabitEntry,HabitsListItem} = require('../models/habit');

// Habit Entries generation algorithm
const populateWeekWithHabitEntries = (habitList:any[],weekStartTime:number,weekStart:string,weekEnd:string) => {
    const newHabitEntries:any[] = [];
    for (let habitListItem of habitList ) {
        const habitId = habitListItem._id;
        for(let i = 1;i<=7;i++) {
            const weekDate = new Date(weekStartTime + 86400000 * (i-1));
            const year = weekDate.getFullYear();
            const month = weekDate.getMonth() + 1;
            const date = weekDate.getDate();
            const weekday = i===7 ? 0 : i;
            // Stop creating entries if selected date is before habit creation weeks' start
            const creationDateWeekday = new Date(habitListItem.habitCreationDate).getDay();
            const creationDateWeekStart = new Date(new Date(habitListItem.habitCreationDate).getTime() + 86400000 * (creationDateWeekday? 1-creationDateWeekday : -6)).setHours(0,0,0,0);
            if(creationDateWeekStart>weekStartTime+86400000*6) {
                break
            }
            // Stop creating entries if target paired goals date reached
            if(habitListItem.goalTargetDate) {
                if(weekDate.getTime() >= new Date(habitListItem.goalTargetDate).setHours(23,59,59,999)) {
                    break
                }
            }
            if(habitListItem.habitWeekdays[weekday]) {
                const newHabitEntry = new HabitEntry({weekStart,weekEnd,habitId,habitEntryStatus:"Pending",weekday,year,month,date,isArchived:false})
                newHabitEntries.push(newHabitEntry)
            }
        }
    }
    return newHabitEntries
}

// Get week start and end 
const getWeekDates = (date:string) => {
    const weekday = new Date(date).getDay();
    const weekStartTime = new Date(date).setHours(0,0,0,0) + 86400000 * (weekday? 1-weekday : -6);
    const weekStart = new Date(weekStartTime).toLocaleDateString('en-GB');
    const weekEnd = new Date(weekStartTime+86400000*6).toLocaleDateString('en-GB');
    return {weekStartTime,weekStart,weekEnd}
}

const getHabits:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {selectedDate} = req.body as {selectedDate:string}
    let habitListCluster
    let habitEntriesCluster
    const {weekStartTime,weekStart,weekEnd} = getWeekDates(selectedDate);
    try { 
        habitListCluster = await Habit.findOne({"_id":userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",false]}}}});
        habitEntriesCluster = await Habit.findOne({"_id":userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$eq:["$$entry.weekStart",weekStart]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.")
    }
    // Create habit entries for the week of selected day if they do not exist 
    if(habitEntriesCluster.habitEntries.length < 1) {
        const newHabitEntries:any[] = populateWeekWithHabitEntries(habitListCluster.habitList,weekStartTime,weekStart,weekEnd);
        try {
            await Habit.findOneAndUpdate({"_id":userId},{$push:{habitEntries:{$each:newHabitEntries}}})
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
        archivedHabitListCluster = await Habit.findOne({"_id":userId},{habitList:{$filter:{input:"$habitList",as:"item",cond:{$eq:["$$item.isArchived",true]}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve habit data.")
    }
    res.status(200).json({archivedHabitList:archivedHabitListCluster.habitList})
}

const addNewHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {habitTitle,habitWeekdays,habitCreationDate,habitTime,goalTargetDate} = req.body as {habitTitle:string,habitWeekdays:{[key:string]:boolean},habitCreationDate:string,habitTime:string|null,goalTargetDate:string|null};
    const {weekStartTime,weekStart,weekEnd} = getWeekDates(habitCreationDate);
    const newHabit = new HabitsListItem({habitTitle,habitWeekdays,habitCreationDate,habitTime,goalTargetDate});
    const newHabitEntries:any[] = populateWeekWithHabitEntries([newHabit],weekStartTime,weekStart,weekEnd);
    try {
        await Habit.findOneAndUpdate({"_id":userId},{$push:{habitList:newHabit}},)
        await Habit.findOneAndUpdate({"_id":userId},{$push:{habitEntries:{$each:newHabitEntries}}})
    } catch (error) {
        return res.status(500).send("Failed to add new habit.")
    }
    res.status(200).json({newHabit,newHabitEntries})
}

const updateHabitEntryStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {habitEntryStatus,dateCompleted,_id} = req.body as {habitEntryStatus:string,dateCompleted:string,_id:string} 
    try {
        await Habit.findOneAndUpdate(
            {"_id":userId,"habitEntries._id":_id},
            {$set:{[`habitEntries.$.habitEntryStatus`]:habitEntryStatus,"habitEntries.$.dateCompleted":dateCompleted}})
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    res.status(200).send("Successfully updated habit")
}

const updateHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {habitTitle,habitWeekdays,habitTime,goalId,goalTargetDate,_id,isArchived,currentDate} = req.body as {habitTitle:string,habitWeekdays:{[key:string]:boolean},habitTime:string,goalId:string,goalTargetDate:string,_id:string,isArchived:boolean,currentDate:string}
    const {weekStartTime,weekStart,weekEnd} = getWeekDates(currentDate);
    let existingEntriesCluster 
    let habitListCluster
    try {
        habitListCluster = await Habit.findOne({"_id":userId},{habitList:{$elemMatch:{"_id":_id}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    try {
        await Habit.findOneAndUpdate(
            {"_id":userId,"habitList._id":_id},
            {$set:{
                "habitList.$.habitTitle":habitTitle,
                "habitList.$.habitWeekdays":habitWeekdays,
                "habitList.$.habitTime":habitTime,
                "habitList.$.goalId":goalId,
                "habitList.$.goalTargetDate":goalTargetDate,
                "habitList.$.isArchived":isArchived
            }
        })
        existingEntriesCluster = await Habit.findOne({"_id":userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$eq:["$$entry.weekStart",weekStart]}}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    const selectedHabit = habitListCluster.habitList[0];
    const selectedHabitsEntries = existingEntriesCluster.habitEntries.filter((entry:any)=>{
        if(entry.habitId === _id) {
            return entry
        }
    })
    // // Repopulate habit entries based on updated habit if weekdays change
    if(habitWeekdays && (Object.values(habitWeekdays).toString() !== Object.values(selectedHabit.habitWeekdays).toString())) {
        const newHabitEntries:any[] = [];
        for(let i = 1;i<=7;i++) {
            const weekDate = new Date(weekStartTime + 86400000 * (i-1));
            const year = weekDate.getFullYear();
            const month = weekDate.getMonth() + 1;
            const date = weekDate.getDate();
            const weekday = i===7 ? 0 : i;
            // Stop creating entries if target paired goals date reached
            if(goalTargetDate) {
                if(weekDate.getTime() >= new Date(goalTargetDate).setHours(23,59,59,999)) {
                    break
                }
            }
            // Check if existing entry status complete
            let habitEntryStatus
            selectedHabitsEntries.map((entry:any)=>{
                if(entry.weekday == weekday ) {
                    entry.habitEntryStatus === 'Complete' ? habitEntryStatus = 'Complete' : habitEntryStatus = 'Pending'
                }
            })
            if(habitWeekdays[weekday]) {
                const newHabitEntry = new HabitEntry({weekStart,weekEnd,habitId:_id,habitEntryStatus,weekday,year,month,date,isArchived:false})
                newHabitEntries.push(newHabitEntry)
            } 
        }
        // Delete old entries
        try {
            await Habit.updateMany(
                {"_id":userId},
                {$pull:{habitEntries:{habitId:_id,weekStart:weekStart}}},
                {"multi": true}
            )
        } catch (error) {
            return res.status(500).send("Failed to update habit.")
        }
        // Push new entries
        try {
            await Habit.findOneAndUpdate({"_id":userId},{$push:{habitEntries:{$each:newHabitEntries}}})
        } catch (error) {
            return res.status(500).send("Failed to update habit.")
        }
        res.status(200).send(newHabitEntries)
    } else {
        res.status(200).send("Habit updated successfully.")
    }
}

const populateHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {selectedDate,_id} = req.body as {selectedDate:string,_id:string};
    const {weekStartTime,weekStart,weekEnd} = getWeekDates(selectedDate);
    // Get existing habit
    let habitListCluster
    try {
        habitListCluster = await Habit.findOne({"_id":userId},{habitList:{$elemMatch:{"_id":_id}}});
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    const selectedHabit = habitListCluster.habitList[0];
    // Create new entries
    const newPopulatedEntries:any[] = populateWeekWithHabitEntries([selectedHabit],weekStartTime,weekStart,weekEnd);
    try {
        await Habit.findOneAndUpdate({"_id":userId},{$push:{habitEntries:{$each:newPopulatedEntries}}})
    } catch (error) {
        return res.status(500).send("Failed to add new habit.")
    }
    res.status(200).json({newPopulatedEntries})
}

const updateHabitArchiveStatus:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {habitTitle,habitWeekdays,habitTime,goalId,goalTargetDate,_id,isArchived,currentDate} = req.body as {habitTitle:string,habitWeekdays:{[key:string]:boolean},habitTime:string,goalId:string,goalTargetDate:string,_id:string,isArchived:boolean,currentDate:string}
    const {weekStartTime,weekStart,weekEnd} = getWeekDates(currentDate);
    // Update archivation status in habit list
    try {
        await Habit.findOneAndUpdate(
            {"_id":userId,"habitList._id":_id},
            {$set:{
                "habitList.$.isArchived":isArchived
            }
        })
    } catch (error) {
        return res.status(500).send("Failed to update habit.")
    }
    // Populate habit entries for this week if restored habit has none
    if(!isArchived) {
        let habitEntriesCluster
        try{
            habitEntriesCluster = await Habit.findOne({"_id":userId},{habitEntries:{$filter:{input:"$habitEntries",as:"entry",cond:{$eq:["$$entry.weekStart",weekStart]}}}});
        } catch (error) {
            return res.status(500).send("Failed to update habit.")
        }
        const habitEntries = habitEntriesCluster.habitEntries.filter((item:any)=>item.habitId === _id);
        if(habitEntries.length < 1) {
            const newHabitEntries:any[] = populateWeekWithHabitEntries([req.body],weekStartTime,weekStart,weekEnd);
            try {
                await Habit.findOneAndUpdate({"_id":userId},{$push:{habitEntries:{$each:newHabitEntries}}})
            } catch (error) {
                return res.status(500).send("Failed to retrieve habit data.")
            }
            res.status(200).json({habitEntries:newHabitEntries})
        } else {
            res.status(200).json({habitEntries:habitEntriesCluster.habitEntries})
        }
    } else {
        res.status(200).send("Habit successfully archived.")
    }
}

const deleteHabit:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {_id} = req.body as {_id:string}
    try {
        await Habit.findOneAndUpdate({_id:userId},{$pull:{habitList:{"_id":_id}}})
        // Delete entries
        await Habit.updateMany(
            {"_id":userId},
            {$pull:{habitEntries:{"habitId":_id}}},
            {"multi": true}
        )
    } catch (error) {
        return res.status(500).send("Failed to delete habit.")
    }
    res.status(200).send("Successfully deleted habit")
}

exports.getHabits = getHabits
exports.getArchivedHabits = getArchivedHabits
exports.addNewHabit = addNewHabit
exports.updateHabitEntryStatus = updateHabitEntryStatus
exports.updateHabit = updateHabit
exports.populateHabit = populateHabit
exports.updateHabitArchiveStatus = updateHabitArchiveStatus
exports.deleteHabit = deleteHabit