const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const LogSchema = new mongoose.Schema({
    
    action: {type: String, required: true},
    application_id: {type: mongoose.Schema.ObjectId, ref:'Application', required: true},
    message: {type: String, required: true},
    timestamp: {type: String, required: true},
    timeElapsed: {type: String, required: true},
    status: {type: String, required: true}
});

const Log = mongoose.model('Log', LogSchema);

module.exports = Log;