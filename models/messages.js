var mongoose = require("../node_modules/mongoose"), db = mongoose.createConnection("mongodb://127.0.0.1:1717/five_star");

var Messages = new mongoose.Schema({
	sender: String,
	receiver: String,
	message: {type: String, required: true},
	date: {type: Date, default: new Date() },
});

db.model("messages", Messages)
module.exports = db.model("messages");