var ordersModel = require("../models/orders"),
foodsModel = require("../models/foods"),
fs = require("fs"),
http = require('http'),
component = require('../lib/render-component'),
render = {username: '', available: '', orders: '', frequent: ''},
attachModule = 1;
/*
 function OnIndexLoad (username) {
 	var that = this;

 	this.username = username;
 	this.render = render;
	
this.endRes = function (username) {
	this.render.username = username;
	console.log(render, this.render);
	return this.render;
};

// this module should fetch certain vars/datas that should be ready when some index pages load
this.init = function (current) {
	var utilMap =	{
	// prepare availableToday string for landing page
	
	1: function (index) {
		console.log('inside ' + index); // runs but never enters async func

		http.get({port: '1717', path: '/admin/available/', headers: {Accept: 'text/html'}}, function(res) {
		var temp = ''
		res.setEncoding('utf8');

		console.log('inside get' + index);
	
		res.on('data', function (chunk) {
			temp += chunk;
		}).on('end', function() {
			this.render.available = temp;
			index++;
			console.log(this, 'moving')
			that.init(index)
		})
		
	}).on('error', function(e) {
			console.log('err available', e)
		});
	},
	
	//ordersModel.remove({estimatedDeliveryTime: null}).exec()
	
	2: function(index) {
		http.get('http://localhost:1717/admin/order/?page=0',  function(res) {
		
		var temp = ''
		res.setEncoding('utf8');
	
		res.on('data', function (chunk) {
			temp += chunk;
		}).on('end', function() {
			this.render.orders = temp;
			index++;
			that.init(index)
		})
	}).on('error', function(e) {
			console.log(e)
		});
	},
	
	// prepare frequently requested string for landing page
	
	3: function(index) {
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
	
		this.render.frequent = component("frequent", hashMap);
		index++;
		that.init(index)
	})
	}
	}; // close util map

	var itemsToReturn = Object.keys(render).filter(e => e != 'username');

	if (current < itemsToReturn.length) {
		utilMap[current](current);
	}
		else return this.endRes(this.username);
} // close init

this.init(attachModule);

}
/*var o = new OnIndexLoad('cookforme')
console.log(o.render)

exports = OnIndexLoad;

*///*/























var request = require('request');
request('http://localhost:1717/admin/available',  function(err, res, body) {
	console.log(err, res, body)
})
http.get({port: 1717, path: '/admin/available/', headers: {Accept: 'text/html'}}, function(res) {
		var temp = '';
		res.setEncoding('utf8');

		console.log('inside get');
	
		res.on('data', function (chunk) {
			temp += chunk;
		}).on('end', function() {
			render.available = temp;

			http.get('http://localhost:1717/admin/order/?page=0',  function(res) {
		
			var temp = ''
			res.setEncoding('utf8');
		
			res.on('data', function (chunk) {
				temp += chunk;
			}).on('end', function() {
				render.orders = temp;

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

				console.log(render)
			}) // orders model find
		}); // get orders
	}).on('error', function(e) {
			console.log(e)
		});
	}); // available on end
		
}).on('error', function(e) {
			console.log('err available', e)
	}); // available on error