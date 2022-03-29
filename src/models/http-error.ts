class HttpError extends Error {
    code:number
    constructor(message:string,errCode:number) {
        super(message);
        this.code = errCode
    }
}

module.exports = HttpError;