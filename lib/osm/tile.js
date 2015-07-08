var BoundingBox2D = require('../geometry/primitives').BoundingBox2D,
	Matrix3D = require('../geometry/primitives').Matrix3D;

function Tile(zoom, x, y) {
	this.zoom = 1 << zoom;

	this.tile_bounds = new BoundingBox2D();
	this.tile_bounds.minimum.x = x;
	this.tile_bounds.minimum.y = y;
	this.tile_bounds.minimum.z = 0;
	this.tile_bounds.maximum.x = x + 1;
	this.tile_bounds.maximum.y = y + 1;
	this.tile_bounds.maximum.z = 0;

	this.geo_bounds = this.tile_bounds.geo(this.zoom);
}

module.exports = Tile;

Tile.prototype.matrix = function () {
	return Matrix3D.translate(Math.floor(-this.tile_bounds.minimum.x), Math.floor(-this.tile_bounds.minimum.y), 0);
};
