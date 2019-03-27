const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const AnalyticsSchema = new mongoose.Schema({
    
    application_name: {type: String, required: true, unique: true},
    application_id: {type: mongoose.Schema.ObjectId, ref: 'Application', required: true},
    created: {type: String, required: true},
    owner: {type: mongoose.Schema.ObjectId, ref: 'Developer', required: true},
    token: {type: String, required: true, unique: true}
    
});

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = Analytics;