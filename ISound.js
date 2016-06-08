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
	this.stopping        = false;
	this.fade            = 0;
	this.usedMemory      = 0;
	this.poolRef         = null;

	// the following properties are public but should NOT be assigned directly.
	// instead, use the setter functions: setId, setVolume, setPan, setLoop, setPitch.
	this.id              = null;
	this.volume          = 1.0;
	this.pan             = 0.0;
	this.loop            = false;
	this.pitch           = 0.0;

	// private properties
	this._loaded         = false;
	this._loading        = false;
	this._unloading      = false;
	this._playTriggered  = 0;

	this._onLoadQueuedCallback = [];
}

module.exports = ISound;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setId = function (value) {
	this.id      = value;
	this._loaded = false;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 *
 * @param {Function} [cd] - optional callback function
 */
ISound.prototype.load = function (cb) {
	if (!this.id) return cb && cb('noId');
	if (this._loaded) return cb && cb(null, this);

	if (cb) { this._onLoadQueuedCallback.push(cb); }
	if (this._loading) return;
	this._loading = true;

	return this._load();
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

	for (var i = 0; i < this._onLoadQueuedCallback.length; i++) {
		this._onLoadQueuedCallback[i](error, this);
	}
	this._onLoadQueuedCallback = [];

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
/** Remove callback set on load */
ISound.prototype.cancelOnLoadCallbacks = function () {
	this._onLoadQueuedCallback = [];
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

	// prevent a looped sound to play twice
	// TODO: add a flag to allow force restart
	if (this.loop && this.playing) {
		// update pitch if needed
		this._updatePlayPitch(pitch);
		return;
	}

	this._play(pitch);
};

//█████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████▄███████▄░██████████▄░███████▄░██████████
//█▀▄▄▄▄▀█▄░▄██▄░▄█▀▄▄▄▄▀█▄░▀▄▄▄█▄░▀▄▄▄█▄▄░███▀▄▄▄▀░██▀▄▄▄▄▀███░▀▄▄▄▀███░███▀▄▄▄▄▀█
//█░████░███░██░███░▄▄▄▄▄██░██████░███████░███░████░██▀▄▄▄▄░███░████░███░███░▄▄▄▄▄█
//█▄▀▀▀▀▄████░░████▄▀▀▀▀▀█▀░▀▀▀██▀░▀▀▀██▀▀░▀▀█▄▀▀▀▄░▀█▄▀▀▀▄░▀█▀░▄▀▀▀▄█▀▀░▀▀█▄▀▀▀▀▀█
//█████████████████████████████████████████████████████████████████████████████████

ISound.prototype.init      = function () { /* virtual function */ };
ISound.prototype.setVolume = function (value) { this.volume = value; };
ISound.prototype.setPan    = function (value) { this.pan    = value; };
ISound.prototype.setLoop   = function (value) { this.loop   = value; };
ISound.prototype.setPitch  = function (pitch) { this.pitch  = pitch; };
ISound.prototype._updatePlayPitch = function (pitch) { /* virtual */ };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. Abstract method to be overwritten */
ISound.prototype._play = function (pitch) {
	this.playing = true;
	console.log('ISound play call: "' + this.id + '"');
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

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound. Abstract method to be overwritten
 * @private
 */
ISound.prototype._load = function () {
	console.log('ISound load call: ' + this.id);
	return this._finalizeLoad(null);
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
	this.id         = null;
	this._loaded    = false;
	this.usedMemory = 0;

	return true;
};
