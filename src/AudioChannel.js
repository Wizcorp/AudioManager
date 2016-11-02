//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio Channel class.
 *
 * @author  Cedric Stoquer
 *
 *
 * @param {string} id - channel name id
 */
function AudioChannel(id) {
	this.id        = id;
	this.volume    = 1.0;
	this.muted     = true;
	this.loopSound = null;
	this.loopId    = null;
	this.loopVol   = 0.0;
	this.nextLoop  = null;
}
module.exports = AudioChannel;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AudioChannel.prototype.setVolume = function (volume, muted) {
	var wasChannelMuted = this.muted;
	this.muted = volume === 0 || muted || false;
	if (volume !== undefined && volume !== null) {
		this.volume = volume;
	} else {
		volume = this.volume;
	}

	if (!this.loopId) return;

	// this channel have a looped sound (music, ambient sfx)
	// we have to take care of this looped sound playback if channel state changed
	if (this.loopSound && this.muted) {
		// a sound was playing, channel becomes muted
		this.loopSound.stop();
		// TODO: unload sound ?
	} else if (this.loopSound && this.loopSound.id === this.loopId) {
		// correct sound is loaded in channel, updating volume & playback
		this.loopSound.setVolume(Math.max(0, Math.min(1, volume * this.loopVol)));
		if (wasChannelMuted) { this.loopSound.play(); }
	} else if (!this.muted) {
		// sound is not loaded in channel, channel has been unmutted
		this.audioManager.playLoopSound(this.id, this.loopId, this.loopVol);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AudioChannel.prototype.setMute = function (mute) {
	this.setVolume(null, mute);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a long looped sound (e.g. background music).
 *  Only one looped sound can play per channel.
 *
 * @param {string} soundId   - sound id
 * @param {number} [volume]  - optional volume, a integer in range ]0..1]
 * @param {number} [pan]     - optional panoramic, a integer in rage [-1..1]
 * @param {number} [pitch]   - optional pitch, in semi-tone
 */
AudioChannel.prototype.playLoopSound = function (soundId, volume, pan, pitch, loopStart, loopEnd) {
	var audioManager   = this.audioManager;
	var defaultFade    = audioManager.settings.defaultFade;
	var crossFading    = audioManager.settings.crossFading;
	var currentSound   = this.loopSound;
	var currentSoundId = currentSound && currentSound.id;

	volume = Math.max(0, Math.min(1, volume || 1));

	this.loopId  = soundId;
	this.loopVol = volume;

	// don't load or play sound if audio or channel is mutted
	if (audioManager.muted || this.muted) return;

	// if requested sound is already playing, update volume, pan and pitch
	if (soundId === currentSoundId && currentSound) {
		currentSound.play(volume * this.volume, pan, pitch);
		if (this.nextLoop) {
			this.nextLoop.cancelOnLoadCallbacks();
			this.nextLoop = null;
		}
		return;
	}

	currentSound = null;

	// check if requested sound is already scheduled to play next
	if (this.nextLoop && this.nextLoop.id === soundId) return;

	var self = this;

	function stopCurrentLoop(sound, cb) {
		if (!sound) return cb && cb();
		if (sound.stopping) return; // callback is already scheduled
		sound.stop(function () {
			audioManager.freeSound(sound); // TODO: add an option to keep file in memory
			sound = null;
			return cb && cb();
		});
	}

	function _playNextSound() {
		var sound = self.loopSound = self.nextLoop;
		self.nextLoop = null;
		if (!sound) return;
		sound.setLoop(true, loopStart, loopEnd);
		sound.fade = defaultFade;
		sound.load(function onSoundLoad(error) {
			if (error) {
				sound.unload();
				self.loopSound = null;
				return;
			}
			sound.play(volume * self.volume, pan, pitch);
		});
	}

	function playNextSound() {
		// remove reference to current loop sound to ease optimistic garbabe collection
		self.loopSound = null;
		// force loading to happen at next tick in order to let garbage collector to release previous audio.
		window.setTimeout(_playNextSound, 0);
	}

	if (crossFading) {
		if (this.nextLoop) {
			// if another nextSound already loading, cancel previous callback
			this.nextLoop.cancelOnLoadCallbacks();
		}
		this.nextLoop = audioManager.createSound(soundId, this.id);
		this.nextLoop.load(function onSoundLoad(error) {
			if (error) {
				self.nextLoop.unload();
				self.nextLoop = null;
				return;
			}
			stopCurrentLoop(self.loopSound);
			playNextSound();
		});

	} else {
		this.nextLoop = audioManager.createSound(soundId, this.id);
		stopCurrentLoop(this.loopSound, playNextSound);
	}
};
