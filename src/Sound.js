var inherits     = require('util').inherits;
var ISound       = require('./ISound.js');
var PLAY_OPTIONS = { playAudioWhenScreenIsLocked: false };


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio wrapper using HTML5 <Audio>
 * @author  Cedric Stoquer
 * 
 */
function Sound() {
	ISound.call(this);

	var audio   = new Audio();
	audio.loop  = false;
	audio.type  = 'audio/mpeg';
	this._audio = audio;

	// if available, use webAudio for better performances
	if (this.audioContext) {
		this.source = this.audioContext.createMediaElementSource(audio);
		this.source.connect(this.audioContext.destination);
	}
}
inherits(Sound, ISound);
module.exports = Sound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Sound.prototype.setVolume = function (value) {
	this.volume = this._audio.volume = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Sound.prototype.setLoop = function (value) {
	this.loop = this._audio.loop = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 * @private
 */
Sound.prototype._load = function () {
	var self = this;

	function loadFail(error) {
		// TODO: keep track that loading has failed to not retry to loading it
		self._finalizeLoad(error);
	}

	function onAudioLoaded() {
		this.removeEventListener('canplaythrough', onAudioLoaded);
		this.removeEventListener('error', onAudioError);
		self.usedMemory = this.duration;
		self.audioManager.usedMemory += this.duration;
		self._finalizeLoad(null);
	}

	function onAudioError(error) {
		this.removeEventListener('canplaythrough', onAudioLoaded);
		this.removeEventListener('error', onAudioError);
		loadFail(error);
	}

	function loadAudio(uri) {
		self._loading = true;
		self._audio.addEventListener('canplaythrough', onAudioLoaded);
		self._audio.addEventListener('error', onAudioError);
		self._audio.src = uri;
		self._audio.load();
	}

	var getFileUri = this.audioManager.settings.getFileUri;
	var audioPath  = this.audioManager.settings.audioPath;

	if (getFileUri.length > 2) {
		// asynchronous
		getFileUri(audioPath, this.id, function onUri(error, uri) {
			if (error) return loadFail(error);
			loadAudio(uri);
		});
	} else {
		// synchronous
		try {
			var uri = getFileUri(audioPath, this.id);
			if (!uri) return loadFail('emptyUri');
			loadAudio(uri);
		} catch (error) {
			loadFail(error);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload sound from memory */
Sound.prototype.unload = function () {
	if (ISound.prototype.unload.call(this)) {
		this._audio.volume = 1.0;
		this._audio.src = '';
		this._audio.load();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. If sound is not yet loaded, it is loaded in memory and flagged to be played
 *  once loading has finished. If loading take too much time, playback may be cancelled.
 */
Sound.prototype._play = function (pitch) {
	// TODO: sound pan
	// TODO: fade-in
	this._audio.volume = this.volume;
	this._audio.pause();
	this._audio.currentTime = 0;
	this._audio.play(PLAY_OPTIONS);
	this.playing = true;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop sound
 *
 * @param {Function} [cb] - optional callback function (use it when sound has a fade out)
 */
Sound.prototype.stop = function (cb) {
	this._audio.pause();
	this._audio.currentTime = 0;
	this._playTriggered = 0;
	this.playing = false;
	return cb && cb(); // TODO: fade-out
};
