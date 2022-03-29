"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Journal, JournalEntry } = require('../models/journal');
const getJournal = async (req, res, next) => {
    const userId = req.params.userId;
    const { selectedDate } = req.body;
    const localeDate = new Date(selectedDate).toLocaleDateString('en-GB');
    let journalCluster;
    try {
        journalCluster = await Journal.findOne({ "_id": userId }, { journalEntries: { $elemMatch: { date: localeDate } } });
    }
    catch (error) {
        return res.status(500).send("Failed to retrieve journal data.");
    }
    res.status(200).send(journalCluster.journalEntries);
};
const createJournalEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { selectedDate, journalEntry } = req.body;
    const localeDate = new Date(selectedDate).toLocaleDateString('en-GB');
    const newJournalEntry = new JournalEntry({ date: localeDate, journalEntry });
    try {
        await Journal.findOneAndUpdate({ _id: userId }, { $push: { journalEntries: newJournalEntry } });
    }
    catch (error) {
        return res.status(500).send("Failed to add journal entry. Try again later.");
    }
    res.status(200).send([newJournalEntry]);
};
const updateJournalEntry = async (req, res, next) => {
    const userId = req.params.userId;
    const { selectedDate, journalEntry } = req.body;
    const localeDate = new Date(selectedDate).toLocaleDateString('en-GB');
    try {
        await Journal.findOneAndUpdate({ _id: userId, "journalEntries.date": localeDate }, { $set: { "journalEntries.$.journalEntry": journalEntry } });
    }
    catch (error) {
        return res.status(500).send("Failed to update journal. Try again later.");
    }
    res.status(200).json("Successfully updated journal entry");
};
exports.getJournal = getJournal;
exports.createJournalEntry = createJournalEntry;
exports.updateJournalEntry = updateJournalEntry;
