const mongoose = require("mongoose");

const injectSession = async (req, res, next) => {
    const session = await mongoose.startSession();
    req.session = session;
    next();
};

const hasSession = (req) => {
    return 'session' in req;
};

module.exports = {
    injectSession,
    hasSession,
};
