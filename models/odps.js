const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const OdpSchema = new mongoose.Schema({
    
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    organization_name: {type: String, required: true},
    organization_id: {type: String, required: true}
    
});

const Odp = mongoose.model('Odp', OdpSchema);

module.exports = Odp;