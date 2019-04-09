function log(s) {
	console.log(s);
}

window.onerror = function(msg, url, line, col, error) {
	log(
		"ERROR: " + error
	);
	return true;
}