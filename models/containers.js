const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ContainerSchema = new mongoose.Schema({
    
    id: {type: String, required: true, unique: true},
    image_id: {type: mongoose.Schema.ObjectId, ref:'PredefinedImage', required: true},
    owner: {type: String, required: true},
    port: {type: Number, required: true, unique: true},
    active: {type: Boolean, default: true}
});

const Container = mongoose.model('Container', ContainerSchema);

module.exports = Container;