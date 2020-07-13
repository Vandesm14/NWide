// const nw = require('nw.gui');
let tray;

let winOptions = {
	icon: 'icon.png',
	frame: false,
	id: 'main'
};

let win = nw.Window.open('public/index.html', winOptions, (win) => {
	console.log('Opened window');
});