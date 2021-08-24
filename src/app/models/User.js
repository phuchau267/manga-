const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//import plugin slug mongoose
const moment = require('moment-timezone');

const ROLE = {
  ADMIN: 'admin',
  USER: 'user',
  EXTRAADMIN: 'extraAdmin'
};
const opts = {
  // set lại time zone sang asia
  timestamps: { currentTime: () => moment.tz(Date.now(), "Asia/Ho_Chi_Minh") },
};
const User = new Schema({
  username:{type: String},
  password:{type: String},
  displayname:{type: String},
  avatar:{type: String},
  googleId:{type:String},
    facebookId:{type:String},
    userCreatedAt:{type: String},
    userUpdatedAt:{type: String},
    role: {
      type: String,
      required: true,
      default: ROLE.USER
    },
    banned: {
      type: String,
      required: true,
      default: false
    },
    comment: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    },
    subscribed: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comic"
    }],
  }, opts);

  module.exports = mongoose.model('User', User);
