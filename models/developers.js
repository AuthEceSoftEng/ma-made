const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const DeveloperSchema = new mongoose.Schema({
    
    username: {type: String, required: true, unique: true},
    code_repo_id: {type: String, required: true, unique: true}
    
});

const Developer = mongoose.model('Developer', DeveloperSchema);

module.exports = Developer;