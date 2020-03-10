const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const searchSchema = new Schema({
    _id: {type:Schema.Types.ObjectId, select: false},
    text: String,
    lastAccessedAt: Date,
    searchDomain: String,
    count: Number
  },
  {
    timestamps: true
  });

const profileSchema = new Schema({
  _id: {type:Schema.Types.ObjectId, select: false},
  displayName: String,
  summary: String,
  websiteLink: String,
  twitterLink: String,
  githubLink: String
});

const userSchema = new Schema({
    userId: String, //global userId in the bookmarks context (currently is the Keycloak Id)
    profile: profileSchema,
    searches: [searchSchema],
    readLater: [String],
    likes: [String], //ids of bookmarks liked by user
    watchedTags: [String],
    pinned: [String],
    favorites: [String],
    history: [String],
    __v: {type: Number, select: false}
  },
  {
    timestamps: true
  });

module.exports = mongoose.model('User', userSchema);
