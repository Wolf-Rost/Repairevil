import Phaser from "phaser";

export default {
  type: Phaser.AUTO,
  parent: "content",
  width: 1600,
  height: 900,
  localStorageName: "repairevil",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  }
};
