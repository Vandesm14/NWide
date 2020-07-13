const fs = require('fs');
const win = nw.Window.get();

$(document).ready(function () {
	$('.menu > .list').on('mouseover', function () {
		$(this).find('.list-items').addClass('show');
	});
	$('.menu > .list').on('mouseout', function () {
		$(this).find('.list-items').removeClass('show');
	});

	$('#btn-min').on('click', function(){
		win.minimize();
	});
	$('#btn-resize').on('click', function(){
		win.maximize();
	});
	$('#btn-close').on('click', function(){
		win.close();
	});
	
	$('#jstree_demo_div').jstree({
		core: {
			check_callback: true,
			data: [
				'Simple root node',
				{
					text: 'Root node 2',
					children: [{
						text: 'Child 1'
					},
					{
						text: 'Child 2',
						type: 'file'
					},
					'Child 3',
					'Child 4',
					'Child 5'
				]
			}
		],
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
});