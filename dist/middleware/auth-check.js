"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCheck = void 0;
const jwt = require('jsonwebtoken');
const { SECRET_STRING } = process.env;
const authCheck = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        try {
            const decodedToken = await jwt.verify(token, SECRET_STRING);
            req.params.userId = decodedToken.userId;
            next();
        }
        catch (error) {
            return res.status(401).send('Invalid token!');
        }
    }
    else {
        return res.status(401).send('Unauthorized!');
    }
};
exports.authCheck = authCheck;
//# sourceMappingURL=auth-check.js.map