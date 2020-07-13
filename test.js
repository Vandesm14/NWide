const fs = require('fs');
function getFiles() {
	let pwd = ['.'];
	function dir(path) {
		let names = fs.readdirSync(path);
		names = names.map(function(el){
			el = {text: el};
			let isFile = fs.statSync(path + '/' + el.text).isFile();
			if (isFile) {
				el.type = 'file';
			} else {
				pwd.push(el.text);
				el.children = dir(pwd.join('/'));
				pwd.pop();
			}
			return el;
		});
		return names;
	}
	return dir('.');
}

console.log(JSON.stringify(getFiles(), null, 2));