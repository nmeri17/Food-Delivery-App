/* we need to pack the images into their respective folders, read the name and folder name then add
* fs should land in stationary folder and for each folder inside, read the image name inside
*/

var mongoose = require("../node_modules/mongoose"),
fs = require("fs"),
db = mongoose.createConnection("mongodb://127.0.0.1:1717/five_star"),
s;

var Stationary = new mongoose.Schema({
	type: String,
	name: String,
	price: String
});

db.model("stationary", Stationary)
module.exports.stationary = s = db.model("stationary")


function Arrange (path, imageMap) {
	fs.readdir(path, function(err, folders) {

	if (err) return console.error(err);

	folders.forEach(function(type, index) {
		fs.readdir(path + "/" + type, function(err, files) {
			if (index != folders.length -1) {
				if (err) return console.error(err);
				imageMap[type] = files;
			}
			else {
				imageMap[type] = files;

				/* Uncomment the line below to init files in the db
				* addToModel(imageMap);
				*/
			}
		});
	});
});
}

function addToModel(argument) {
	var types = Object.keys(argument);

	types.forEach(function (type) {
		for (var i = argument[type].length - 1; i >= 0; i--) {
			var obj = {};
			obj.type = type;
			obj.name = argument[type][i].split(".")[0];
			obj.price = Math.random() * 100;
			var init = new s(obj);
			init.save(function (err) {
				if (!err) console.log('Success!');
			});
		}
	});
}

module.exports.arrange = Arrange;