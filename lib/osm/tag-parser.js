function Tag(value) {
	this.value = value;
}

function NamespacedTag(tag) {
	var value = tag;

	// if an instance of Tag is passed in we are upgrading it to a Namespaced tag.
	if (tag instanceof Tag) {
		value = tag.value;
	}

	Tag.call(this, value);

	this.subtags = {};
}

NamespacedTag.prototype = Object.create(Tag.prototype);


// TagParser
// =========

function TagParser() {
	
}

TagParser.add_package = function (funk) {
	if (typeof funk === 'string') {
		funk = require(funk);
	}

	funk.call(TagParser);
};

TagParser.add_mapper = function (key, funk) {
	TagParser.mappers[key] = funk;
};

TagParser.add_reducer = function (key, funk) {
	TagParser.builders[key] = funk;
};

TagParser.add_finalizer = function (key, funk) {
	TagParser.finalizers[key] = funk;
};


// First pass of the parser that will look at individual tags and parse them.
TagParser.prototype.map = function (key, value) {
	var mapper = TagParser.mappers[key];

	if (!mapper) {
		mapper = TagParser.DEFAULT_MAPPER;
	}

	return new Tag(mapper(key, value));
};

// The second pass of the parser that will create the higher level reprisentations.
TagParser.prototype.reduce = function (key, result, mapped) {
	var builder = TagParser.builders[key];

	if (!builder) {
		builder = TagParser.DEFAULT_REDUCER;
	}

	builder(result, mapped);
};

// The final pass will allow clean up and other finalizing actions.
TagParser.prototype.finalize = function (key, result, mapped) {
	var builder = TagParser.finalizers[key];

	if (!builder) {
		builder = TagParser.DEFAULT_FINALIZER;
	}

	builder(result, mapped);
};

TagParser.prototype.parse = function (node) {
	var mapped = {},
		result = {}, 
		key;

	for (key in node) {
		if (node.hasOwnProperty(key)) {
			mapped[key] = this.map_tag(key, node[key]);
		}
	}

	for (key in mapped) {
		if (mapped.hasOwnProperty(key)) {
			this.structure(key, result, mapped);
		}
	}

	for (key in result) {
		if (result.hasOwnProperty(key)) {
			this.finalize(key, result);
		}
	}

	return result;
};

// Mappers

function text(key, value) {
	return value;
}

function distance(key, value) {

}

function mass(key, value) {

}

function time(key, value) {

}

function speed(key, value) {

}

// Reducers

function colon_combiner(key, result, mapped) {
	var key_parts = key.split(':'),
		current = result,
		part;

	while (key_parts.length) {
		part = key_parts.shift();

		if (!(part in current.subtags)) {
			current.subtags[part] = new NamespacedTag();
		}
	}

	current.subtags[part] = mapped[key];
}

TagParser.add_package(function () {
	this.DEFAULT_MAPPER = text;

	this.add_mapper('height', distance);
	this.add_mapper('maxspeed', speed);

	this.DEFAULT_REDUCER = colon_combiner;

	this.DEFAULT_FINALIZER = function () {};

	this.add_finalizer('addr', function (key, result) {

	});
});
