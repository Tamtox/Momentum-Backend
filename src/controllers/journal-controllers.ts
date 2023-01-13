import { RequestHandler } from "express";
import { Journal,JournalEntry,JournalEntryInterface } from "../models/journal";
import { getDate } from "../misc/utility-functions";

const getJournalEntry:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId;
    const {clientSelectedDayStartTime,clientTimezoneOffset} = req.body as JournalEntryInterface;
    const {clientDayStart,clientNextDayStart} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
    let journalCluster
    try {
        journalCluster = await Journal.findOne({userId:userId},{journalEntries:{$elemMatch:{date:{$gte:clientDayStart,$lt:clientNextDayStart}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve journal data.")
    }
    res.status(200).send(journalCluster!.journalEntries)
}

const updateJournalEntry:RequestHandler<{userId:string}> = async (req,res,next) => {
    const userId = req.params.userId
    const {clientSelectedDayStartTime,clientTimezoneOffset,journalEntry,dateCreated,dateEdited} = req.body as JournalEntryInterface
    const {clientDayStart,clientNextDayStart,utcDayStartMidDay} = getDate(clientSelectedDayStartTime,clientTimezoneOffset);
    let journalCluster
    try {
        journalCluster = await Journal.findOne({userId:userId},{journalEntries:{$elemMatch:{date:{$gte:clientDayStart,$lt:clientNextDayStart}}}});
    } catch (error) {
        return res.status(500).send("Failed to retrieve journal data.")
    }
    if(journalCluster!.journalEntries.length < 1) {
        const newJournalEntry = new JournalEntry({date:utcDayStartMidDay,journalEntry,dateCreated,dateEdited});
        try {
            await Journal.findOneAndUpdate({userId:userId},{$push:{journalEntries:newJournalEntry}},);
        } catch (error) {
            return res.status(500).send("Failed to add journal entry. Try again later.");
        }
        res.status(200).json({journalId:newJournalEntry._id})
    } else {
        try {
            await Journal.findOneAndUpdate({userId:userId,"journalEntries.date":{$gte:clientDayStart,$lt:clientNextDayStart}},{$set:{"journalEntries.$.journalEntry":journalEntry}})
        } catch (error) {
            return res.status(500).send("Failed to update journal. Try again later.")
        }
        res.status(200).send("Successfully updated journal entry")
    }
}

export {getJournalEntry,updateJournalEntry}

