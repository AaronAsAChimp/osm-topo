module.exports = function (wherror) {

	return function (err) {
		console.log('Error: ' + wherror);

		if (err.stack) {
			console.log(err.stack);
		} else {
			console.log(err);
		}
	};
};
