# AudioManager
Play sounds using Web Audio, fallback on HTML5 Audio.
`AudioManager` is specifically designed to works for games that have a big
quantity of audio assets. Loading and unloading is made easy and transparent.
If available, WizAsset is used for downloading files to disc.

# API

```javascript
// initialisation
var audioManager = new AudioManager(channelIds);
audioManager.init();
audioManager.setVolume(channelId, volume);

// play simple sound
audioManager.playSound(channelId, soundId, volume, panoramic, pitch);

// sound group
audioManager.createSoundGroups(soundGroupDefs, channelId);
audioManager.playSoundGroup(channelId, groupId, volume, panoramic, pitch);

// loop
audioManager.playLoopSound(channelId, soundId, volume);
audioManager.stopLoopSound(channelId);
audioManager.stopAllLoopSounds();

// release memory
audioManager.release();
```

# Documentation

### Create audioManager object and channels
Pass the list of channels to the constructor as an array of strings.
```javascript
var channels = ['music', 'sfx', 'ui'];
var audioManager = new AudioManager(channels);
```

### Setup audioManager path to sound assets folder
```javascript
audioManager.settings.audioPath = 'assets/audio/';
```

### Start audio engine.
To work correctly on iOS, this must be called on an user interaction
(e.g. user pressing a button)
```javascript
gameStartButton.on('tap', function () {
	audioManager.init();
});
```

### Set channel volume
By default, channel volume is set to 0 and channel is muted.
No sounds will play until channel volume is set.
```javascript
var volume = 1.0; // volume is a float in range ]0..1]
audioManager.setVolume('ui', volume);
```

### Create and play a simple sound.
Create a sound and playing it in a channel.
Sound is created and loaded automatically.
```javascript
var fileName = 'laser1';
audioManager.playSound('sfx', fileName);

// volume and panoramic can be set optionally
var volume    = 0.7; // volume is a float in range ]0..1]
var panoramic = 0.9; // panoramic is a float in range [-1..1], 0 is the center
audioManager.playSound('sfx', fileName, volume, panoramic);
```

Sounds creation and preloading can be forced.
```javascript
audioManager.createSound(fileName).load();
```

Alternatively, sounds can be played outside channels.
```javascript
var sound = audioManager.createSound(fileName);
sound.play(volume, panoramic, pitch); // all parameters are optional.
```
### Change pitch
This feature is only available with WebAudio.

```javascript
var pitch = -7.0; // in semi-tone
sound.setPitch(pitch);
```

The pitch can be set at play.
```javascript
audioManager.playSound('ui', fileName, volume, panoramic, pitch);
```

While a sound is playing, the pitch can be changed dynamically
```javascript
var portamento = 3.0;
sound.setPitch(pitch, portamento);
```

### Create and play sound groups.
A sound group is a collection of sounds that will play alternatively in a 
round-robin pattern on each `play` call.
```javascript
var soundGroupDefs = {
	groupId1: { id: ['sound1', 'sound2'], vol: [1.0, 0.8], pitch: [0.0] },
	groupId2: { ... },
	...
};
audioManager.createSoundGroups(soundGroupDefs, 'sfx');

var volume    = 0.8; // volume is a float in range ]0..1]
var panoramic = 0.3; // panoramic is a float in range [-1..1], 0 is the center
var pitch     = 3.0; // in semi-tone
audioManager.playSoundGroup('sfx', 'groupId1', volume, panoramic, pitch);
```

### Play and stop looped sounds
Only one loop can play per channel. Playing a new looped sound in the same
channel will stop current playing sound before starting new one.
```javascript
var volume   = 1.0; // volume is a float in range ]0..1]
var fileName = 'bgm1';
audioManager.playLoopSound('music', fileName, volume);
audioManager.stopLoopSound('music'); // stop looped sound in channel 'music'
audioManager.stopAllLoopSounds();    // stop all looped sounds in all channel
```

### Release memory
```javascript
audioManager.release();
```
