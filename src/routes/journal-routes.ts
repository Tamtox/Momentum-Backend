import express from "express";
const router = express.Router();
const {getJournal,updateJournalEntry,createJournalEntry} = require('../controllers/journal-controllers');
const {authCheck} = require('../middleware/auth-check');

router.post('/getJournal',authCheck,getJournal)

router.post('/createJournalEntry',authCheck,createJournalEntry)

router.patch('/updateJournalEntry',authCheck,updateJournalEntry)

module.exports = router 