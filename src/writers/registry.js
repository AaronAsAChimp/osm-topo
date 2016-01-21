
export default
class Registry extends Map {

	static
	instance () {
		return this._instance;
	}

	static
	register (name, writer) {
		this.instance().set(name, writer);
	}
}

Registry._instance = new Registry();


import ColladaWriter from './collada-writer';
import StlWriter from './stl-writer';

Registry.register('collada', ColladaWriter);
Registry.register('stl', StlWriter);


