var mongoose = require("../node_modules/mongoose"), db = mongoose.createConnection("mongodb://127.0.0.1:1717/five_star");

var Orders = new mongoose.Schema({
	food: {type: String, lowerCase: true},
	customer: {type: String, lowerCase: true},
	location: {type: String, lowerCase: true},
	price: Number,
	ID: String,
	status: {type: String, enum: ["pending", "assigned", "delivered"], lowerCase: true},
	assign: String,
	orderPlaced: {type: Date, default: new Date() },
	orderDelivered: {type: Date, default: null},
	estimatedDeliveryTime: Number // of minutes
});

db.model("orders", Orders)
module.exports = db.model("orders");