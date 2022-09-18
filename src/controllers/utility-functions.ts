

const getWeekDates = (clientWeekStartTime:number,timezoneOffset:number) => {
    const utcWeekStartMidDay = new Date(clientWeekStartTime + timezoneOffset * -60000).setHours(12,0,0,0)
    const clientWeekStart = new Date(clientWeekStartTime);
    const clientNextWeekStart = new Date(clientWeekStartTime+86400000*7);
    return {utcWeekStartMidDay,clientWeekStart,clientNextWeekStart};
}