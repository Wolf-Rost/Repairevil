import Phaser from "phaser";
import { PlanetObject } from "../ui/PlanetObject";
import { ConnectionObject } from "../ui/ConnectionObject";
import { Player } from "../model/Player";
import { GameState } from "../model/GameState";
import { Universe } from "../model/Universe";
import { GameLogic } from "../model/GameLogic";
import { setupInfoArea, updateInfoArea } from "../ui/InfoArea";

export default class extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.level = 0;

    this.planetObjects = this.planets = Array();
    this.frameCounter = 0;

    this.onUpgradeGrowth = this.onUpgradeGrowth.bind(this);
    this.onUpgradeIncome = this.onUpgradeIncome.bind(this);
    this.onUpgradeSpread = this.onUpgradeSpread.bind(this);
  }

  preload() {
    this.load.image("planet", "src/assets/planet.png");
    this.load.image("galaxy", "src/assets/galaxy.jpg");
  }

  create() {
    this.setupUI();

    let universe = new Universe();
    universe.generate(this.level);
    let player = new Player();
    this.gameState = new GameState(universe, player);

    this.planetObjects = this.gameState.universe.planets.map(p =>
      this.createPlanetObject(p)
    );
    // this.connectionObjects = this.gameState.universe.connections.map(c =>
    //   this.createConnectionObject(c)
    // );
  }

  setupUI() {
    let background = this.add.sprite(800, 450, "galaxy");
    background.on("pointerup", () => {
      this.selectedObject = null;
      console.log("set selectedObject to null");
      updateInfoArea(this.selectedObject, this.gameState);
    });
    background.setInteractive();

    const infoAreaCallbacks = {
      onUpgradeGrowth: this.onUpgradeGrowth,
      onUpgradeIncome: this.onUpgradeIncome,
      onUpgradeSpread: this.onUpgradeSpread
    };
    setupInfoArea(this, infoAreaCallbacks);
  }

  onUpgradeGrowth() {
    console.log("onUpgradeGrowth");
    this.selectedObject.model.upgradeGrowth(this.gameState);
    updateInfoArea(this.selectedObject, this.gameState);
  }

  onUpgradeIncome() {
    console.log("onUpgradeIncome");
    this.selectedObject.model.upgradeIncome(this.gameState);
    updateInfoArea(this.selectedObject, this.gameState);
  }

  onUpgradeSpread() {
    console.log("onUpgradeSpread");
    this.selectedObject.model.upgradeSpread(this.gameState);
    updateInfoArea(this.selectedObject, this.gameState);
  }

  onPlanetClicked(planetObject) {
    this.selectedObject = planetObject;
    console.log("set selectedObject to ", planetObject);
    updateInfoArea(this.selectedObject, this.gameState);
  }

  update() {
    GameLogic.update(this.gameState);
    if (this.gameState.player) {
      this.updateUI();
    }
  }

  updateUI() {
    if (this.frameCounter % 30 == 0) {
      this.frameCounter = this.frameCounter + 1;
      updateInfoArea(this.selectedObject, this.gameState);
    }
  }

  createPlanetObject(model) {
    let sprite = this.add.sprite(0, 0, "planet");
    let planet = new PlanetObject(model, sprite);
    sprite.on("pointerup", () => this.onPlanetClicked(planet));
    return planet;
  }

  createConnectionObject(model) {
    let connection = new ConnectionObject(model);
    return connection;
  }
}
