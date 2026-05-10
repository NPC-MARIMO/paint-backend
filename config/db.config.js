const mongoose= require('mongoose');

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(()=> console.log('connected to mongodb'))
    .catch((err)=>console.log(err))
}

module.exports = connectDB;