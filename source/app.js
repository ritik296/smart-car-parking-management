let express = require('express')
let app = express()
let path = require('path')
const hbs = require('hbs')
const multer = require('multer')
const fs = require('fs')
const port = 9000
require('./db/database.js')
require('dotenv').config()
const auth = require('../middleware/auth.js')
const registerManager = require('./models/register.js')
const slotsManager=require('./models/slots.js')
const bookingManager=require('./models/booking.js')
const paymentController = require('../controllers/paypalcontrollers.js');

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cookieParser=require('cookie-parser')
const dirname=path.resolve(__dirname)
const templatepath = path.join(dirname,"../templates/views")
const partialpath=path.join(dirname,"../templates/partials")

const storage = multer.diskStorage({
    destination:function (req,file,cb){
       return cb(null,'./uploads')
    },
    filename:function (req,file,cb){
        return cb(null,`${Date.now()}-${file.originalname}`)
     },
})
const upload = multer({storage:storage})


app.set('view engine','hbs')
app.set('views',templatepath)
hbs.registerPartials(partialpath)

app.use(express.static('./uploads'))
app.use(express.static('./videos'))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.get("/",auth,async(req,res)=>{
    if(req.user.isAdmin){
        res.render('admin.hbs',{
            email:req.user.email
        })
    }
    else{
        const user = req.user
        const userphoneno = user.phone
        const booking = await bookingManager.find({userphone:userphoneno})
        console.log(booking.length)
        let bookingstatus = ``
        if(booking.length === 0 ){
            bookingstatus += ' You have No booking, '
        }
        else{
            for(let i=0;i<booking.length;i++){

            
            const status = `${booking[i].bookingstatus}`
            console.log(status)
            if(status === 'Approve'){
               bookingstatus += ' Your Booking Has Been Approved ,'
            }
            else if(status === 'Reject'){
                 bookingstatus += ' Your Booking Has Been Rejected ,'
            }
            else if(status === 'Pending'){
               bookingstatus += ' Your Booking request is pending currently ,'
            }
        }
    }
        res.render("index.hbs",{
            email:req.user.email,
            bookingstatus : bookingstatus
        })
    }
   
})

app.get('/admin',auth,(req,res)=>{
    if(req.user.isAdmin){
        res.render('admin.hbs',{
            email:req.user.email
        })
    }
    else{
        res.send("you are not admin")
    }
})


app.get('/register',async(req,res)=>{
    
    const token=req.cookies.jwt
    if(token){
        res.send("you are already loggined")
    }
    else{
        res.clearCookie('jwt')
        res.render('register.hbs')
    }
})

app.post('/register',async(req,res)=>{
try {
    const password = req.body.password
    const cpassword = req.body.confirmpassword

    if(password===cpassword){
       
        const register = new registerManager({
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            age:req.body.age,
            phone:req.body.phone,
            gender:req.body.gender,
            password:password,
            confirmpassword:cpassword,
            isAdmin:0
        })
      

        const registered = await register.save()
        res.redirect('/login')
    }
    else{
        res.send("password not matched")
    }

} catch (error) {
    console.log(error)
    res.send(error)
}
})

app.get('/registerapi',async(req,res)=>{
    const data = await registerManager.find()
    res.json(data)
})

app.get('/login',async(req,res)=>{
    
    const token=req.cookies.jwt
    if(token){
        res.send("you are already loggined")
    }
    else{
        res.clearCookie('jwt')
        res.render('login.hbs')
    }
})


app.post('/login',async(req,res)=>{
    try {
        const email = req.body.email
        const password = req.body.password
        const useremail= await registerManager.findOne({email:email})
        const isMatch = await bcrypt.compare(password,useremail.password)

        const token=await useremail.generateAuthToken()
        res.cookie('jwt',token)

        if(isMatch){
           if(useremail.isAdmin){
                res.render("admin.hbs")
           }
           else{
                res.redirect("/")
           }
        }
        else{
            res.clearCookie('jwt')
            res.send("invalid email or password")
        } 

    } catch (error) {
        res.send(error)
    }
})
app.get('/logout',(req,res)=>{
    try {
        res.clearCookie('jwt')
        res.redirect('/login')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.get('/slots',auth,(req,res)=>{
    res.render('slots.hbs')
})

app.get('/addslots',auth,(req,res)=>{
    res.render("addslots.hbs")
})

app.post("/addslots",async(req,res)=>{
    try {
        const slotregister = new slotsManager({
            slotsnumber:req.body.slotsnumber,
            slotsprice:req.body.slotsprice,
            slotsvehicletype:req.body.slotsvehicletype,
            slotsdescription:req.body.slotsdescription
        })
        const registered = await slotregister.save()
        res.redirect('/slots')
       
     } catch (error) {
         console.log(error)
         res.send(error)
     }
})


app.post('/delete-slot/:id',async(req,res)=>{
    const id = req.params.id
    const deleteslot= await slotsManager.deleteOne({_id:id})
    res.redirect('/slots')
})

app.get("/slotsapi",async(req,res)=>{
    const data = await slotsManager.find()
    res.json(data)
})

app.get("/slotsapi/:id",async(req,res)=>{
    const id = req.params.id
    const slot = await slotsManager.find({_id:id})
    res.json(slot)
})

app.get("/slotbook/:id",auth,async(req,res)=>{
    const id = req.params.id
    const slot = await slotsManager.find({_id:id})
     
    console.log(slot[0]._id)
    res.render('booking.hbs',{
        id1:slot[0]._id
    })
})

app.post('/slotbook/:id',auth,async(req,res)=>{
    const id = req.params.id
    const user = req.user
    const slots = await slotsManager.find({_id:id})
    const username = `${user.firstname} ${user.lastname}`
    const bookingregister = new bookingManager({
        user:username,
        userphone:user.phone,
        bookingnumber:slots[0].slotsnumber,
        bookingprice:slots[0].slotsprice,
        bookingvehicletype:slots[0].slotsvehicletype,
        bookingstatus:'Pending',
        bookingdescription:slots[0].slotsdescription
    })
    const registered = await bookingregister.save()
    res.redirect('/')
})
app.post('/delete-booking/:id',async(req,res)=>{
    const id = req.params.id
    const deletebooking = await bookingManager.deleteOne({_id:id})
    res.redirect('/admin')
})

app.post('/approve-booking/:id',async(req,res)=>{
    const id = req.params.id 
    const updatebooking = await bookingManager.updateOne({_id:id},{$set:{bookingstatus:"Approve"}})
    res.redirect('/admin')
})

app.post('/reject-booking/:id',async(req,res)=>{
    const id = req.params.id 
    const updatebooking = await bookingManager.updateOne({_id:id},{$set:{bookingstatus:"Reject"}})
    res.redirect('/admin')
})

app.get('/bookingapi',async(req,res)=>{
    const data = await bookingManager.find()
    res.json(data)
})
app.get('/live',auth,async(req,res)=>{
    res.render('live.hbs')
})


app.get('/livecar',(req,res)=>{
    res.redirect('/car2.mp4')
})
app.listen(port,()=>{
    console.log("server running")
})