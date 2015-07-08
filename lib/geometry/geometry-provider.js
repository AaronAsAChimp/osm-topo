var LatLng2D = require('./primitives').LatLng2D;

function GeometryProvider(bbox) {
	this.bbox = bbox;
}

// A generator for the coordinates provided by this object.
// yields primitives.LatLng2D
GeometryProvider.prototype.get_coords = function () {
	throw 'Not Implemented';
};

module.exports = GeometryProvider;
