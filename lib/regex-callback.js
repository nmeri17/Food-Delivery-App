/*
* multipurpose library for stomping out undesired data from a given template
* @param {Object} dataSet - An iterable object holding desired values
* @param {String} flag - Determines what to do with non matching sets. `MATCH` preserves it for further parsing while `EMPTY` discards it
* @param {Boolean} indexPage - Set to true only when parsing index pages. Retains `username_search` placeholder
* @returns a string containing template parsed through the given data
**/

regexCb = function (dataSet, flag, indexPage) {
	return function(match, $1, index) {
		var flagsObj = {EMPTY: "", MATCH: match};

		if (indexPage !== true && dataSet["username"] != void(0)) {
			dataSet["username_search"] = dataSet["username"];
		}

		if (dataSet[$1] != void(0)) return dataSet[$1];
				
		return flagsObj[flag];
	}
}

module.exports = regexCb;