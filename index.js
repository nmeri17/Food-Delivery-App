/* install module dependencies */

var http = require("http"),
connect = require("connect"),
mongoose = require("mongoose"),
url = require("url"),
fs = require("fs"),
nodemailer = require('nodemailer'),
bodyParser = require("body-parser").urlencoded({limit: "35kb", extended: true}), /* extended means it should accept any content type */
cookieSession = require("cookie-session"),
smtpTransport = require('nodemailer-smtp-transport'),
multer = require("multer"),
path = require("path"),
mime = require("mime"),
query = require("querystring"),
app = connect(),
staticPaths = require("./lib/valid-directories") (path.join(__dirname + "/public/")),
dissectURL = require("./lib/dissect"),
//onIndexLoad = require("./lib/index-load"),
regexCb = require('./lib/regex-callback'),
component = require('./lib/render-component'),
usersModel = require("./models/users"),
stationaryModel = require("./models/stationary"),
ordersModel = require("./models/orders"),
foodsModel = require("./models/foods"),
messagesModel = require("./models/messages"),
db = mongoose.createConnection("mongodb://127.0.0.1:1717/five_star"),
render = {username: '', available: '', orders: '', frequent: ''},
resObj = {errText: "", sessName: "", confirmState: false, ticketId: "", deliveryTime: 0, redirectTo: ""};



db.on('error', console.error.bind(console, 'connection error:'));

// The following code is like a middleware that runs only once--when the first connection is established
db.once('open', function() {

/* The arrange method should only be called once, to initialize those pictures into the database.
* After which, there is no need for that.
*
* stationaryModel.arrange("./public/stationary", {});
*/

// init accounts once
/*var arr = ["cookforme@fivestar.com", "vainglories17@gmail.com", "nmeri17@gmail.com"];

for (var i = 0; i < arr.length; i++) {
	usersModel.remove({email: arr[i]}, function (error, doc) {
	if (error) throw error;
})

	new usersModel({password: "0000", confirmedUser: true}).emailDecode(arr[i]).setUsername().save(function(error, init) {
	if (error) throw error;

})
}

usersModel.findOneAndUpdate({email: "cookforme@fivestar.com"}, {staffStatus: "admin"}, {new: true}, function(error, doc) {
	console.log(doc)
})
*/

});


app = app.use(bodyParser)
.use(cookieSession({secret: "mmay1717", httpOnly: false, maxAge: 24 * 60 * 60 * 1000, // 24 hours
	expires: new Date ().setSeconds(new Date ().getSeconds() + 3*60*60*24)}))
/* prolong session by 3 days on each request*/
.use(proxy)
.use("/register/", register)
.use("/confirm/", confirm)
.use("/login/", login)
.use("/users/", users)
.use("/search/", search)
.use("/edit/", edit)
.use("/staff/level/", level)
.use("/staff/assign", assign)
.use("/staff/profiles", profiles)
.use("/staff/messages/", messages)
.use("/admin/order/", order)
.use("/staff/delivered/", delivered)
.use("/admin/foods/", foods)
.use("/admin/available/", available)
.use("/admin/staffs/", allStaff);


function proxy (req, res, next) {
render.username = req.session.username;

	foodsModel.find({availableToday: true}, function(err, docs) {
		if (err) throw err;

		docs = docs.map(doc => doc.toObject())
		formattedDocs = component("food-menu", docs);
		render.available = formattedDocs;

		// prepare orders template for admin landing page
		var adminFile = fs.readFileSync("public/admin/index.html").toString(),
		regex = /th>\s*(\w+(.*)?)\s*<\/th/gim, // dynamically read headers from the table in views
		headers = [],
		temp;


		while ((temp = regex.exec(adminFile)) != null) {
			if (temp.index == temp.lastIndex) {
				lastIndex++;
			}

			// just in case header has space
			if (/\s/.test(temp[1])) {
				temp[1] = temp[1].replace(/\s(\w)/gi, function(match, $1) {
					return $1.toUpperCase()
				})
			}

			headers.push(temp[1])
		}
ordersModel.remove({estimatedDeliveryTime: null}).exec()
		ordersModel.find({}).sort('-orderPlaced').exec(function(err, allOrders) {
			if (err) throw err;

			var queries = query.parse(url.parse(req.url).query), pages = {}, counter = 0, pageNumber = 1, displayPage;


			allOrders.forEach(function (b) {
				counter++;
				if (!pages.hasOwnProperty(pageNumber)) {
					pages[pageNumber] = []
				}

				pages[pageNumber].push(b);

				if (counter >= 25) {
					counter = 0;
					pageNumber++;
				}
			});

			if (queries !== {}) {
				displayPage = parseInt(queries.page) != NaN && /* just to be sure someone doesnt try inputting invalid page */
				queries.page <= pageNumber &&
				pageNumber > 1 /* since the counter began at 1, requested page cannot be less than 1 */
				?  pages[queries.page] : pages[1];
			}

			var table = '';

			for (var i = 0; i < displayPage.length; i++) {
				var newRow = "<tr>";

				for (var j = 0; j < headers.length; j++) {
					newRow += "<td>" + allOrders[i][headers[j]] + "</td>";
				}

				table += newRow += "</tr>";
			}

			render.orders = table;

			ordersModel.find({status: 'delivered'}, 'food', function (err, orders) {
				if (err) throw err;

				var hashMap = [], returnArr = [];


				orders.forEach(function (order) {
					hashMap.push(order.toObject()['food'].split(","));
				})

				hashMap.reduce(function(a, b) {
					return a.concat(b)
				}, []).forEach(function(item) {

					if ((k = returnArr.findIndex(function(elem) {
						return elem[0] == item;
					})) != -1) {
						returnArr[k][1]++;
					}
					else returnArr.push([item, 1]);
				})

				// filter the ones with the highest value
				hashMap = [], returnArr = returnArr.sort(function(a, b) {
					return b[1] - a[1];
				}).slice(0, 5).forEach(function(elem) {
					hashMap.push({name: elem[0], counter: elem[1]})
				});

				render.frequent = component("frequent", hashMap);

				serveFromRoot(req, res, next);
			});
		});
	});
}

function serveFromRoot (req, res, next) {
	mime.define({"application/font-woff": ["woff"]});

	var appPaths = staticPaths.relativeArr, dissect, dir, file;

	try {
		dissect = new dissectURL(url.parse(req.url).pathname);
		dir = dissect.requestedDirectory;
		file = dissect.requestedFile;

		if (dissect.isNull) throw new Error();
	}
	catch(e) {
		console.log("catch invalid url ", new dissectURL(url.parse(req.url).pathname))
		next()
	}

	// include the root directory
	appPaths.unshift("");
	staticPaths.absoluteArr.unshift(path.join(__dirname + "/public/"));


/* If directory is not a static resource, invoke the next middleware (which handles such dynamic requests to virtual paths)
* If its a static directory and has no trailing slash, force a trailing slash
* otherwise if req is made to the index.html, cut it off
*/
	if(req.method == "GET") {
		if(appPaths.includes(dir)) {

			// dir is a relative string so if its a static resource, get its absolute path and feed to the fs func
			var filePath = staticPaths.absoluteArr[appPaths.indexOf(dir)];

			if (dissect.includesHTML) {
				res.writeHead(301, {Location: "/" + dir + "/"});
				res.end();
				return;
			}

			else if (!dissect.trailingSlash && file == "index.html") {
				res.writeHead(301, {Location: "/" + dir + "/"});
				res.end();
				return;
			}

			else {
				filePath += file;
			}
			
			fs.readFile(decodeURIComponent(filePath), function(err, contents) {

				if (err && err.code == "ENOENT") {
					res.statusCode = 404;
					res.end();
					return;
				}
				else {

					if (dir == "admin" && req.session.accountType !== "admin") {
							res.statusCode = 403;
							res.end("attempt to access privileged account denied.");
							return
					}

					if (dir == "staff" && file == "index.html") {
						if (req.session.accountType !== "staff") {
							res.statusCode = 403;
							res.end("attempt to access privileged account denied.");
							return
						}
					}


					if (filePath.indexOf("index.html") > -1) {
//new onIndexLoad(req.session.username)
						contents = contents.toString().replace(/\{\{(\w+)\}\}/gi, regexCb(render, "MATCH", true));

						// convert altered string back to buffer
						contents = Buffer.from(contents);
					}


					res.writeHead(200, {"Content-Type": mime.lookup(file), "Content-Length": Buffer.byteLength(contents)});
					res.end(contents);
					return;
				}
			});
		}

		else if (!/(foods|users|confirm|order|search|food|edit|available|profiles|staffs|delivered|messages|login|register)/gi.test(req.url)) {

			// else check if request is to nonstatic resource
				res.writeHead(404, {"Content-Type": "text/html"});
				res.end("err 404: cant find " + req.url);
			} 
			// virtual paths
			else next()
	}
	// post requests
	else next();
}

function confirmID() {
	var idCode = "0123456789", str ="";
	for (var i = 0; i < 18; i++) {
		str += idCode[parseInt(Math.random() * idCode.length)]
	}
	return parseInt(str.substr(5,12));
}

function register (req, res, next) {

	if (req.method == "POST") {

	if (req.session.username == undefined) {
		var newUser = new usersModel({password: req.body.password}).emailDecode(req.body.email).setUsername();

		usersModel.find({email: newUser.email, username: newUser.username}, function(error, matches) {
			if (error && error.err.indexOf("E11000") != -1) {
					resObj.errText = "email already in use";
  					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(resObj));
		  	}

			else if (matches.length == 0) {
				// send email and in the callback, res.end an id that we should add an extra input box. change
				// post method to confirm and update that user, then update session and redirect

			req.body.confirm = confirmID();
	
			var transporter = nodemailer.createTransport(smtpTransport({service: 'Gmail', auth: { user: 'vainglories17',
							pass: 'vainglories07039841657'}
				})
			);

			transporter.verify(function(error, success) {
   				if (error) {
        				console.log("err in transporter verification: " +error);
   				} 
			});

			var sendConfirmCode = transporter.templateSender({
    			subject: 'email confirmation for {{username}}!',
    			html: '<b>Hello, <strong>{{username}}</strong>, Please add this {{ID}} to the login form to complete your registration.</p>'
			}, {from: 'support@five_star.com'});
 
			sendConfirmCode({to: req.body.email}, {username: newUser.username, ID: req.body.confirm}, function(err, info){
   				if(err){
      				console.log('Error in sending mail');
    			}
    			else {
					new usersModel({password: req.body.password, confirmID: req.body.confirm}).emailDecode(req.body.email).setUsername()
					.save(function(err, newUser) {
							if (err) {
								throw (err);
							}
							else {
								resObj.confirmState = true;
  								res.writeHead(200, {"Content-Type": "application/json"});
								res.end(JSON.stringify(resObj));
								console.log("user successfully created");
							}
						});
    				}
				});
			}
		});
	}
	else {
		res.writeHead(302, {Location: "http://localhost:1717/users/" + req.session.username});
		res.end();
	}
}

// handle get requests
else {
		res.writeHead(302, {Location: "http://localhost:1717/login"});
		res.end();
	}

}

function confirm (req, res, next) {

	if (req.method == "POST") {

		if (req.session.username === undefined) {
			usersModel.findOneAndUpdate({email: req.body.email, confirmID: req.body.confirm_id}, {confirmedUser: true}, {multi: false},
				function(err, userUpdated) {
					if (err) throw(err);

					req.session.username = userUpdated.username;
				
  					res.writeHead(301, {Location: "/"});
					res.end();
			});
		}
	}
}

function login (req, res, next) {

	if (req.method == "POST") {
		// Ensure user is not logged in
		if (req.session.username == undefined) {

		usersModel.find({email: decodeURIComponent(req.body.email).toLowerCase(), password:  req.body.password}, function(err, matches) {
			if (err) throw(err);

			else if (matches.length > 0) {
				resObj.sessName = req.session.username = matches[0].username;
				resObj.redirectTo = req.session.accountType = matches[0].staffStatus;
				req.session.orderStatus = false;
				
				
  				res.writeHead(200, {"Content-Type": "application/json"});
				res.end(JSON.stringify(resObj));
				}
			else {
					resObj.errText = "Incorrect email or password";
  					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(resObj));

					// reset the value
					resObj.errText = "";
		  	}
		});
	}
		else {
			// If user is already signed in, redirect to their page
			res.writeHead(302, {Location: "http://localhost:1717/users/" + req.session.username});
			res.end();
		}
	}
	else {
		// handle get requests
		var page = fs.readFileSync('templates/login.tpl');

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end(page);
		}
}

function users (req, res, next) {
	// if its a registered user
	if (req.session.username != undefined) {
	var reqPage = path.basename(url.parse(req.url).pathname);


		// If user requesting the page is same as page owner
		if (reqPage === req.session.username) {
			usersModel.findOne({username: reqPage}, function(err, match) {
				if (err) throw err;
				else if (match != null) {
		res.writeHead(302, {Location: "/"});
		res.end();
				}
			});
		}
		else {
			res.statusCode = 403;
			res.end("access denied");
		}
	}
	else {
		res.writeHead(302, {Location: "/login/"});
		res.end();
	}
}

function foods (req, res, next) {
	if (req.method == "POST") {
		var foodImage = multer({dest: "public/images/food"}).single("food_image");

		foodImage(req, res, function(err) {
			if (err) next("unable to upload images");

			fs.rename(req.file.path, req.file.destination + "\\" + req.body.foodName.split(' ').join('-') + ".jpg", function(err) {
				if (err) throw err;

				new foodsModel({name: req.body.foodName, price: req.body.price}).save(function(err, savedFood) {
					if (err) throw err;

					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(savedFood));
				})
			})
		});
	}
	else {
		// return all the images
		var joinCollection = [stationaryModel.stationary, foodsModel], log = [], counter = 0,
		fakePromise = function(docs) {
				docs.forEach(function(b) {

					b = b.toObject();
					// only stationary foods have property `type` so if object has that property, pull its image from that
					// folder. Otherwise, pull from regular images folder

					if (b.hasOwnProperty("type")) {
						b.image = "/stationary/" + b.type + "/" + b.name.split(' ').join('-') + ".jpg";
					}

					else {
						b.image = "/images/food/" +  b.name.split(' ').join('-') + ".jpg";
					}

					b.price = (b.price * 10).toFixed(2)
					log.push(b)
				});
				counter++;

				if (counter === joinCollection.length) {
					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(log));
				}
			};

		for (var i = 0; i < joinCollection.length; i++) {

			joinCollection[i].find({}, function(err, foods) {
				if (err) next(new Error("unable to fetch images"));

				fakePromise(foods);
			});
		}
	}
}


function order (req, res, next) {
	if (req.method == "POST") {

		// if its a registered user
		if (req.session.username != undefined) {
			var incomingForm = multer().array();

			incomingForm(req, res, function(err) {

				/*
				* @Description: if this location is known, calculate its delivery time
				* i could use a separate model to statically store estimated time for every location
				requested, or fetch a random order from the same location's estimated time, but something
				could go wrong with that random request picked and cause it to take longer or shorter than usual
				*/
				var body = req.body,
				locality = decodeURIComponent(body.location),

				// replace street and road
				precise = locality.replace(/(street|road|onitsha|onicha)+?/gi, '').trim(),

				/* grab the last part of a string--preceded by a comma or space, then containing any word delimited
				(or not) by a hyphen */
				vicinity = new RegExp('[\\s,]?(\\w*?-?[a-z]*)$', 'i').exec(precise)[1],
				queryObj = {status: "delivered", location: new RegExp(vicinity)},

				/*find all items ending with a name. all subsequent estimated Delivery Time should
				get their own values from the values of heroes past*/

			 	updateEstimatedTime = function (update, endRes) {
					ordersModel.find(queryObj)
					.then(function(docs) {

					/* if we have only one previous order from this location, return that one order
					* otherwise average the others
					*/
					if (docs.length > 0 && endRes ==  undefined) {
					
						if (docs.length === 1) {
							pioneerOrder = docs[0].toObject()
							deliveryTime = new Date(pioneerOrder.orderDelivered).getMinutes() - new Date(pioneerOrder.orderPlaced).getMinutes();

							ordersModel.findOneAndUpdate({customer: update.customer, ID: update.ID},
								{estimatedDeliveryTime: deliveryTime},
								{new: true}, function (err, update) { console.log('just one')
									 updateEstimatedTime(update, true)
							});
						}
						else {
							ordersModel.find(queryObj)
							.then(function(liveList) {

								liveList = liveList.filter(e => e.estimatedDeliveryTime != null) /*using this line since the order is
								initialized/saved without an estimated time. Assuming I required the estimated delivery time first, then entering all
								columns in one go i.e while saving the order, this line will be needless

								Meanwhile, this line could be outside this else block (since we only use it once) but there might be more than
								one order with a null estimated delivery time. Thats why I need a live list
								*/
								var average = 0;

								for (var j =0; j < liveList.length; j++) {
									average += new Date(liveList[j].orderDelivered).getTime() - new Date(liveList[j].orderPlaced).getTime();
								}


								update.estimatedDeliveryTime = new Date(average/liveList.length).getMinutes();
								
								ordersModel.findOneAndUpdate({customer: update.customer, ID: update.ID},
									{estimatedDeliveryTime: update.estimatedDeliveryTime},
									{new: true}
								).then(function(update){
									updateEstimatedTime(update, true)
								});
							});
						}
					}
					else if (endRes == true) {
						console.log(update)
						// client is expecting ticket id and estimated time
						resObj['deliveryTime'] = update.estimatedDeliveryTime;

						res.writeHead(200, {"Content-Type": "application/json"});
						res.end(JSON.stringify(resObj));

					}
				// else the location hasnt been indexed. wait for delivery then update
				else {
					resObj['deliveryTime'] = -1;

					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(resObj));
				}
			}); // close `updateEstimatedTime`
			}; // close vars definition

			// prepare id for response
			resObj['ticketId'] = body.ID;

			new ordersModel (body).save().then(function(newOrder) {
				updateEstimatedTime(newOrder);
			});
		}); // close multer incoming form handler
	}
	
	// user not signed in and bypassed front end hook
	else {
		res.writeHead(302, {Location: "http://localhost:1717/login"});
		res.end();
	}
}

	// get req
	else {

		// prepare orders template for admin landing page
		var adminFile = fs.readFileSync("public/admin/index.html").toString(),
		regex = /th>\s*(\w+(.*)?)\s*<\/th/gim, // dynamically read headers from the table in views
		headers = [],
		temp;


		while ((temp = regex.exec(adminFile)) != null) {
			if (temp.index == temp.lastIndex) {
				lastIndex++;
			}

			// just in case header has space
			if (/\s/.test(temp[1])) {
				temp[1] = temp[1].replace(/\s(\w)/gi, function(match, $1) {
					return $1.toUpperCase()
				})
			}
		  	headers.push(temp[1]);
	}
		ordersModel.find({}).sort('-orderPlaced').exec(function(err, allOrders) {
			if (err) throw err;

			var queries = query.parse(url.parse(req.url).query), pages = {}, counter = 0, pageNumber = 1, displayPage;


			allOrders.forEach(function (b) {
				counter++;
				if (!pages.hasOwnProperty(pageNumber)) {
					pages[pageNumber] = []
				}

				pages[pageNumber].push(b);

				if (counter >= 25) {
					counter = 0;
					pageNumber++;
				}
			});

			if (queries !== {}) {
				displayPage = parseInt(queries.page) != NaN && /* just to be sure someone doesnt try inputting invalid page */
				queries.page <= pageNumber &&
				pageNumber > 1 /* since the counter began at 1, requested page cannot be less than 1 */
				?  pages[queries.page] : pages[1];
			}

			var table = '';

			for (var i = 0; i < displayPage.length; i++) {
				var newRow = "<tr>";

				for (var j = 0; j < headers.length; j++) {
					newRow += "<td>" + allOrders[i][headers[j]] + "</td>";
				}

				table += newRow += "</tr>";
			}

			console.log('giving you table', table)
			res.writeHead(200, {"Content-Type": "text/html"});
			res.end(table);
		});
	}
}

function delivered(req, res, next) {
	// query string should hold customer and id
	// you need to do a sql join with users model to ensure assign or session is staff and not user
	var orderToDeliver = query.parse(url.parse(req.url).query);
	ordersModel.findOne(orderToDeliver, function(err, order) {
		if (err) throw err;
	
		// do while session == name in assign column
		else if (order != null && order.assign == `<a href=/staff/profiles/${req.session.username}>${req.session.username}</a>`) {
			ordersModel.findOneAndUpdate(orderToDeliver, {orderDelivered: new Date(), status: "delivered"}, {fields: "assign ID"}, function(err, order) {
				if (err) throw err;

				res.writeHead(200, {"Content-Type": "application/json"});
				res.end(JSON.stringify(orderToDeliver));
			});
		}
		else {
			res.writeHead(200, {"Content-Type": "application/json"});
			res.end(JSON.stringify(orderToDeliver));
			console.log("order failed to deliver!!!! ", orderToDeliver)
		}
	});
}

function allStaff (req, res, next) {
	if (req.session.accountType !== "user" || void(0)) {
		var log = [], fakePromise = function() {
				res.writeHead(200, {"Content-Type": "application/json"});
				res.end(JSON.stringify(log));
			}

		usersModel.find({staffStatus: /[^user]/gi}, "username", function(err, staffs) {
			if (err) throw err;

			staffs.forEach(function(staff,index) {

				ordersModel.count({assign: "<a href=/staff/profiles/" + staff.username +">" + staff.username + "</a>"}, function(err, ordersCompleted) {

					staff = staff.toObject();
					staff.image = "/images/profiles/" + staff.username + ".jpg";
					staff.ordersCompleted = ordersCompleted;
					log.push(staff);

					if (index == staffs.length -1) fakePromise();
					});

				})

			});
		}
}

function profiles(req, res, next) {
	var profile = path.basename(req.url),
	endRes = function (dataSet) {
		dataSet.page_viewer = req.session.username;
	// grab template and replace properties with db data
		var template = fs.readFileSync("./templates/profile.tpl").toString().replace(/\{\{(\w+)\}\}/gi, regexCb(dataSet, 'MATCH', false))

		res.writeHead(200, {"Content-Type": "text/html"});
		res.end(template);
	};

	if (req.session.username == void(0)) {
		res.writeHead(302, {"Location": "/login"});
		return res.end();
	}
	else if (req.session.accountType == 'user') {
		res.statusCode = 403;
		return res.end('insufficient privileges');
	}

	usersModel.findOne({staffStatus: /[^user]/gi, username: profile}, "username", function(err, staff) {
		if (err) throw err;
		var temp = staff
		try {
			if (staff.length < 1) {
				res.writeHead(200, {"Content-Type": "text/html"});
				res.end("error 404: unable to find user " + profile);
				return;
			}

			ordersModel.count({status: "delivered", assign: `<a href=/staff/profiles/${profile}>${profile}</a>`}, function(err, ordersCompleted) {
					if (err) throw err;

					staff = staff.toObject();
					staff.ordersCompleted = ordersCompleted;
					staff.image = "/images/profiles/" + staff.username + ".jpg";

					if (req.session.username == profile) {

						// for some really REALLY dumb reason, http.get couldnt help me make a request to contacts
						usersModel.find({staffStatus: /[^user]/gi}, "username", function(err, contacts) {
							var newContacts = []

							// fetch all contacts and add dp to them
							contacts.forEach(function(contact) {
								if (contact.username != req.session.username) {
									contact = contact.toObject();
									contact.contact_image = "/images/profiles/" + contact.username + ".jpg";
									contact.contact_name = contact.username;
									delete contact._id, delete contact.username;
									newContacts.push(contact)
								}
							})
							staff.contacts = JSON.stringify(newContacts);
							endRes(staff);
						});
					}
					else endRes(staff);
				});
			}
			catch (e) {
				staff = temp;
				console.log('its claiming staff is null: ', staff)
			}
			});
}

function messages (req, res, next) {
	
	if (req.method == "POST") {
		var recipient = req.body.receiver, sender = req.session.username, message = req.body.message;

		new messagesModel({sender: sender, receiver: recipient, message: message}).save(function(err, newMessage) {
			if (err) throw err;

			res.statusCode = 200;
			res.end()

		})
	}
	else {
		var reqUrl = path.basename(url.parse(req.url).pathname), messagesObj = {sent: [], received: []};

			messagesModel.find({sender: req.session.username, receiver: reqUrl}, function (err, sentMsgs) {
				if (err) throw err;

				messagesModel.find({sender: reqUrl, receiver: req.session.username}, function (err, receivedMgs) {
					if (err) throw err;

					sentMsgs.forEach(function(msg) {
						messagesObj.sent.push(msg);
					})

					receivedMgs.forEach(function(msg) {
						messagesObj.received.push(msg);
					})

					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(messagesObj));
				})
			})
	}
}

function level (req, res, next) {
	
	if (req.session.accountType === "admin") {

	if (req.method == "POST") {
		if (req.body.promote != undefined) {
			usersModel.findOneAndUpdate({username: req.body.promote, staffStatus: "user"}, {staffStatus: "staff"}, function(err, doc) {
				if (err) throw err;

				if (doc !== null) {
					res.statusCode = 200;
					res.end("true");
				}
			});
		}
		else if (req.body.demote != undefined) {
			usersModel.findOneAndUpdate({username: req.body.demote, staffStatus: "staff"}, {staffStatus: "user"}, function(err, doc) {
				if (err) throw err;

				if (doc !== null) {
					res.statusCode = 200;
					res.end("true");
				}
			});
		}
	}
}
}

function available (req, res, next) {
	if (req.method == "POST") {
		if (req.body.add != undefined) {
			foodsModel.findOneAndUpdate({name: req.body.add}, {availableToday: true}, function(err, doc) {
				if (err) throw err;

				res.writeHead(200, {"Content-Type": "application/json"});
				res.end("true");
			})
		}
		else if (req.body.remove != undefined) {
			foodsModel.findOneAndUpdate({name: req.body.remove}, {availableToday: false}, function(err, doc) {
				if (err) throw err;

				res.writeHead(200, {"Content-Type": "application/json"});
				res.end("true");
			})
		}
	}

	// handle get req
	else {
		var contentType = req.headers.accept.split(',')[0];

		foodsModel.find({availableToday: true}, function(err, docs) {
			if (err) throw err;

			else {
				/*if (contentType.indexOf('html')) {
					docs = docs.map(doc => doc.toObject())
					formattedDocs = component("food-menu", docs);

					res.writeHead(200, {"Content-Type": "text/html"});
					res.end(formattedDocs);
				}
				else { // return json
					*/
					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(docs));
				//}
			}
		})
	}

}

function search (req, res, next) {
	var toSearch = query.parse(url.parse(req.url).query);

	if (toSearch.food_search !== undefined) {

	foodsModel.find({name: new RegExp("^" + toSearch.food_search, "gi"), availableToday: false}, function(err, docs) {
		if (err) throw err;

		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(docs));
	});
}
else if(toSearch.user_search !== undefined) {

	usersModel.find({username: new RegExp("^" + toSearch.user_search, "gi")}, function(err, users) {
		if (err) throw err;

		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(users));
	});
}
}


function assign (req, res, next) {
	if (req.method == "POST") {
		if (req.session.username !== undefined) {
			ordersModel.findOneAndUpdate({customer: decodeURIComponent(req.body.customer), ID: req.body.ID},
				{assign: "<a href=/staff/profiles/" + req.session.username +">" + req.session.username + "</a>", status: "assigned"},
				{new: true},
				function (err, order) {
				if (err) throw err;

				if (order != null) {
					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(JSON.stringify(order));
				}
				else res.end('odrer is null');
			})
		}
		else {
			res.writeHead(302, {Location: "/login/"});
			res.end();
		}
	}
}


function edit (req, res, next) {
	var qs = query.parse(url.parse(req.url).query);

	if (qs !== {}) {
		var get = Object.keys(qs)[0],
		model = get == "staff" ? usersModel : foodsModel,
		key = model == foodsModel ? "name" : "username",
		condition = {},
		imagePath = '',
		authorised = get == "staff" ? req.session.username != qs[get] ? !1 : !0 : !1, // editor is page owner and page edited is not food
		endRes = function (doc) {
			if (doc != null) {

				doc = doc.toObject();
				doc.username = req.session.username;

				if (doc.hasOwnProperty("type")) doc.image = "/stationary/" + doc.type + '/' + imagePath;

				else if (key == "username") {
					doc.image = "/images/profiles/" +  doc.username + ".jpg";
					doc.username_search = condition[key];
				}

				else doc.image = "/images/food/" + imagePath;

				var template = fs.readFileSync("./templates/edit.tpl")
				.toString().replace(/\{\{(\w+)\}\}/gi, regexCb(doc, "EMPTY", true));

				res.writeHead(200, {"Content-Type": "text/html"});
				return res.end(template);
			}
			else return res.end('doc is null');
		}, // close `endRes`
		deleteFood = function(type, moveToStationary) {
			model.findOneAndRemove(condition)
			.then(function(deletedFood) {
				if (deletedFood == null) {
					model = stationaryModel.stationary;
					deleteFood(type, moveToStationary);
				}

				if (moveToStationary == void(0)) {
					if (type == void(0)) fs.unlinkSync(path.join(__dirname + "/public/images/food/" + imagePath));
				
					else fs.unlinkSync(path.join(__dirname + "/public/stationary/" + deletedFood.type + "/" + imagePath));

					res.writeHead(301, {Location: '/admin/'});
					
					return res.end(`all details about ${deletedFood.name} were deleted successfully.`);
				}
				else fs.renameSync(path.join(__dirname + "/public/images/food/" + imagePath),
					path.join(__dirname + "/public/stationary/" + deletedFood.type + "/" + imagePath), function(err) {
					if (err) console.log('tried moving image from food to stationary but it hasnt been uploaded to foods yet');
				});

			});
		};

		condition[key] = decodeURIComponent(qs[get]);
		imagePath = condition[key].split(' ').join('-') + ".jpg";

		if (req.session.accountType === "admin" || authorised) {
		
			if (req.method == 'POST') {
				var incomingImage = multer().single("image");

				incomingImage(req, res, function(err) {
					if (err) next("unable to upload image");

					else {
						// upload image if any
						if (req.file) {
							if (req.body.stationary) {
								fs.writeFile(path.join(__dirname + "/public/stationary/" + req.body.category + "/" + imagePath), req.file.buffer);
							}
							else if (get == "staff") {
								fs.writeFile(path.join(__dirname + "/public/images/profiles/" + imagePath), req.file.buffer);
							}
							else fs.writeFile(path.join(__dirname + "/public/images/food/" + imagePath), req.file.buffer);

						}

						// then test for stationary
						if (req.body.stationary && req.body.category) {
							deleteFood(true, true);
							
							new stationaryModel.stationary({name: decodeURIComponent(req.body.name), price: req.body.price, type: req.body.category})
								.save(function(err, savedDoc, rowCount) {
									if (err) resObj.errText = 'some input fields are missing';

									endRes(savedDoc);
								});
						}
						else {

							// filter undesirables from body
							var newBody = {},
							undesirables = ['category', 'submit'],
							notEmpty = Object.keys(req.body).filter(function(key) {
								return !undesirables.includes(key) && req.body[key].length > 1;
							}).forEach(function(key) {
								newBody[key] = req.body[key];
							});

							model.findOneAndUpdate(condition, newBody, {new: true}, function(err, doc) {
								if (err) throw err;

								// check if food being searched was stored in stationary
								if (doc == null && model === foodsModel) {
									stationaryModel.stationary.findOneAndUpdate(condition, newBody, {new: true}, function(err, doc) {
										if (err) throw err;

										endRes(doc);
									});
								}

								else endRes(doc);
								
								/*
								remember to rename image after editing (proactively assuming its name eas changed) this change should be done
								inside `endRes` whereby we attempt to get the said image using fsstat and if we get ENOENT, we use
								`condition['name'].imagePath` to grab the old image name then delete it.
								*/
							});
						}
					}
				});
			}
			
			// get request
			else {
				model.findOne(condition, function(err, doc) {
					if (err) throw err;

					// check if food being searched was stored in stationary
					if (doc == null && model === foodsModel) {
						stationaryModel.stationary.findOne(condition, function(err, doc) {
							if (err) throw err;
							else {
								if (get == 'delete') deleteFood(doc.type);
								else endRes(doc);
							}
						});
					}
					else {
						// putting this inside here to assert image is not coming from stationary
						if (get == 'delete') deleteFood();
						else endRes(doc);
					}
				});
			}
		}
		else res.end('insufficient privileges');
	}

	else res.end("query string is empty");
}


/*
* End of middlewares. Create server
*/

http = http.createServer(app).listen(1717);


var io = require("socket.io")(http);


io.on("connection", function(socket) {
	// add username to socket for message identification

	socket.msgUsername = io.sockets.sockets[socket.id].handshake.headers.referer.split('/').pop();

	// rewrite this and `onorderStatus` to be used on the model. use ajax get requests to order dir to auth pending requests
	//socket.orderStatus = false;

	socket.on("newOrder", function(formDetails) {
		io.emit("newOrder", formDetails);
	});

	// expecting the socket id which should be set back to false
	socket.on("delivered", function (deliveredOrder) {
		socket.broadcast.emit("delivered", deliveredOrder)
	})

	//on (load available today in an object) {
		io.emit("availableToday" /*, available foods obj*/);
	//}

	socket.on("stationaryOn", function (typeObj) {

		stationaryModel.stationary.find({type: typeObj.type}, "name price", function(err, matches) {
			if (err) throw err;

			matches = matches.map(function(doc) {
				doc = doc.toObject();
				doc.image = "/stationary/" + typeObj.type + "/" + doc.name.split(' ').join('-') + ".jpg";
				return doc;
			})

			io.sockets.connected[socket.id].emit("stationaryOn", matches);
		});

	});

	socket.on("assigned", function(assignedOrder) {
		socket.broadcast.emit("assigned", assignedOrder)
	});

	socket.on("newMessage", function(msgObj) {
		var room = `${msgObj.sender}-${msgObj.receiver}`
		// create room for them both
		socket.join(room, function(err) {
			if (err) throw err;

			// add receiver to the room
			for (var socketID in io.sockets.sockets) {
				if (io.sockets.sockets[socketID].msgUsername == msgObj.receiver) {
					io.sockets.connected[socketID].join(room)
				}
			}

			socket.in(room).emit('newMessageToRoom', {sender: msgObj.sender, message: msgObj.message});
		})
	})
});