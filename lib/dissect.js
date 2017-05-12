/**
* @Module: The ensuing Module should strip requests down to directory, file and file extension, with properties
* holding different parts of argument inaccesible by req.url.pathname
* @params: a relative url starting with a forward slash
* @returns: instance of the object
**/

module.exports = function (url) {
	var regex = /(\/([\w-]+))?((\/([\w-\s]+(\.([a-z]+)))?)?)?$/gi, matches = regex.exec(url);

	if (matches != null) {
		this.requestedDirectory = matches[2];
		this.trailingSlash = false;
		this.isRootDir = false;
		this.requestedFile = matches[5];
		this.fileExtension = matches[7];
		this.includesHTML = false;
	
		if (matches[3] != undefined && matches.slice(5).every(element => element === undefined)) {
			this.trailingSlash = true;
		}

		if (matches[0] == "/" && matches.slice(1).some(element => element === undefined)) {
			this.isRootDir = true;
			this.requestedDirectory = "";
		}

		if (this.requestedFile == "index.html") {
			this.includesHTML = true;
		}

		else if (this.requestedFile === undefined) {
			this.requestedFile = "index.html";
		}

		if (this.requestedDirectory === undefined) {
			this.isRootDir = true;
			this.requestedDirectory = "";
		}
	}

	else this.isNull = true;
}