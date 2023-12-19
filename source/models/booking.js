const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const bookingSchema = new mongoose.Schema({
    user:{
        type:String,
        required:[true,'user required']
    },
    userphone:{
        type:String,
        required:[true,'user phone No required']
    },
    bookingnumber:{
        type:Number,
        required:[true,'slots Number required']
    },
    bookingprice:{
        type:Number,
        required:[true,'Slots Price required'] 
    },
    bookingvehicletype:{
        type:String,
        required:[true,'vehicle type required']
    },
    bookingstatus:{
        type:String,
        required:[true,'booking status required']
    },
    bookingdescription:{
        type:String,
    }
})


const booking = new mongoose.model('Booking',bookingSchema)
module.exports = booking