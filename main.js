// try {
	// global.monaco = require('monaco-editor');
// } catch (err) {
// 	require('fs').writeFileSync('err.txt', err.message);
// }

let winOptions = {
	icon: 'icon.png',
	frame: false,
	id: 'main'
};

let win = nw.Window.open('public/index.html', winOptions, (win) => {
	console.log('Opened window');
});
