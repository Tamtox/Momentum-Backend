"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJournalEntry = exports.getJournalEntry = void 0;
const journal_1 = require("../models/journal");
const utility_functions_1 = require("../misc/utility-functions");
const getJournalEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedDayStartTime, clientTimezoneOffset } = req.body;
    const { clientDayStart, clientNextDayStart } = (0, utility_functions_1.getDate)(clientSelectedDayStartTime, clientTimezoneOffset);
    let journalCluster;
    try {
        journalCluster = await journal_1.Journal.findOne({ userId: userId }, { journalEntries: { $elemMatch: { date: { $gte: clientDayStart, $lt: clientNextDayStart } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve journal data.");
    }
    res.status(200).send(journalCluster.journalEntries);
};
exports.getJournalEntry = getJournalEntry;
const updateJournalEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { clientSelectedDayStartTime, clientTimezoneOffset, journalEntry, dateCreated, dateEdited } = req.body;
    const { clientDayStart, clientNextDayStart, utcDayStartMidDay } = (0, utility_functions_1.getDate)(clientSelectedDayStartTime, clientTimezoneOffset);
    let journalCluster;
    try {
        journalCluster = await journal_1.Journal.findOne({ userId: userId }, { journalEntries: { $elemMatch: { date: { $gte: clientDayStart, $lt: clientNextDayStart } } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve journal data.");
    }
    if (journalCluster.journalEntries.length < 1) {
        const newJournalEntry = new journal_1.JournalEntry({ date: utcDayStartMidDay, journalEntry, dateCreated, dateEdited });
        try {
            await journal_1.Journal.findOneAndUpdate({ userId: userId }, { $push: { journalEntries: newJournalEntry } });
        }
        catch (error) {
            return res.status(500).send("Failed to add journal entry. Try again later.");
        }
        res.status(200).json({ journalId: newJournalEntry._id });
    }
    else {
        try {
            await journal_1.Journal.findOneAndUpdate({ userId: userId, "journalEntries.date": { $gte: clientDayStart, $lt: clientNextDayStart } }, { $set: { "journalEntries.$.journalEntry": journalEntry } });
        }
        catch (error) {
            return res.status(500).send("Failed to update journal. Try again later.");
        }
        res.status(200).send("Successfully updated journal entry");
    }
};
exports.updateJournalEntry = updateJournalEntry;
//# sourceMappingURL=journal-controllers.js.map