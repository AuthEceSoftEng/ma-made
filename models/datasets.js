const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const DatasetsSchema = new mongoose.Schema({

    name: { type: String, required: true, unique: true },
    url: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    locale: { type: String, required: true },
    curator: {
        isThirdParty: { type: Boolean, default: false },
        name: { type: String } // if isThirdParty is true
    },
    sample: [mongoose.Schema.Types.Mixed],
    tags: [
        {
            text: String
        }
    ],
    schemaDotOrg: {
        type: {
            type: String
        },
        properties: [{
            key: { type: String },
            property: { type: String }
        }]
    }
});

const Datasets = mongoose.model('Datasets', DatasetsSchema);

module.exports = Datasets;