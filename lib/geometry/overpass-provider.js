var request = require('request'),
	GeometryProvider = require('./geometry-provider'),
	GeoBoundingBox2D = require('./primitives').GeoBoundingBox2D,
	LatLng3D = require('./primitives').LatLng3D,
	distance_regex = /((?:\+|\-)?[\d\.]+)\s*(\w*)/,
	CONVERSION_FACTORS = {
		'm': 1,
		'km': 1000,
		'ft': 0.3048
	};

function OverpassProvider(bbox) {
	GeometryProvider.call(this, bbox);

	this.query = '[out:json][timeout:25];(' + 
		'node["ele"]' + this.bbox.to_overpass() + ';' +
		/*'way["ele"]' + this.bbox.to_overpass() + ';' +
		'relation["ele"]' + this.bbox.to_overpass() + ';' +*/ 
	 '); out body; >; out skel qt;';

	console.log(this.query);

}

OverpassProvider.prototype = Object.create(GeometryProvider.prototype);

OverpassProvider.prototype.build_result = function (json) {
	var current = null,
		coord = null,
		nodes = new Map(),
		result = [],
		parsed_ele,
		elevation,
		units,
		node;

	for (node in json.elements) {

		if (json.elements.hasOwnProperty(node)) {
			current = json.elements[node];

			if (current.type === 'node' &&  current.tags && current.tags.ele) {
				// Parse the elevation
				parsed_ele = distance_regex.exec(current.tags.ele);
				units = parsed_ele[2];

				if (!units || units in CONVERSION_FACTORS) {
					elevation = parseFloat(parsed_ele[1]);

					// if its not an empty string or undefined then we probably
					// have units.
					if (units) {
						elevation *= CONVERSION_FACTORS[units];
					}

					coord = new LatLng3D();
					coord.lat = current.lat;
					coord.lng = current.lon;
					coord.ele = elevation;

					result.push(coord);
				} else {
					console.warn('Units not understood, skipping');
				}
			}
		}
	}

	return result;
};

OverpassProvider.prototype.get_coords = function () {
	var provider = this,
		PARAMS = '?data=';

	return new Promise(function (resolve, reject) {
		var result = '',
			req;

		req = request.post('http://overpass-api.de/api/interpreter', {
			'gzip': true,
			'form': {
				'data': provider.query
			}
		});

		req.on('response', function (res) {
			if (res.statusCode >= 400) {
				console.log(res.statusCode + ' Error retrieveing data');
				reject();
			}
		});

		req.on('data', function (data) {
			result += data;
		});

		req.on('end', function () {
			var json;

			//console.log(result);

			try {
				json = JSON.parse(result);
			} catch (e) {
				reject(e);
				return;
			}

			resolve(provider.build_result(json));
		});

		req.on('error', function (err) {
			reject(err);
		});
	});
};

module.exports = OverpassProvider;
