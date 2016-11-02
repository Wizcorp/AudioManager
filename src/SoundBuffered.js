var inherits = require('util').inherits;
var ISound   = require('./ISound.js');

// setValueAtTime, exponentialRampToValueAtTime and linearRampToValueAtTime thrown an exception if
// provided value is less than or equal to 0.
// we use MIN_VALUE instead of 0 when calling these functions
// see:
// http://webaudio.github.io/web-audio-api/#widl-AudioParam-exponentialRampToValueAtTime-void-float-value-double-endTime
// http://stackoverflow.com/questions/29819382/how-does-the-audioparam-exponentialramptovalueattime-work
var MIN_VALUE = 0.000001;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio wrapper using AudioBufferSourceNode
 * @author  Cedric Stoquer
 * 
 */
function SoundBuffered() {
	ISound.call(this);

	this.buffer          = null;
	this.source          = null;
	this.sourceConnector = null;
	this.gain            = null;
	this.panNode         = null;
	this.rawAudioData    = null;

	this._playPitch      = 0.0;  // pitch for each independent play
	this._fadeTimeout    = null;
	this._onStopCallback = null;
	this._audioNodeReady = false;

	this._loopStart      = 0;
	this._loopEnd        = 0;

	this.init();
}
inherits(SoundBuffered, ISound);
module.exports = SoundBuffered;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._createAudioNodes = function () {
	if (this._audioNodeReady) return;
	if (!this.audioContext) return;

	// create webAudio nodes
	// source -> gain -> pan -> destination

	var audioContext = this.audioContext;
	var gainNode     = audioContext.createGain();
	var panNode;

	if (audioContext.createStereoPanner) {
		panNode = audioContext.createStereoPanner();
	} else {
		// fallback to 3D PannerNode
		panNode = audioContext.createPanner();
	}

	gainNode.connect(panNode);
	panNode.connect(audioContext.destination);

	gainNode.gain.value  = 0;
	this.sourceConnector = gainNode;
	this.gain            = gainNode.gain;
	this.panNode         = panNode;

	this._audioNodeReady = true;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._destroyAudioNodes = function () {
	if (!this._audioNodeReady) return;

	var audioContext = this.audioContext;
	var panNode      = this.panNode;
	var gainNode     = this.sourceConnector;

	gainNode.disconnect(panNode);
	panNode.disconnect(audioContext.destination);

	if (this.source) {
		this.source.disconnect(gainNode);
		this.source.onended = null;
		this.source = null;
	}

	this.sourceConnector = null;
	this.gain            = null;
	this.panNode         = null;
	this.rawAudioData    = null;
	this._audioNodeReady = false;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.init = function () {
	this._createAudioNodes();

	if (!this.rawAudioData) return;

	var self           = this;
	var maxPlayLatency = this.audioManager.settings.maxPlayLatency;
	var audioContext   = this.audioContext;


	function onAudioDecodeSuccess(buffer) {
		self.buffer = buffer;
		self.usedMemory = buffer.duration;
		self.audioManager.usedMemory += buffer.duration;
		self.rawAudioData = null;
		if (self._loaded && self._playTriggered) {
			if (self.loop || Date.now() - self._playTriggered < maxPlayLatency) { self._play(); }
			self._playTriggered = 0;
		}
	}

	function onAudioDecodeFail() {
		console.error('decode audio failed for sound ', self.id);
	}

	audioContext.decodeAudioData(this.rawAudioData, onAudioDecodeSuccess, onAudioDecodeFail);
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.setVolume = function (value) {
	this.volume = value;
	if (!this.playing) return;
	if (!this.fade) {
		this.gain.value = value;
		return;
	}
	if (value <= 0) value = MIN_VALUE;
	var currentTime = this.audioContext.currentTime;
	this.gain.cancelScheduledValues(currentTime);
	this.gain.setValueAtTime(this.gain.value || MIN_VALUE, currentTime);
	this.gain.linearRampToValueAtTime(value, currentTime + this.fade);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.setPan = function (value) {
	this.pan = value;
	if (!this.panNode) return;
	if (this.panNode.pan) {
		// stereo panning
		this.panNode.pan.value = value;
	} else {
		// 3D panning
		this.panNode.setPosition(value, 0, 0.2);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.setLoop = function (value, loopStart, loopEnd) {
	this.loop       = !!value;
	this._loopStart = loopStart || 0;
	this._loopEnd   = loopEnd   || 0;
	if (!this.source || !this.buffer) return;

	this.source.loop = value;
	this._setLoopPoints();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._setLoopPoints = function () {
	this.source.loopStart = this._loopStart || 0;

	var loopEnd = this._loopEnd;

	// When loop end point is negative, we set endPoint from the end of the buffer
	if (loopEnd < 0) loopEnd = this.buffer.duration + loopEnd;
	if (loopEnd < 0) loopEnd = 0;
	this.source.loopEnd = loopEnd || this.buffer.duration;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set sound pitch
 *
 * @param {number} pitch        - pitch in semi-tone
 * @param {number} [portamento] - duration to slide from previous to new pitch.
 */
SoundBuffered.prototype.setPitch = function (pitch, portamento) {
	this.pitch = pitch;
	this._setPlaybackRate(portamento);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._updatePlayPitch = function (pitch) {
	if ((pitch || pitch === 0) && pitch !== this._playPitch) {
		this._playPitch = pitch;
		this._setPlaybackRate(0);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._setPlaybackRate = function (portamento) {
	if (!this.source) return;
	var rate = Math.pow(2, (this._playPitch + this.pitch) / 12);
	if (!portamento) {
		this.source.playbackRate.value = rate;
		return;
	}
	var currentTime = this.audioContext.currentTime;
	this.source.playbackRate.cancelScheduledValues(currentTime);
	this.source.playbackRate.setValueAtTime(this.source.playbackRate.value || MIN_VALUE, currentTime);
	this.source.playbackRate.linearRampToValueAtTime(rate, currentTime + portamento);
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 * @private
 */
SoundBuffered.prototype._load = function () {
	var self = this;

	this._createAudioNodes();

	function loadFail(error) {
		// TODO: keep track that loading has failed so we don't retry to load it ?
		self._finalizeLoad(error);
	}

	function onAudioLoaded(buffer) {
		self.buffer = buffer;
		self.usedMemory = buffer.duration;
		self.audioManager.usedMemory += buffer.duration;
		self._finalizeLoad(null);
	}

	function loadAudio(uri) {
		var xobj = new XMLHttpRequest();
		xobj.responseType = 'arraybuffer';

		xobj.onreadystatechange = function onXhrStateChange() {
			if (~~xobj.readyState !== 4) return;
			if (~~xobj.status !== 200 && ~~xobj.status !== 0) {
				return loadFail('xhrError:' + xobj.status);
			}
			if (self.audioContext) {
				self.audioContext.decodeAudioData(xobj.response, onAudioLoaded, loadFail);
			} else {
				self.rawAudioData = xobj.response;
				self._finalizeLoad(null);
			}
		};

		xobj.open('GET', uri, true);
		xobj.send();
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
SoundBuffered.prototype.unload = function () {
	if (ISound.prototype.unload.call(this)) {
		if (this._fadeTimeout) {
			this._onStopCallback = null;
			this._stopAndClear();
		}
		this.buffer = null;
		if (this.source) {
			this.source.onended = null;
			this.source.stop(0);
			this.source = null;
		}
		this._destroyAudioNodes();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. If sound is not yet loaded, it is loaded in memory and flagged to be played
 *  once loading has finished. If loading take too much time, playback may be cancelled.
 */
SoundBuffered.prototype._play = function (pitch) {
	if (!this.buffer) {
		this._playTriggered = Date.now();
		return;
	}

	this.playing = true;

	var currentTime = this.audioContext.currentTime;
	this.gain.cancelScheduledValues(currentTime);
	if (this.fade) {
		this.gain.setValueAtTime(this.gain.value || MIN_VALUE, currentTime);
		this.gain.linearRampToValueAtTime(this.volume || MIN_VALUE, currentTime + this.fade);
	} else {
		this.gain.value = this.volume;
	}

	// if sound is still fading out, clear all onStop callback
	if (this._fadeTimeout) {
		this._onStopCallback = null;
		this.source.onended = null;
		this.stopping = false;
		window.clearTimeout(this._fadeTimeout);
		this._fadeTimeout = null;
		return;
	}

	if (this.source) {
		this.source.disconnect(this.sourceConnector);
		this.source.onended = null;
	}

	var sourceNode = this.source = this.audioContext.createBufferSource();
	sourceNode.connect(this.sourceConnector);

	var self = this;
	sourceNode.onended = function onPlaybackEnd() {
		self.playing       = false;
		sourceNode.onended = null;
		self.source        = null;
	};

	this._playPitch = pitch || 0;
	if (pitch || this.pitch) {
		this._setPlaybackRate(0);
	}

	sourceNode.loop   = this.loop;
	sourceNode.buffer = this.buffer;
	this._setLoopPoints();
	sourceNode.start(0);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._stopAndClear = function () {
	this.stopping = false;
	this.source.onended = null;
	this.source.stop(0);
	this.source = null;
	if (this._fadeTimeout) {
		window.clearTimeout(this._fadeTimeout);
		this._fadeTimeout = null;
	}
	if (this._onStopCallback) {
		this._onStopCallback();
		this._onStopCallback = null;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop sound
 *
 * @param {Function} [cb] - optional callback function
 */
SoundBuffered.prototype.stop = function (cb) {
	if (!this.playing && !this.stopping) return cb && cb();
	this._playTriggered = 0;
	this.stopping = true;
	this.playing  = false;
	if (!this.source) return cb && cb();

	this._onStopCallback = cb; // TODO: do we allow multiple stop cb ?

	if (this._fadeTimeout) return;

	if (this.fade) {
		var self = this;
		var currentTime = this.audioContext.currentTime;
		this.gain.cancelScheduledValues(currentTime);
		this.gain.setValueAtTime(this.gain.value || MIN_VALUE, currentTime);
		this.gain.linearRampToValueAtTime(MIN_VALUE, currentTime + this.fade);
		this._fadeTimeout = window.setTimeout(function onFadeEnd() {
			self._fadeTimeout = null;
			self._stopAndClear();
		}, this.fade * 1000);
		return;
	}

	this._stopAndClear();
};

