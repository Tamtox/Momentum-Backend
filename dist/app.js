"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
process.env.TZ = 'Etc/Universal';
const mongoose = require("mongoose");
const { MONGO_URI, PORT, MONGO_URIATLAS } = process.env;
const app = (0, express_1.default)();
const userRoutes = require('./routes/user-routes');
const scheduleRoutes = require('./routes/schedule-routes');
const todoRoutes = require('./routes/todo-routes');
const habitRoutes = require('./routes/habit-routes');
const journalRoutes = require('./routes/journal-routes');
const goalRoutes = require('./routes/goal-routes');
// Encoders
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Headers config
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
    next();
});
//Routes 
app.use('/users', userRoutes);
app.use('/schedule', scheduleRoutes);
app.use('/todo', todoRoutes);
app.use('/habits', habitRoutes);
app.use('/journal', journalRoutes);
app.use('/goals', goalRoutes);
// Unknown routes
app.use((req, res, next) => {
    res.status(404).send("Route doesn't exist");
    return;
});
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    res.json({ message: error.message || 'Unknown error' });
});
mongoose
    .connect(MONGO_URIATLAS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
    console.log("Successfully connected to database");
    app.listen(PORT);
    console.log("Server Up");
})
    .catch((error) => {
    console.log("Database connection failed. exiting now...");
    console.error(error);
});
