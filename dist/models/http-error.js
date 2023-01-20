"use strict";
class HttpError extends Error {
    constructor(message, errCode) {
        super(message);
        this.code = errCode;
    }
}
module.exports = HttpError;
//# sourceMappingURL=http-error.js.map