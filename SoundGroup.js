//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set of sound played in sequence each times it triggers
 *  used for animation sfx
 * @author Cedric Stoquer
 *
 * @param {String}       id       - sound ground id
 * @param {number[]}     soundIds - array of sound ids
 * @param {number[]}     volumes  - array of volumes
 * @param {number[]}     pitches  - array of pitches
 */
function SoundGroup(id, soundIds, volumes, pitches, muted) {
	this.id         = id;
	this.soundIds   = soundIds;
	this.volumes    = volumes || [];
	this.pitches    = pitches || [];
	this.soundIndex = 0;
	this.volIndex   = 0;
	this.pitchIndex = 0;
	this.poolRef    = null;

	for (var i = 0; i < soundIds.length; i++) {
		if (muted) {
			this.audioManager.createSound(soundIds[i]);
		} else {
			this.audioManager.loadSound(soundIds[i]);
		}
	}

	if (this.volumes.length === 0) { this.volumes.push(1.0); }
	if (this.pitches.length === 0) { this.pitches.push(0.0); }
}
module.exports = SoundGroup;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound group.
 *
 * @param {number} [volume] - optional volume
 * @param {number} [pan]    - optional panoramic
 * @param {number} [pitch]  - optional pitch value in semi-tone (available only if using webAudio)
 */
SoundGroup.prototype.play = function (volume, pan, pitch) {
	if (this.soundIds.length === 0) { return; }
	var soundId = this.soundIds[this.soundIndex++];
	var sound = this.audioManager.getSound(soundId);
	if (!sound) { return console.warn('[Sound Group: ' + this.id + '] sound id ' + soundId + '  cannot be played.'); }
	volume = volume || 1.0;
	pitch  = pitch  || 0.0;
	volume *= this.volumes[this.volIndex++];
	pitch  += this.pitches[this.pitchIndex++];
	sound.play(volume, pan, pitch);
	if (this.soundIndex >= this.soundIds.length) { this.soundIndex = 0; }
	if (this.volIndex   >= this.volumes.length)  { this.volIndex   = 0; }
	if (this.pitchIndex >= this.pitches.length)  { this.pitchIndex = 0; }
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Check that all sounds in group are correctly created */
SoundGroup.prototype.verifySounds = function () {
	for (var i = 0; i < this.soundIds.length; i++) {
		var soundId = this.soundIds[i];
		this.audioManager.createSound(soundId);
	}
};
