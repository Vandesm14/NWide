const fs = require('fs');

let Sortable = require('sortablejs');

let editor;
const win = nw.Window.get();

const dirname = '.';

let settings = {
	filesystem: {
		ignore: ['node_modules', '.git']
	}
};
let ide = {
	tabs: [],
	getActive: function () {
		return this.getTab($('#tabs').find(`.tab.active`).attr('tab-id'));
	},
	getTab: function (id) {
		return this.tabs.find(el => el.id === id);
	},
	isOpen: function (path) {
		return !!this.tabs.find(el => el.path === path);
	},
	open: function (path) {
		if (!this.isOpen(path) && fs.statSync(path).isFile()) { // If not already open
			let id = ((+new Date()) * Math.round(Math.random() * Math.pow(10, 10))).toString(36);
			let content = fs.readFileSync(path).toString();
			let name = path.split('/')[path.split('/').length - 1];
			this.tabs.push({
				path,
				id,
				pos: {
					row: 0,
					column: 0
				},
				name,
				content,
				changed: false
			});
			$('#tabs').append(`<div class="tab" tab-id="${id}"><p class="name">${name}</p><img src="assets/x.png"></div>`);
			this.listeners();
			this.focus(id);
		}
	},
	close: function (id) {
		// TODO: Close on not saved popup (native)
		let tab = this.getTab(id);
		if (tab.changed && !confirm(`Discard changes for ${tab.name}`)) return; // Return if keep changes

		$('#tabs').find(`.tab[tab-id="${id}"]`).remove();
		this.tabs.splice(this.tabs.indexOf(id), 1);
		if (tabs.length > 0) {
			$('#tabs > .tab').last().click();
		} else {
			$('#editor').hide();
		}
	},
	save: function (path) {
		let tab = this.tabs.find(tab => tab.path === path);
		fs.writeFile(path, editor.getValue(), function (err) {
			if (err) {
				console.err(err);
				alert('There was an error saving the file.');
			} else {
				$('#tabs').find(`.tab[tab-id="${tab.id}"]`).removeClass('save');
				tab.changed = false;
			}
		});
	},
	unsaved: function (path) {
		let tab = this.tabs.find(tab => tab.path === path);
		$('#tabs').find(`.tab[tab-id="${tab.id}"]`).addClass('save');
		tab.changed = true;
	},
	focus: function (id) {
		if (this.getActive()) this.getActive().pos = editor.getCursorPosition();
		$('#tabs > .tab.active').removeClass('active');
		$('#tabs').find(`.tab[tab-id="${id}"]`).addClass('active');
		let tab = this.getActive();
		editor.setValue(tab.content);
		editor.focus();
		editor.gotoLine(tab.pos.row + 1, tab.pos.column);
		$('#editor').show();
	},
	listeners: function () {
		new Sortable($('#tabs')[0], {
			animation: 150,
			filter: 'img',
			invertSwap: false,
		});
		$('#tabs > .tab > img').off('click');
		$('#tabs > .tab > img').on('click', function (e) {
			e.stopPropagation();
			ide.close($(this).closest('.tab').attr('tab-id'));
		});
		$('#tabs > .tab').off('click');
		$('#tabs > .tab').on('click', function () {
			ide.focus($(this).closest('.tab').attr('tab-id'));
		});
	}
};

$(document).ready(function () {
	$('#btn-min').on('click', function () {
		win.minimize();
	});
	$('#btn-resize').on('click', function () {
		win.maximize();
	});
	$('#btn-close').on('click', function () {
		win.close();
	});

	$('#files').jstree({
		sort: function (a, b) {
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
				// 'stripes': true
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

	$('#files').on('activate_node.jstree', function (e, node) {
		let path = node.node.parents.filter(el => el !== '#');
		let jstree = $('#files').jstree(true);
		path = path.map(el => jstree.get_node(el).text);
		path.reverse().push(node.node.text);
		ide.open(path.join('/'));
	});

	// $('.jstree-default').focusin(function(){
	// 	$(this).css('color', '#ffffff');
	// });
	// $('.jstree-default').focusout(function(){
	// 	$(this).css('color', '#ffffff99');
	// });

	editor = ace.edit('editor');
	editor.setTheme('ace/theme/tomorrow_night_bright');
	editor.setFontSize('14px');
	editor.session.setMode('ace/mode/text');
});

function getFiles() {
	let pwd = [dirname || '.'];

	function dir(path) {
		let names = fs.readdirSync(path);
		names = names.filter(el => !settings.filesystem.ignore.includes(el));
		names = names.map(function (el) {
			el = {
				text: el
			};
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