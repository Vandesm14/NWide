const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const modelist = ace.require('ace/ext/modelist');

let Sortable = require('sortablejs');

let editor;
const win = nw.Window.get();

const dirname = '.';
const rootDir = path.resolve().split(path.sep)[path.resolve().split(path.sep).length - 1];

let settings = {
	filesystem: {
		ignore: ['node_modules', '.git']
	},
	editor: {
		indentSize: 2,
		indentWithTabs: true
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
	getFromPath: function (path) {
		return this.tabs.find(el => el.path === path);
	},
	isOpen: function (path) {
		return !!this.tabs.find(el => el.path === path);
	},
	refresh: function (id, node) {
    if (node.node) node = node.node;
		if (node) {
			if (this.getTab(id)) {
				this.getTab(id).path = pathFromNode(node);
				$('#tabs').find(`.tab[tab-id="${id}"] > .name`).text(this.getTab(id) ? this.getTab(id).name : '');
				editor.session.setMode(modelist.getModeForPath(node.text).mode);
			}
		} else {
			this.close(id);
		}
	},
	open: function (path, node) {
  if (node.node) node = node.node;
		if (!this.isOpen(path) && fs.statSync(path).isFile()) { // If not already open
			let id = node.id;
			let content = fs.readFileSync(path).toString();
			let name = node.text;
			this.tabs.push({
				path,
				id,
				pos: {
					row: 0,
					column: 0
				},
				name,
				node,
				content,
				changed: false
			});
			$('#tabs').append(`<div class="tab" tab-id="${id}"><p class="name">${name}</p><img src="assets/x.png"></div>`);
			this.listeners();
			this.focus(id);
			this.tabs[this.tabs.length - 1].changed = false;
		} else if (this.isOpen(path)) {
			ide.focus(this.getFromPath(path).id);
		}
	},
	close: function (id) {
		// TODO: Close on not saved popup (native)
		let tab = this.getTab(id);
		let focused = $('#tabs').find(`.tab[tab-id="${id}"]`).hasClass('active');
		let index = $('#tabs').find(`.tab[tab-id="${id}"]`).index();
		if (tab.changed && !confirm(`Discard changes for ${tab.name}`)) return; // Return if keep changes

		$('#tabs').find(`.tab[tab-id="${id}"]`).remove();
		this.tabs.splice(this.tabs.indexOf(this.getTab(id)), 1);
		if (focused && this.tabs.length > 0) {
			if (index > this.tabs.length - 1) {
				this.focus($('#tabs > .tab').eq(index - 1).attr('tab-id'));
			} else {
				this.focus($('#tabs > .tab').eq(index).attr('tab-id'));
			}
		} else if (this.tabs.length === 0) {
			$('#editor').hide();
			$('#title').text(`${rootDir} - NWide`);
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
				$('#tabs').find(`.tab[tab-id="${tab.id}"] > img`).attr('src', 'assets/x.png');
				tab.changed = false;
			}
		});
	},
	unsaved: function (path) {
		let tab = this.tabs.find(tab => tab.path === path);
		if (tab.content !== editor.getValue()) {
			$('#tabs').find(`.tab[tab-id="${tab.id}"]`).addClass('save');
			$('#tabs').find(`.tab[tab-id="${tab.id}"] > img`).attr('src', 'assets/circle.png');
			tab.content = editor.getValue();
		  tab.changed = true;
		}
	},
	focus: function (id) {
		if (this.getActive()) this.getActive().pos = editor.getCursorPosition();
		$('#tabs > .tab.active').removeClass('active');
		$('#tabs').find(`.tab[tab-id="${id}"]`).addClass('active');
		let tab = this.getActive();

		$('#title').text(`${tab.name} - ${rootDir} - NWide`);
		$('#editor').show();
		editor.session.setMode(modelist.getModeForPath(tab.path).mode);
		editor.setValue(tab.content);
		editor.gotoLine(tab.pos.row + 1, tab.pos.column);
		editor.focus();
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
	$('#title').text(`${rootDir} - NWide`);

	$('#save').on('click', function () {
		ide.save(ide.getActive().path);
	});

	$('#btn-min').on('click', function () {
		win.minimize();
	});
	$('#btn-resize').on('click', function () {
		win.maximize();
	});
	$('#btn-close').on('click', function () {
		win.close();
	});
	
	$('#new-file').on('click', function () {
		let parent = $('#files .jstree-clicked').attr('id');
		if ($('#files').jstree(true).get_node(parent).type === 'file') {
			parent = $('#files').jstree(true).get_node(parent).parent;
		}
		let name = prompt('Enter a filename');
	  if (name) {
			let id = $('#files').jstree(true).create_node(parent || '#', {text: name, type: 'file'});
			let path = pathFromNode($('#files').jstree(true).get_node(id));
			fs.writeFileSync(path, '');
			ide.open(path, $('#files').jstree(true).get_node(id));
	  }
	});
	$('#new-folder').on('click', function () {
		let parent = $('#files .jstree-clicked').attr('id');
		if ($('#files').jstree(true).get_node(parent).type === 'file') {
			parent = $('#files').jstree(true).get_node(parent).parent;
		}
	  let name = prompt('Enter a folder name');
	  if (name) {
  		let id = $('#files').jstree(true).create_node(parent || '#', {text: name});
  		let path = pathFromNode($('#files').jstree(true).get_node(id));
			fs.mkdirSync(path);
			// FIXME: Callback doesn't execute, node does not open
			$('#files').jstree(true).open_node(parent, function () {
				console.log('Node opened');
			});
	  }
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
			check_callback: function (operation, node, node_parent, node_position, more) {
				if (operation === 'delete_node') {
					if (!confirm(`Are you sure you sure you want to delete "${node.text}"?`)) {
						return false;
					}
				}
				return true;
			},
			data: getFiles(),
		},
		plugins: ['contextmenu', 'dnd', 'types', 'unique', 'sort', 'conditionalselect'],
		contextmenu: {
			show_at_node: false,
		},
		types: {
			'default': {
				icon: 'assets/folder.png'
			},
			'file': {
				icon: 'assets/file.png',
				valid_children: []
			}
		},
		conditionalselect: function(node, event){
			return event.which === 1;
		}
	});

	$('#files').on('activate_node.jstree', function (e, node) {
		ide.open(pathFromNode(node), node);
	});
	$('#files').on('delete_node.jstree', function (e, node) {
		let path = pathFromNode(node);
		if (node.node.type === 'file') {
			if (ide.isOpen(path)) ide.close(node.node.id);
			fs.unlinkSync(path);
		} else {
			rimraf.sync(path);
		}
	});
	$('#files').on('rename_node.jstree', function (e, node) {
		let path = pathFromNode(node).split('/');
		path.pop();
		let old = [...path, node.old].join('/');
		let text = [...path, node.text].join('/');
		fs.renameSync(old, text);
		if (ide.isOpen(old)) {
			ide.getFromPath(old).name = node.text;
			ide.refresh(node.node.id, node);
		}
	});

	editor = ace.edit('editor');
	editor.setTheme('ace/theme/tomorrow_night_bright');
	editor.setFontSize('14px');
	editor.session.setOptions({
		mode: 'ace/mode/text',
		tabSize: settings.editor.indentSize,
		useSoftTabs: settings.editor.indentWithTabs
	});

	$('#editor').on('keyup', function () {
		ide.unsaved(ide.getActive().path);
	});
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
	return ret;
}

function pathFromNode(node) {
  if (node.node) node = node.node;
	let path = node.parents.filter(el => el !== '#');
	let jstree = $('#files').jstree(true);
	path = path.map(el => jstree.get_node(el).text);
	path.reverse().push(node.text);
	return path.join('/');
}
