var mongoose = require("../node_modules/mongoose"), db = mongoose.createConnection("mongodb://127.0.0.1:1717/five_star");

var Foods = new mongoose.Schema({
	name: {type: String, index: {unique: true}},
	price: String,
	availableToday: {type: Boolean, default: false}
});

db.model("foods", Foods)
module.exports = db.model("foods");