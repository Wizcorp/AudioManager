var AudioContext = window.AudioContext || window.webkitAudioContext;
var OrderedList  = require('./OrderedList');
var SoundObject  = require('./SoundBuffered.js');
var SoundGroup   = require('./SoundGroup.js');
var AudioChannel = require('./AudioChannel.js');
var ISound       = require('./ISound.js');

if (!AudioContext) {
	console.warn('Web Audio API is not supported on this platform. Fallback to regular HTML5 <Audio>');
	SoundObject = require('./Sound.js');
	if (!window.Audio) {
		console.warn('HTML5 <Audio> is not supported on this platform. Sound features are unavailable.');
		SoundObject = ISound;
	}
}


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio manager
 * @author  Cedric Stoquer
 *
 * @param {String[]} channels - list of channel ids to be created
 */
function AudioManager(channels) {
	this.soundsById            = {};
	this.soundGroupsById       = {};
	this.permanentSounds       = {};
	this.freeSoundPool         = [];
	this.soundArchive          = new OrderedList(function () { return 1; });
	this.soundGroupArchive     = new OrderedList(function () { return 1; });
	this.soundArchiveById      = {};
	this.soundGroupArchiveById = {};
	this.usedMemory            = 0;
	this.channels              = {};
	this.audioContext          = null;
	this.muted                 = false;

	// settings
	this.settings = {
		audioPath:      '',   // path to audio assets folder
		maxSoundGroup:  500,
		maxUsedMemory:  300,  // seconds
		defaultFade:    2,    // seconds
		maxPlayLatency: 1000, // milliseconds
		crossFading:    false,
		getFileUri:     function getFileUri(audioPath, id) { return audioPath + id + '.mp3'; },
		getSoundConstructor: function getSoundConstructor(channelId, soundId) { return null; }
	};

	// create channels
	for (var i = 0; i < channels.length; i++) {
		var channelId = channels[i];
		this.channels[channelId] = new AudioChannel(channelId);
	}

	// register self
	ISound.prototype.audioManager       = this;
	SoundGroup.prototype.audioManager   = this;
	AudioChannel.prototype.audioManager = this;
}

module.exports = AudioManager;

// expose ISound for custom sound constructors
module.exports.ISound = ISound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Initialise audio.
 *  On iOS, this function must be called on an user interaction (e.g. tap a button) or sound won't play.
 */
AudioManager.prototype.init = function () {
	if (this.audioContext || !AudioContext) return;
	this.audioContext = new AudioContext();

	// register audioContext on sound Class
	SoundObject.prototype.audioContext = this.audioContext;
	
	// sounds could have been preloaded, initialize them.
	for (var id in this.soundsById) {
		this.soundsById[id].init();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get a unused sound object (or a new one if no more empty sounds are available in pool)
 *
 * @param {string} channelId - channel id where the sound will be used
 * @param {string} soundId   - sound id
 *
 * @return {Object} sound object
 */
AudioManager.prototype.getEmptySound = function (channelId, soundId) {
	var sound;

	// custom sound constructor
	var constructor = this.settings.getSoundConstructor(channelId, soundId);
	if (constructor) {
		sound = new constructor();
		return sound;
	}

	if (this.freeSoundPool.length > 0) {
		sound = this.freeSoundPool.pop();
		sound.init();
	} else {
		sound = new SoundObject();
	}
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Setup channels volume and mute. This function is used when retrieving user preferences.
 *
 * @param {Object}  channels            - object containnig channels setup list. Keys are channel ids
 *        {number}  channels[id].volume - volume of channel id
 *        {boolean} channels[id].muted  - mute setting for channel id
 */
AudioManager.prototype.setup = function (channels) {
	for (var channelId in channels) {
		var params = channels[channelId];
		this.setVolume(channelId, params.volume, params.muted);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AudioManager.prototype.addChannel = function (channelId) {
	if (this.channels[channelId]) return;
	this.channels[channelId] = new AudioChannel(channelId);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set channel's volume
 *
 * @param {String} channelId - channel id
 * @param {number} volume    - channel volume, float in range [0..1]
 */
AudioManager.prototype.setVolume = function (channelId, volume, muted) {
	var channel = this.channels[channelId];
	if (!channel) return;
	channel.setVolume(volume, muted);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Mute / unmute all channels
 *
 * @param {boolean} [muted] - Should all channels be muted. If not specified, function will behave as toggle
 */
AudioManager.prototype.setMute = function (muted) {
	if (muted === undefined) muted = !this.muted;
	this.muted = !!muted;

	// take care of loop sounds in channels
	for (var channelId in this.channels) {
		var channel = this.channels[channelId];
		if (!channel.loopSound) continue;
		if (muted) {
			channel.loopSound.stop();
		} else {
			// FIXME: force channel.muted to change from true to its current value
			var channelMuted = channel.muted;
			channel.muted = true;
			channel.setVolume(null, channelMuted);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create and load sound
 *
 * @param {number}   id   - sound id
 * @param {Function} [cb] - optional callback function called when sound has finished to load
 */
AudioManager.prototype.loadSound = function (id, cb) {
	var sound = this.createSound(id);
	sound.load(cb);
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create sound but don't load it
 *
 * @param {number} id - sound id
 */
AudioManager.prototype.createSound = function (id, channelId) {
	var sound = this.getSound(id);
	if (sound) return sound;
	sound = this.soundsById[id] = this.getEmptySound(channelId, id);
	sound.setId(id);
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a sound that won't be unloaded.
 *
 * @param {number} id - sound id
 */
AudioManager.prototype.createSoundPermanent = function (id, channelId) {
	var sound = this.getSound(id);
	// TODO: Check if sound is permanent and move it to permanents list if it's not the case.
	//       Because permanents sound (UI sounds) are created at app startup, this should not happend.
	if (sound) return sound;

	var constructor = this.settings.getSoundConstructor(channelId, id) || SoundObject;
	sound = this.permanentSounds[id] = new constructor();
	sound.setId(id);
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get a sound by its id
 *
 * @param {number} id - sound id
 */
AudioManager.prototype.getSound = function (id) {
	// search sound in permanents
	var sound = this.permanentSounds[id];
	if (sound) return sound;

	// search sound in active list
	sound = this.soundsById[id];
	if (sound) return sound;

	// search sound in archives
	sound = this.soundArchiveById[id];
	if (!sound) return null;

	// remove sound from archives
	this.soundArchive.removeByRef(sound.poolRef);
	sound.poolRef = null;
	delete this.soundArchiveById[id];

	// add sound back in active list
	this.soundsById[id] = sound;
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get a soundGroup by it's id
 *
 * @param {number} id - sound group id
 */
AudioManager.prototype.getSoundGroup = function (id) {
	// search soundGroup in active list
	var soundGroup = this.soundGroupsById[id];
	if (soundGroup) return soundGroup;

	// search soundGroup in archives
	soundGroup = this.soundGroupArchiveById[id];
	if (!soundGroup) return null;

	// remove soundGroup from archives
	this.soundGroupArchive.removeByRef(soundGroup.poolRef);
	soundGroup.poolRef = null;
	delete this.soundGroupArchiveById[id];

	// check that all individual sound of the group are loaded
	soundGroup.verifySounds();

	// add soundGroup back in active list
	this.soundGroupsById[id] = soundGroup;
	return soundGroup;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload and remove sound to free memory.
 *  We keep Sound instance for later reuse.
 *
 * @param {number} sound - sound wrapper object
 */
AudioManager.prototype.freeSound = function (sound) {
	var soundId = sound.id;
	if (this.soundsById[soundId]) { delete this.soundsById[soundId]; }
	if (this.soundArchiveById[soundId]) {
		this.soundArchive.removeByRef(sound.poolRef);
		sound.poolRef = null;
		delete this.soundArchiveById[soundId];
	}
	sound.unload();

	// don't add freed sound in pool if it's created from a custom constructor
	if (sound instanceof SoundObject) this.freeSoundPool.push(sound);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a long looped sound (e.g. background music) in specified channel.
 *  Only one looped sound can play per channel.
 *
 * @param {string} channelId - channel id.
 * @param {string} soundId   - sound id
 * @param {number} [volume]  - optional volume, a integer in range ]0..1]
 * @param {number} [pan]     - optional panoramic, a integer in rage [-1..1]
 * @param {number} [pitch]   - optional pitch, in semi-tone
 */
AudioManager.prototype.playLoopSound = function (channelId, soundId, volume, pan, pitch, loopStart, loopEnd) {
	var channel = this.channels[channelId];
	if (!channel) return console.warn('Channel id "' + channelId + '" does not exist.');
	channel.playLoopSound(soundId, volume, pan, pitch, loopStart, loopEnd);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop currently playing lopped sound in channel */
AudioManager.prototype.stopLoopSound = function (channelId) {
	var self = this;
	var channel = this.channels[channelId];
	if (!channel) return console.warn('Channel id "' + channelId + '" does not exist.');
	var currentSound = channel.loopSound;
	channel.loopId = null;
	if (!currentSound) return;
	currentSound.stop(function onSoundStop() {
		self.freeSound(currentSound);
		channel.loopSound = null;
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop and cleanup all looped sounds */
AudioManager.prototype.stopAllLoopSounds = function () {
	for (var channelId in this.channels) {
		this.stopLoopSound(channelId);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Called when map is changed, or on disconnection.
 *  All current sounds are archived, and if memory limit is reached,
 *  oldest used sounds are unloadded.
 */
AudioManager.prototype.release = function () {
	var maxSoundGroup = this.settings.maxSoundGroup;
	var maxUsedMemory = this.settings.maxUsedMemory;
	var id, soundGroup, sound;

	// don't release looped sounds
	var loopedSounds = {};
	for (id in this.channels) {
		var channel = this.channels[id];
		if (channel.loopSound) {
			loopedSounds[channel.loopSound.id] = true;
		}
	}

	// archive all sound groups
	for (id in this.soundGroupsById) {
		soundGroup = this.soundGroupsById[id];
		soundGroup.poolRef = this.soundGroupArchive.add(soundGroup);
		this.soundGroupArchiveById[id] = soundGroup;
		delete this.soundGroupsById[id];
	}

	// archive all sounds
	for (id in this.soundsById) {
		if (loopedSounds[id]) continue;
		sound = this.soundsById[id];
		sound.poolRef = this.soundArchive.add(sound);
		this.soundArchiveById[id] = sound;
		delete this.soundsById[id];
	}

	// free sound groups if count limit is reached
	var count = this.soundGroupArchive.getCount();
	while (count > maxSoundGroup) {
		soundGroup = this.soundGroupArchive.popFirst();
		if (!soundGroup) break;
		soundGroup.poolRef = null;
		delete this.soundGroupArchiveById[soundGroup.id];
		count -= 1;
	}

	// free sounds if memory limit is reached
	while (this.usedMemory > maxUsedMemory) {
		sound = this.soundArchive.popFirst();
		if (!sound) break;
		sound.poolRef = null;
		delete this.soundArchiveById[sound.id];
		this.freeSound(sound);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a sound in provided channel
 *
 * @param {String} channelId - channel id used to play sound
 * @param {String} soundId   - sound id
 * @param {number} [volume]  - optional volume value. volume:]0..1]
 * @param {number} [pan]     - optional panoramic value. pan:[-1..1]
 * @param {number} [pitch]   - optional pitch value in semi-tone. Only work with webAudio enabled
 */
AudioManager.prototype.playSound = function (channelId, soundId, volume, pan, pitch) {
	if (this.muted) return;
	var channel = this.channels[channelId];
	if (channel.muted) return;
	var sound = this.getSound(soundId);
	if (!sound) { sound = this.createSound(soundId, channelId); }
	volume = volume || 1.0;
	sound.play(channel.volume * volume, pan, pitch);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a sound group
 *
 * @param {String} channelId    - channel id used to play sound
 * @param {String} soundGroupId - sound group id
 * @param {number} [volume]     - optional volume value. volume:]0..1]
 * @param {number} [pan]        - optional panoramic value. pan:[-1..1]
 */
AudioManager.prototype.playSoundGroup = function (channelId, soundGroupId, volume, pan, pitch) {
	if (this.muted) return;
	var channel = this.channels[channelId];
	if (!channel || channel.muted) return;
	var soundGroup = this.getSoundGroup(soundGroupId);
	if (!soundGroup) return console.warn('SoundGroup "' + soundGroupId + '" does not exist.');
	volume = volume || 1.0;
	soundGroup.play(volume * channel.volume, pan, pitch);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a list of sound groups.
 *
 * @param {String}   soundGroupId        - soundGroup id
 * @param {Object}   soundGroupDef       - definition of sound group
 *        {String[]} soundGroupDef.id    - sound ids
 *        {number[]} soundGroupDef.vol   - sound volumes. vol:[0..1]
 *        {number[]} soundGroupDef.pitch - sound pitches in semi-tone.
 * @param {String}  [muted]              - if muted, then sounds are created but not loaded
 */
AudioManager.prototype.createSoundGroup = function (soundGroupId, soundGroupDef, muted) {
	if (this.getSoundGroup(soundGroupId)) return;
	var soundGroup = new SoundGroup(soundGroupId, soundGroupDef.id, soundGroupDef.vol, soundGroupDef.pitch, muted);
	this.soundGroupsById[soundGroupId] = soundGroup;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a list of sound groups.
 *
 * @param {Object}   soundGroupDefs          - definitions of sound groups
 *        {String[]} soundGroupDefs[*].id    - sound ids
 *        {number[]} soundGroupDefs[*].vol   - sound volumes. vol:[0..1]
 *        {number[]} soundGroupDefs[*].pitch - sound pitches in semi-tone.
 * @param {String}  [channelId]              - channel id the sound group will play in
 */
AudioManager.prototype.createSoundGroups = function (soundGroupDefs, channelId) {
	var muted = channelId !== undefined ? this.channels[channelId].muted : false;
	for (var soundGroupId in soundGroupDefs) {
		this.createSoundGroup(soundGroupId, soundGroupDefs[soundGroupId], muted);
	}
};
