const fs = require('fs');

// const monaco = global.monaco;
const win = nw.Window.get();

const dirname = '.';

let settings = {
	filesystem: {
		ignore: ['node_modules', '.git']
	}
}

$(document).ready(function () {
	$('#btn-min').on('click', function(){
		console.log('hello');
		win.minimize();
	});
	$('#btn-resize').on('click', function(){
		win.maximize();
	});
	$('#btn-close').on('click', function(){
		win.close();
	});
	
	$('#files').jstree({
		sort: function(a,b) {
			console.log('sort');
			a = this.get_node(a);
			b = this.get_node(b);
			if (a.type === 'file' && b.type === 'file') { // file, file
				if (a.text > b.text) {
					return 1;
				} else {
					return -1;
				}
			} else if (a.type === 'file' && b.type !== 'file') { // file, folder
				return 1;
			} else if (a.type !== 'file' && b.type == 'file') { // folder, file
				return -1;
			} else if (a.type !== 'file' && b.type !== 'file') { // folder, folder
				if (a.text > b.text) {
					return 1;
				} else {
					return -1;
				}
			} else {
				return -1;
			}
		},
		core: {
			check_callback: true,
			data: getFiles(),
			themes: {
				'stripes': true
			},
		},
		plugins: [
			'contextmenu', 'dnd', 'types', 'unique', 'changed', 'sort'
		],
		types: {
			'default': {
				icon: 'assets/folder.png'
			},
			'file': {
				icon: 'assets/file.png',
				valid_children: []
			}
		}
	});

	// $('.jstree-default').focusin(function(){
	// 	$(this).css('color', '#ffffff');
	// });
	// $('.jstree-default').focusout(function(){
	// 	$(this).css('color', '#ffffff99');
	// });

	// monaco.editor.create($('#editor')[0], {
	// 	value: 'console.log("Hello, world")',
	// 	language: 'javascript'
	// });
});

function getFiles() {
	let pwd = [dirname || '.'];
	function dir(path) {
		let names = fs.readdirSync(path);
		names = names.filter(el => !settings.filesystem.ignore.includes(el));
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
	let ret = dir(pwd.join('/'));
	console.log(ret);
	return ret;
}