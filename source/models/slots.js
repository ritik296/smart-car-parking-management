const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const slotsSchema = new mongoose.Schema({
    slotsnumber:{
        type:Number,
        required:[true,'slots Number required']
    },
    
    slotsprice:{
        type:Number,
        required:[true,'Slots Price required']
    },
    slotsvehicletype:{
        type:String,
        required:[true,'vehicle type required']
    },
    slotsdescription:{
        type:String,
    }
})
const slots = new mongoose.model('Slots',slotsSchema)
module.exports = slots