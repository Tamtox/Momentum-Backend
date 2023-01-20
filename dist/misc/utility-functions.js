"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDate = exports.getWeekDates = exports.createHabitEntries = void 0;
const habit_1 = require("../models/habit");
const schedule_1 = require("../models/schedule");
// Get day start and end of selected day
const getDate = (clientDayStartTime, timezoneOffset) => {
    const utcDayStartMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12, 0, 0, 0);
    const utcNextDayMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12, 0, 0, 0) + 86400000;
    const clientDayStart = new Date(clientDayStartTime);
    const clientNextDayStart = new Date(clientDayStartTime + 86400000);
    return { utcDayStartMidDay, utcNextDayMidDay, clientDayStart, clientNextDayStart };
};
exports.getDate = getDate;
// Get week start and end
const getWeekDates = (clientWeekStartTime, timezoneOffset) => {
    const utcWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12, 0, 0, 0);
    const utcNextWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12, 0, 0, 0) + 86400000 * 7;
    const clientWeekStart = new Date(clientWeekStartTime);
    const clientNextWeekStart = new Date(clientWeekStartTime + 86400000 * 7);
    return { utcWeekStartMidDay, utcNextWeekStartMidDay, clientWeekStart, clientNextWeekStart };
};
exports.getWeekDates = getWeekDates;
// Habit Entries generation algorithm | null if no entry , true if placeholder until status change , entry if it exists
const createHabitEntries = (habitItem, startTime, endTime, populateBeforeCreationDate, existingHabitEntries) => {
    const newHabitEntries = [];
    const newScheduleEntries = [];
    const habitId = habitItem._id;
    for (let currentTime = startTime; currentTime < endTime; currentTime += 86400000) {
        const date = new Date(currentTime).setHours(12, 0, 0, 0);
        const weekday = new Date(currentTime).getDay();
        const weekStartTime = new Date(currentTime).setHours(0, 0, 0, 0) + 86400000 * (weekday ? 1 - weekday : -6);
        let dateCompleted = null;
        let status = 'Pending';
        // Stop creating entries if selected date is before habit creation week's start
        const habitCreationTime = new Date(habitItem.creationDate).getTime() + habitItem.creationUTCOffset * -60000;
        const habitCreationWeekday = new Date(habitCreationTime).getDay();
        const habitCreationDatesWeekStart = new Date(habitCreationTime).setHours(12, 0, 0, 0) + 86400000 * (habitCreationWeekday ? 1 - habitCreationWeekday : -6);
        if (habitCreationDatesWeekStart > weekStartTime + 86400000 * 7 - 1 && !populateBeforeCreationDate)
            break;
        // Stop creating entries if target paired goals date has been reached
        if (habitItem.targetDate && date > new Date(habitItem.targetDate).getTime())
            break;
        // Check if existing entry status is complete
        if (existingHabitEntries) {
            existingHabitEntries.forEach((entry) => {
                if (new Date(entry.date).getDay() === weekday) {
                    status = entry.status;
                    dateCompleted = entry.dateCompleted;
                }
            });
        }
        // Generate new habit entry and schedule entry with same id if populate before creation date or existing entry is complete
        if (habitItem.weekdays[weekday]) {
            if (populateBeforeCreationDate || (existingHabitEntries && status === "Complete")) {
                const newHabitEntry = new habit_1.HabitEntry({ date, habitId, status, dateCompleted });
                newHabitEntries.push(newHabitEntry);
                const { time, title, _id, alarmUsed, creationUTCOffset, isArchived } = habitItem;
                let newScheduleItem = new schedule_1.ScheduleItem({
                    date, time,
                    parentId: _id,
                    parentTitle: title,
                    parentType: "habit",
                    alarmUsed,
                    utcOffset: creationUTCOffset,
                    dateCompleted,
                    status,
                    isArchived,
                    _id: newHabitEntry._id
                });
                newScheduleEntries.push(newScheduleItem);
            }
        }
    }
    return { newHabitEntries, newScheduleEntries };
};
exports.createHabitEntries = createHabitEntries;
//# sourceMappingURL=utility-functions.js.map