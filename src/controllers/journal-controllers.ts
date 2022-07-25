import { RequestHandler } from "express";
const {Journal,JournalEntry} = require('../models/journal');

// Get day start and end of selected day
const getDate = (clientDayStartTime:number,timezoneOffset:number) => {
    const utcDayStartMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12,0,0,0);
    const clientDayStart = new Date(clientDayStartTime);
    const clientNextDayStart = new Date(clientDayStartTime + 86400000);
    return {utcDayStartMidDay,clientDayStart,clientNextDayStart};
}

const getJournalEntry:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,timezoneOffset} = req.body as {clientSelectedDayStartTime:number,timezoneOffset:number};
    const {clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,timezoneOffset);
    let journalCluster
    try {
        journalCluster = await Journal.findOne({userId:userId},{journalEntries:{$elemMatch:{date:{$gte:clientDayStart,$lt:clientNextDayStart}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve journal data.")
    }
    res.status(200).send(journalCluster.journalEntries)
}

const updateJournalEntry:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {clientSelectedDayStartTime,timezoneOffset,journalEntry} = req.body as {clientSelectedDayStartTime:number,timezoneOffset:number,journalEntry:string};
    const {clientDayStart,clientNextDayStart,utcDayStartMidDay} = getDate(clientSelectedDayStartTime,timezoneOffset);
    let journalCluster
    try {
        journalCluster = await Journal.findOne({userId:userId},{journalEntries:{$elemMatch:{date:{$gte:clientDayStart,$lt:clientNextDayStart}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve journal data.")
    }
    if(journalCluster.journalEntries.length < 1) {
        const newJournalEntry = new JournalEntry({date:utcDayStartMidDay,journalEntry});
        try {
            await Journal.findOneAndUpdate({userId:userId},{$push:{journalEntries:newJournalEntry}},);
        } catch (error) {
            return res.status(500).send("Failed to add journal entry. Try again later.");
        }
        res.status(200).send([newJournalEntry])
    } else {
        try {
            await Journal.findOneAndUpdate({userId:userId,"journalEntries.date":{$gte:clientDayStart,$lt:clientNextDayStart}},{$set:{"journalEntries.$.journalEntry":journalEntry}})
        } catch (error) {
            return res.status(500).send("Failed to update journal. Try again later.")
        }
        res.status(200).json("Successfully updated journal entry")
    }
}

export {getJournalEntry,updateJournalEntry}

