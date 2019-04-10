var TAB_HTML = 0;
var TAB_CSS = 1;
var TAB_JS = 2;
var TAB_OUTPUT = 3;

playCss = {
	selectedTabId: null,
	code: {
		html: "",
		css: "",
		js: ""
	},
	frameworks: {
		css: [
			{
				url: "https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css",
				active: false
			},
			{
				url: "https://use.fontawesome.com/releases/v5.8.1/css/all.css",
				active: true
			},
			{
				url: "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css",
				active: false
			},
			{
				url: "https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css",
				active: false
			},
			{
				url: "https://cdn.datatables.net/select/1.3.0/css/select.dataTables.min.css",
				active: false
			}
		],
		js: [
			{
				url: 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js',
				active: false
			},
			{
				url: 'https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js',
				active: false
			}
		]
	},
	load: function() {
		if ('playCss' in sessionStorage) {
			var data = JSON.parse(sessionStorage.playCss);
			this.selectedTabId = data.selectedTabId
			this.previousTabId = data.previousTabId
			this.code = data.code;
		}
	},
	save: function() {
		sessionStorage.playCss = JSON.stringify(this);
	},
}

function getCommandKey() {
	if (navigator.userAgent.indexOf('Mac') != -1) {
		return "metaKey";
	} else {
		return "ctrlKey";
	}
}

window.onload = function() {
	/*
	 * Setup tabs, boxes and editors
	 */
	tabs = document.querySelectorAll('#navbar li.tab');
	tabs.selected = null;
	tabs.previous = null;

	/*
	 * Each tab has a related box to display content
	 */
	tabs[TAB_HTML].box = document.getElementById('box-html');
	tabs[TAB_CSS].box = document.getElementById('box-css');
	tabs[TAB_JS].box = document.getElementById('box-js');
	tabs[TAB_OUTPUT].box = document.getElementById('box-output');

	/*
	 * Some tabs have an editor to edit content
	 */
	tabs[TAB_HTML].editor = buildEditor('box-html', 'html');
	tabs[TAB_CSS].editor = buildEditor('box-css', 'css');
	tabs[TAB_JS].editor = buildEditor('box-js', 'javascript');

	/*
	 * Enable emmet plugin for html editor
	 */
	tabs[TAB_HTML].editor.setOption('enableEmmet', true);

	/*
	 * Attach event listeners to tabs
	 */
	for (var i = 0; i < tabs.length; i++) {
		tabs[i].addEventListener('click', function(event) {
			selectTab(this);
		});
	}

	for (i = TAB_HTML; i <= TAB_JS; i++) {
		tabs[i].addEventListener('selected', function() {
			if (tabs.previous !== null) {
				var tabId = tabs.previous.tabId;
			}

			this.editor.resize(); // this avoids editor flicker when first selected
			this.editor.focus();
		});
	}

	tabs[TAB_OUTPUT].addEventListener('selected', function(event) {
		buildResult();
	});

	bindButtons();

	/*
	 * Initial actions
	 */
	playCss.load();

	tabs[TAB_HTML].editor.setValue(playCss.code.html, -1);
	tabs[TAB_CSS].editor.setValue(playCss.code.css, -1);
	tabs[TAB_JS].editor.setValue(playCss.code.js, -1);

	var tab = null;

	if (playCss.selectedTabId !== null) {
		tab = document.getElementById(playCss.selectedTabId);
	}

	if (tab === null) {
		tab = tabs[TAB_HTML];
	}

	selectTab(tab);
}

document.onfullscreenchange = function() {
	if (document.fullscreen) {
		document.getElementById('btn-fullscreen').innerHTML = 'fullscreen_exit';
	} else {
		document.getElementById('btn-fullscreen').innerHTML = 'fullscreen';
	}
}

window.onkeydown = function(event) {
	var commandKey = getCommandKey();

	if (event[commandKey]) {
		var button = document.getElementById("btn-delete");
		button.innerHTML = "delete_sweep";
	}

	var commandKey = getCommandKey();

	switch (event.code) {
		case 'Escape':
			closePanel();
			break;

		case 'KeyS':
			if (event[commandKey]) {
				saveCode();
				event.preventDefault();
			}

			break;

		case 'Enter':
			if (event[commandKey]) {
				if (tabs.selected == tabs[TAB_OUTPUT]) {
					selectTab(tabs.previous);
				} else {
					selectTab(tabs[TAB_OUTPUT]);
				}
			}

			break;
	}
}

window.onkeyup = function(event) {
	var button = document.getElementById("btn-delete");
	button.innerHTML = "delete";
}

window.onclick = function(event) {
	var panel = document.getElementById("panel");

	if (event.target == panel) {
		closePanel();
	}
}

function attachClickHandler(id, handler) {
	var button = document.getElementById(id);
	if (button !== null) {
		button.addEventListener("click", handler);
	}
}

function bindButtons() {
	attachClickHandler("btn-menu", function() {
		showPanel();
	});

	attachClickHandler("btn-save", function() {
		saveCode();
	});

	attachClickHandler("btn-delete", function(event) {
		var commandKey = getCommandKey();

		if (event[commandKey]) {
			tabs[TAB_HTML].editor.setValue('');
			tabs[TAB_CSS].editor.setValue('');
			tabs[TAB_JS].editor.setValue('');

			buildResult();
		} else if (tabs.selected !== null && tabs.selected.editor) {
			tabs.selected.editor.setValue("");
		}
	});

	attachClickHandler("btn-fullscreen", function() {
		if (document.fullscreen) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
	});

	/*
	 * Generic handler to return focus back to current editor
	 */
	var buttons = document.querySelectorAll(".btn");

	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", function() {
			if (tabs.selected != null && tabs.selected.editor) {
				tabs.selected.editor.focus();
			}
		});
	}

	attachClickHandler("btn-close-options", function() {
		closePanel();
	});
}

function showPanel() {
	var panel = document.getElementById("panel");
	if (panel !== null) {
		if (tabs.selected !== null && tabs.selected.editor) {
			tabs.selected.editor.renderer.$cursorLayer.element.style.display = "none";
		}

		panel.style.display = "block";
	}
}

function closePanel() {
	var panel = document.getElementById("panel");
	if (panel !== null) {
		if (tabs.selected !== null && tabs.selected.editor) {
			tabs.selected.editor.renderer.$cursorLayer.element.style.display = "block";
			tabs.selected.editor.focus();
		}

		panel.style.display = "none";
	}
}

function selectTab(tab) {
	if (tab != tabs.selected) {
		if (tabs.selected !== null) {
			tabs.selected.classList.remove('selected');
			tabs.selected.box.style.display = 'none'
		}

		if (tab !== null) {
			tab.classList.add('selected');
			tab.box.style.display = 'block';

			playCss.selectedTabId = tab.id;
			playCss.save();
		}

		tabs.previous = tabs.selected;
		tabs.selected = tab;
	}

	if (tab !== null) {
		/*
		 * Trigger custom select event
		 */
		if (typeof Event == 'function') {
			var event = new Event('selected');
		} else {
			var event = document.createEvent('Event');
			event.initEvent('selected', true, true);
		}

		tab.dispatchEvent(event);
	}
}

/**
 * Return an instance of ACE editor
 * @param id HTML element's id that holds the editor
 * @param mode (either html, css or javascript)
 */
function buildEditor(id, mode) {
	var editor = ace.edit(id);

	editor.session.setMode('ace/mode/' + mode);
	editor.renderer.setScrollMargin(10);
	editor.setOptions({
		scrollPastEnd: 1, // full over scroll
		cursorStyle: 'slim',
		enableBasicAutocompletion: true,
		enableSnippets: true,
		printMarginColumn: 80,
		showPrintMargin: true,
		enableEmmet: false,
		theme: 'ace/theme/chrome',
		fixedWidthGutter: '52px',
		fontFamily: 'Inconsolata',
	});

	editor.$blockScrolling = Infinity;

	editor.session.on('changeAnnotation', function() {
		var annotations = editor.session.getAnnotations() || [];
		var len = annotations.length;
		var i = len;

		while (i--) {
			if(/can sometimes make elements larger than you expect/.test(annotations[i].text)) {
				annotations.splice(i, 1);
			} else if(/doctype first\. Expected/.test(annotations[i].text)) {
				annotations.splice(i, 1);
			}
		}

		if (len > annotations.length) {
			editor.session.setAnnotations(annotations);
		}
	});

	return editor;
}

function saveCode(argument) {
	playCss.code.html = tabs[TAB_HTML].editor.getValue();
	playCss.code.css = tabs[TAB_CSS].editor.getValue();
	playCss.code.js = tabs[TAB_JS].editor.getValue();

	playCss.save();
}

function buildCssSources() {
	var sources = [];

	for (var i = 0; i < playCss.frameworks.css.length; i++) {
		var source = playCss.frameworks.css[i];

		if (source.active) {
			tag = "<link rel='stylesheet' href='%s'>".replace("%s", source.url);
			sources.push(tag);
		}
	}

	return sources.join("\n");
}

function buildJsSources() {
	var sources = [];

	for (var i = 0; i < playCss.frameworks.js.length; i++) {
		var source = playCss.frameworks.js[i];

		if (source.active) {
			tag = "<script src='%s'></script>".replace("%s", source.url);
			sources.push(tag);
		}
	}

	return sources.join("\n");
}

/**
 * Builds result from html, css and js code
 */
function buildResult() {
	var template =
		"<!DOCTYPE html>\n" +
		"<html>\n" +
		"<head>\n" +
		"<link rel='stylesheet' href='css/default.css'>" +
		"{{ cssSources }}" +
		"{{ css }}\n" +
		"</head>\n" +
		"<body>\n" +
		"{{ html }}\n" +
		"<script src='js/default.js'></script>" +
		"{{ jsSources }}" +
		"<script>\n" +
		"{{ js }}\n" +
		"</script>\n" +
		"</body>\n" +
		"</html>";

	var htmlCode = tabs[TAB_HTML].editor.getValue();
	var cssCode = tabs[TAB_CSS].editor.getValue();
	var jsCode = tabs[TAB_JS].editor.getValue();

	var cssSources = buildCssSources();
	var jsSources = buildJsSources();

	var code = template
		.replace('{{ cssSources }}', cssSources)
		.replace('{{ jsSources }}', jsSources)
		.replace('{{ css }}', '<style>' + cssCode + '</style')
		.replace('{{ html }}', htmlCode)
		.replace('{{ js }}', jsCode);

	/*
	 * We replace the whole iframe instead of just write the new content into
	 * the previous one. This way no new entry is added to the browser's
	 * history.
	 */
	var output = document.getElementById('box-output');
	var frame = document.createElement('iframe');

	frame.setAttribute('src', '');
	output.replaceChild(frame, output.children[0]);

	doc = frame.contentWindow.document;

	doc.open();
	doc.write(code);
	doc.close();

	doc.onclick = window.onclick;
	doc.onkeydown = window.onkeydown;
	doc.onkeyup = window.onkeyup;
}