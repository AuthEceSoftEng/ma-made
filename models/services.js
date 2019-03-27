const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ServicesSchema = new mongoose.Schema({

    name: { type: String, required: true, unique: true },
    url: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    endpoints: [mongoose.Schema.Types.Mixed],
    locale: { type: String, required: true },
    curator: {
        isThirdParty: { type: Boolean, default: false },
        name: { type: String } // if isThirdParty is true
    },
    tags: [
        {
            text: { type: String }
        }
    ],
    schemaDotOrg: {
        type: {
            type: String
        },
    }
});

const Services = mongoose.model('Services', ServicesSchema);

module.exports = Services;