//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Sound Abstract class.
 * Implement dynamic loading / unloading mechanism.
 *
 * @author  Cedric Stoquer
 * 
 */
function ISound() {
	// public properties
	this.playing         = false;
	this.fade            = 0;
	this.usedMemory      = 0;
	this.poolRef         = null;

	// the following properties are public but should NOT be assigned directly.
	// instead, use the setter functions: setId, setVolume, setPan, setLoop, setPitch.
	this.id              = 0;
	this.volume          = 1.0;
	this.pan             = 0.0;
	this.loop            = false;
	this.pitch           = 0.0;

	// private properties
	this._src            = '';
	this._loaded         = false;
	this._loading        = false;
	this._unloading      = false;
	this._playTriggered  = 0;
	this._queuedCallback = [];
}

module.exports = ISound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setId = function (value) {
	var audioPath = this.audioManager.settings.audioPath;
	this.id      = value;
	this._src    = audioPath + value + '.mp3';
	this._loaded = false;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setVolume = function (value) {
	this.volume = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setPan = function (value) {
	this.pan = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setLoop = function (value) {
	this.loop = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setPitch = function (pitch) {
	this.pitch = pitch;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound. Abstract method to be overwritten
 * @private
 *
 * @param {String} filePath - audio file to be loaded
 */
ISound.prototype._load = function (filePath) {
	console.log('ISound load call: ' + filePath);
	return this._finalizeLoad(null);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 *
 * @param {Function} [cd] - optional callback function
 */
ISound.prototype.load = function (cb) {
	if (!this.id) return cb && cb('noId');
	if (this._loaded) return cb && cb(null, this);

	if (cb) { this._queuedCallback.push(cb); }
	if (this._loading) return;
	this._loading = true;

	return this._load(this._src, this);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Finalize sound loading
 *
 * @param {String} error - set when loading has failed
 */
ISound.prototype._finalizeLoad = function (error) {
	var maxPlayLatency = this.audioManager.settings.maxPlayLatency;

	this._loaded  = !error;
	this._loading = false;

	for (var i = 0; i < this._queuedCallback.length; i++) {
		this._queuedCallback[i](error, this);
	}
	this._queuedCallback = [];

	if (this._unloading) {
		this._unloading = false;
		this.unload();
		return;
	}

	if (this._loaded && this._playTriggered) {
		if (this.loop || Date.now() - this._playTriggered < maxPlayLatency) { this._play(); }
		this._playTriggered = 0;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload sound from memory */
ISound.prototype.unload = function () {
	this._playTriggered = 0;
	this.setLoop(false);
	this.fade  = 0;
	this.pitch = 0;
	this.stop();

	if (this._loading) {
		this._unloading = true;
		return false;
	}

	this.audioManager.usedMemory -= this.usedMemory;
	this.setVolume(1.0);
	this.setPan(0.0);
	this.id         = 0;
	this._src       = '';
	this._loaded    = false;
	this.usedMemory = 0;

	return true;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. If sound is not yet loaded, it is loaded in memory and flagged to be played
 *  once loading has finished. If loading take too much time, playback may be cancelled.
 *
 * @param {number} [vol]   - optional volume
 * @param {number} [pan]   - optional panoramic
 * @param {number} [pitch] - optional pitch value in semi-tone (available only if using webAudio)
 */
ISound.prototype.play = function (vol, pan, pitch) {
	if (vol !== undefined && vol !== null) { this.setVolume(vol); }
	if (pan !== undefined && pan !== null) { this.setPan(pan); }

	if (!this._loaded) {
		this._playTriggered = Date.now();
		this.load();
		return;
	}

	this._play(pitch);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. Abstract method to be overwritten */
ISound.prototype._play = function () {
	this.playing = true;
	console.log('ISound play call: "' + this._src + '"');
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop sound
 *
 * @param {Function} [cb] - optional callback function (use it when sound has a fade out)
 */
ISound.prototype.stop = function (cb) {
	this.playing = false;
	return cb && cb();
};
