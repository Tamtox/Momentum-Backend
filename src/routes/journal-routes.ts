import express from "express";
const router = express.Router();
const {getJournalEntry,updateJournalEntry} = require('../controllers/journal-controllers');
const {lastOnline} = require('../controllers/user-controllers');
const {authCheck} = require('../middleware/auth-check');

router.post('/getJournalEntry',authCheck,lastOnline,getJournalEntry)

router.patch('/updateJournalEntry',authCheck,lastOnline,updateJournalEntry)

module.exports = router 