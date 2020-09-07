const mongoose = require('mongoose');

const User = new mongoose.Schema({
   userid: {type: String, required:true, unique:true},
   password: {type: String, required:true},
   email: String,
   list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }]
});


mongoose.model('User', User);

const Album = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String, required: true}, 
    photos: [],
    date: {type: String, required: true},
    share: {type: String}
});
mongoose.model('Album', Album);



mongoose.connect(process.env.MONGODB_URI);

//mongoose.connect("mongodb://kwangi1992:rhkswl12@localhost/final", {useNewUrlParser: true,useUnifiedTopology: true}); 