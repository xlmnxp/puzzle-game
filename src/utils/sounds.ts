import { Howl } from 'howler';

const placeSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3'],
  volume: 0.5,
});

const removeSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2064/2064-preview.mp3'],
  volume: 0.5,
});

const encouragementSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2152/2152-preview.mp3'],
  volume: 0.7,
});

const highScoreSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'],
  volume: 0.7,
});

export const playPlaceSound = () => placeSound.play();
export const playRemoveSound = () => removeSound.play();
export const playEncouragementSound = () => encouragementSound.play();
export const playHighScoreSound = () => highScoreSound.play();