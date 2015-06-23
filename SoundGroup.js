/** Set of sound played in sequence each times it triggers
 *  used for animation sfx
 * @author Cedric Stoquer
 *
 * @param {String}       id       - animation frame id (e.g.: '569/AnimMarche_5:0')
 * @param {number[]}     soundIds - array of sound ids
 * @param {number[]}     volumes  - array of volumes
 */
function SoundGroup(id, soundIds, volumes, muted) {
	this.id       = id;
	this.soundIds = soundIds;
	this.volumes  = [];
	this.length   = soundIds.length;
	this.position = 0;
	this.poolRef  = null;

	for (var i = 0; i < soundIds.length; i++) {
		if (muted) {
			this.audioManager.createSound(soundIds[i]);
		} else {
			this.audioManager.loadSound(soundIds[i]);
		}
		this.volumes.push(Math.max(0, Math.min(1, volumes[i] || 1.0)));
	}
}
module.exports = SoundGroup;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundGroup.prototype.play = function (volume, pan, pitch) {
	if (this.length === 0) { return; }
	var soundId = this.soundIds[this.position];
	var sound = this.audioManager.getSound(soundId);
	if (!sound) { return console.warn('[Sound Group: ' + this.id + '] sound id ' + soundId + '  cannot be played.'); }
	volume *= this.volumes[this.position];
	sound.play(volume, pan, pitch);
	this.position++;
	if (this.position >= this.length) { this.position = 0; }
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundGroup.prototype.verifySounds = function () {
	for (var i = 0; i < this.soundIds.length; i++) {
		var soundId = this.soundIds[i];
		this.audioManager.createSound(soundId);
	}
};
