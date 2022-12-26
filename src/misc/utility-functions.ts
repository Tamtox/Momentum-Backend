import { Habit,HabitEntry,HabitsListItem,HabitEntryInterface, HabitsListItemInterface } from "../models/habit";
import { Schedule,ScheduleItem,ScheduleItemInterface } from "../models/schedule";

// Habit Entries generation algorithm | null if no entry , true if placeholder until status change , entry if it exists
const createHabitEntries = (habitItem:HabitsListItemInterface,startTime:number,endTime:number,populateBeforeCreationDate:boolean,existingHabitEntries:HabitEntryInterface[]|null) => {
    const newHabitEntries:HabitEntryInterface[] = [];
    const newScheduleEntries:ScheduleItemInterface[] = [];
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
        if(habitItem.targetDate && date > new Date(habitItem.targetDate).getTime()) break;
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
            if (populateBeforeCreationDate) {
                const newHabitEntry:HabitEntryInterface = new HabitEntry({date,habitId,status,dateCompleted});
                newHabitEntries.push(newHabitEntry);
            }
            if (existingHabitEntries && status === "Complete") {
                const newHabitEntry:HabitEntryInterface = new HabitEntry({date,habitId,status,dateCompleted});
                newHabitEntries.push(newHabitEntry);
            }
            const {time,title,_id,alarmUsed,creationUTCOffset} = habitItem
            let newScheduleItem:ScheduleItemInterface = new ScheduleItem({date,time,parentId:_id,parentTitle:title,parentType:"habit",alarmUsed,utcOffset:creationUTCOffset,dateCompleted,status});
            newScheduleEntries.push(newScheduleItem);
        }
    }
    return {newHabitEntries,newScheduleEntries};
}

// Get week start and end
const getWeekDates = (clientWeekStartTime:number,timezoneOffset:number) => {
    const utcWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
    const utcNextWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0) + 86400000 * 7;
    const clientWeekStart = new Date(clientWeekStartTime);
    const clientNextWeekStart = new Date(clientWeekStartTime + 86400000 * 7);
    return {utcWeekStartMidDay,utcNextWeekStartMidDay,clientWeekStart,clientNextWeekStart};
} 

// Get day start and end of selected day
const getDate = (clientDayStartTime:number,timezoneOffset:number) => {
    const utcDayStartMidDay:number = new Date(clientDayStartTime + timezoneOffset * - 60000).setHours(12,0,0,0);
    const utcNextDayMidDay:number = new Date(clientDayStartTime + timezoneOffset * - 60000).setHours(12,0,0,0) + 86400000;
    const utcMonthStartMidDay:number = new Date(utcDayStartMidDay).getTime() - ((new Date(utcDayStartMidDay).getDate() - 1 ) * 86400000); 
    const utcNextMonthStartMidDay:number = new Date(new Date(utcDayStartMidDay).getFullYear(),new Date(utcDayStartMidDay).getMonth() + 1,1,0,0,0,0).getTime() - 1;
    const clientDayStart:Date = new Date(clientDayStartTime);
    const clientNextDayStart:Date = new Date(clientDayStartTime + 86400000);
    return {utcDayStartMidDay,utcNextDayMidDay,clientDayStart,clientNextDayStart};
}


export {createHabitEntries,getWeekDates,getDate}