var regexCb = require('./regex-callback'),
fs = require('fs');

component = function (templateName, dataSet) {
	var file = fs.readFileSync('public/index.html' , "utf8"),
	contents = new RegExp(`(<div class="${templateName}">[^]*?</div>)`).exec(file)[0],
	template = `<li>${contents}</li>`,
	carry = '';


	for (var index in dataSet) {
		dataSet[index].image = "/images/food/" + dataSet[index].name.split(' ').join('-') + ".jpg";

		carry += template.replace(/\{\{(\w+)\}\}/gi, regexCb(dataSet[index]));
	}
	return carry

}

module.exports = component;