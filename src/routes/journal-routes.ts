import express from "express";
const router = express.Router();
const {getJournalEntry,updateJournalEntry} = require('../controllers/journal-controllers');
const {authCheck} = require('../middleware/auth-check');

router.post('/getJournalEntry',authCheck,getJournalEntry)

router.patch('/updateJournalEntry',authCheck,updateJournalEntry)

module.exports = router 