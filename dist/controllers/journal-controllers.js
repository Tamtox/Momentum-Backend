"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJournalEntry = exports.getJournalEntry = void 0;
const { Journal, JournalEntry } = require('../models/journal');
// Get day start and end of selected day
const getDate = (clientDayStartTime, timezoneOffset) => {
    const utcDayStartMidDay = new Date(clientDayStartTime + timezoneOffset * -60000).setHours(12, 0, 0, 0);
    const clientDayStart = new Date(clientDayStartTime);
    const clientNextDayStart = new Date(clientDayStartTime + 86400000);
    return { utcDayStartMidDay, clientDayStart, clientNextDayStart };
};
const getJournalEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedDayStartTime, clientTimezoneOffset } = req.body;
    const { clientDayStart, clientNextDayStart } = getDate(clientSelectedDayStartTime, clientTimezoneOffset);
    let journalCluster;
    try {
        journalCluster = await Journal.findOne({ userId: userId }, { journalEntries: { $elemMatch: { date: { $gte: clientDayStart, $lt: clientNextDayStart } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve journal data.");
    }
    res.status(200).send(journalCluster.journalEntries);
};
exports.getJournalEntry = getJournalEntry;
const updateJournalEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedDayStartTime, clientTimezoneOffset, journalEntry } = req.body;
    const { clientDayStart, clientNextDayStart, utcDayStartMidDay } = getDate(clientSelectedDayStartTime, clientTimezoneOffset);
    let journalCluster;
    try {
        journalCluster = await Journal.findOne({ userId: userId }, { journalEntries: { $elemMatch: { date: { $gte: clientDayStart, $lt: clientNextDayStart } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve journal data.");
    }
    if (journalCluster.journalEntries.length < 1) {
        const newJournalEntry = new JournalEntry({ date: utcDayStartMidDay, journalEntry });
        try {
            await Journal.findOneAndUpdate({ userId: userId }, { $push: { journalEntries: newJournalEntry } });
        }
        catch (error) {
            return res.status(500).send("Failed to add journal entry. Try again later.");
        }
        res.status(200).send([newJournalEntry]);
    }
    else {
        try {
            await Journal.findOneAndUpdate({ userId: userId, "journalEntries.date": { $gte: clientDayStart, $lt: clientNextDayStart } }, { $set: { "journalEntries.$.journalEntry": journalEntry } });
        }
        catch (error) {
            return res.status(500).send("Failed to update journal. Try again later.");
        }
        res.status(200).json("Successfully updated journal entry");
    }
};
exports.updateJournalEntry = updateJournalEntry;