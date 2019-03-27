const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const PredefinedImageSchema = new mongoose.Schema({
    
    image:{
        id: {type: String, required: true, unique: true},
        name: {type: String, required: true, unique: true},
        tag: {type: String, default: 'latest'}
    },
    devTools:{
        node: {type: Boolean, default: false},
        python2: {type: Boolean, default: false},
        python3: {type: Boolean, default: false},
        ubuntu14LTS: {type: Boolean, default: false}
    }
});

const PredefinedImage = mongoose.model('PredefinedImage', PredefinedImageSchema);

module.exports = PredefinedImage;