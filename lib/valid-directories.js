/**!
* Module to scrape directory recursively and return all child directories
* @params: an absolute path to the directory to scrape
* @returns: object map of two arrays.
* @returns: the 1st array contains the child directories individual names and the 2nd, their absolute paths
*
*/

var fs = require("fs"), p = require("path");

module.exports = function (path) {
	var pathsObject = {relativeArr: [], absoluteArr: []};
	
	wrapper(path, pathsObject);
	return pathsObject;
}

function wrapper(path, obj) {
	obj.relativeArr.push(path.split("\\").slice(-2).shift());
	obj.absoluteArr.push(path)


	var contents = fs.readdirSync(path);

	contents.forEach(function(file) {
		var file = p.join(path + file+ "/"), stats = fs.statSync(file)
		if (stats && stats.isDirectory()) {
			wrapper(file, obj);
		}
	})
}