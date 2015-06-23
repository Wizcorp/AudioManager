# AudioManager
play sounds using Web Audio, fallback on HTML5 Audio

## Documentation

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
To work correctly on iOS, this must be called on an user interaction (e.g. user pressing a button)
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
audioManager.setVolume('sfx', volume);
```

### Load and play a simple sound.
```javascript
var fileName = 'sound1'; // fileName is sound path without '.mp3' extension
audioManager.createSound(fileName);
audioManager.playSound('ui', fileName);

// volume and panoramic can be set optionally
var volume    = 0.7; // volume is a float in range ]0..1]
var panoramic = 0.9; // panoramic is a float in range [-1..1], 0 is the center
audioManager.playSound('ui', fileName, volume, panoramic);
```

### Create and play sound groups.
```javascript
var soundGroupDefs = {
	groupId1: { id: ['sound1', 'sound2'], vol: [1.0, 0.8] },
	groupId2: { ... },
	...
};
audioManager.createSoundGroups(soundGroupDefs, 'sfx');

var volume    = 0.8; // volume is a float in range ]0..1]
var panoramic = 0.3; // panoramic is a float in range [-1..1], 0 is the center
audioManager.playSoundGroup('sfx', 'groupId1', volume, panoramic);
```

### Play and stop looped sounds (e.g. background music). Only one loop can play per channel.
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
