const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ReusableComponentSchema = new mongoose.Schema({

    id: { type: Number, required: true }, // gitlab issue id
    code: { type: String, required: true },
    owner: { type: mongoose.Schema.ObjectId, ref: 'Developer', required: true },
    repo_id: { type: Number, required: true },
    tags: [String]

});
ReusableComponentSchema.index({ id: 1, owner: 1, repo_id: 1 }, { unique: true });
const ReusableComponent = mongoose.model('ReusableComponent', ReusableComponentSchema);

module.exports = ReusableComponent;