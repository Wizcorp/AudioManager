# AudioManager
play sounds using Web Audio, fallback on HTML5 Audio

## API

Create audioManager object and define sound channels.
```javascript
var channels = ['music', 'sfx', 'ui'];
var audioManager = new AudioManager(channels);
```

Setup audioManager path to sound assets folder
```javascript
audioManager.settings.audioPath = 'assets/audio/';
```

Start audio engine.
To work correctly on iOS, this must be called on an user interaction (e.g. user pressing a button)
```javascript
gameStartButton.on('tap', function () {
	audioManager.init();
});
```

Set channel volume
```javascript
var volume  = 1.0; // volume is a float in range ]0..1]
audioManager.setVolume('sfx', volume);
```

Load and play a simple sound.
```javascript
var fileName = 'sound1'; // fileName is sound path without '.mp3' extension
audioManager.createSound(fileName);
audioManager.playSound('ui', fileName);
```

Create and play sound groups.
```javascript
var soundGroupDefs = {
	groupId1: { id: ['sound1', 'sound2'], vol: [1.0, 0.8] },
	groupId2: { ... },
	...
};
audioManager.createSoundGroups(soundGroupDefs, 'sfx');

var panoramic = 0.3; // panoramic is a float in range [-1..1].
                     // set to 0, the sound will play at center.
audioManager.playSoundGroup('sfx', 'groupId1', panoramic);
```

Play and stop looped sounds (e.g. background music). Only one loop can play per channel.
```javascript
var volume   = 1.0; // volume is a float in range ]0..1]
var fileName = 'bgm1';
audioManager.playLoopSound('music', fileName, volume);
audioManager.stopLoopSound('music'); // stop looped sound in channel 'music'
audioManager.stopAllLoopSounds();    // stop all looped sounds in all channel
```

Release memory
```javascript
audioManager.release();
```
