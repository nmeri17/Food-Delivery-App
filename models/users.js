var mongoose = require("../node_modules/mongoose"), db = mongoose.createConnection("mongodb://127.0.0.1:1717/five_star");

var Users = new mongoose.Schema({
    email: {type: String, required: true, index: {unique: true}},
    password: String,
    username: String,
    staffStatus: {type: String, default: "user", enum: ["user", "staff", "admin"]},
    confirmedUser: {type: Boolean, default: false},
    confirmID: Number
});

  Users.methods.emailDecode = function (email) { // using this helper method since requests are urlenconded which affects emails
  	this.email = decodeURIComponent(email).toLowerCase();
  	return this;
  }

  Users.methods.setUsername = function () {
  	this.username = this.email.split("@")[0];
  	return this;
  }

mongoose.model("users", Users);

usersModel = db.model("users");
module.exports = usersModel;