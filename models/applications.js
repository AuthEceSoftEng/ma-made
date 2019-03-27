const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ApplicationSchema = new mongoose.Schema({

    name: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.ObjectId, ref: 'Developer', required: true },
    container: { type: String, default: 'not_assigned' },
    repo_id: { type: Number, required: true, unique: true },
    components: [String],
    description: { type: String },
    tags: [
        {
            text: String
        }
    ],

});

const Application = mongoose.model('Application', ApplicationSchema);

module.exports = Application;