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

    this.level = 1;

    this.planetObjects = this.planets = Array();
    this.frameCounter = 0;

    this.onUpgradeGrowth = this.onUpgradeGrowth.bind(this);
    this.onUpgradeIncome = this.onUpgradeIncome.bind(this);
    this.onUpgradeSpread = this.onUpgradeSpread.bind(this);
    this.onUnselect = this.onUnselect.bind(this);
    this.update = this.update.bind(this);
    this.updateUI = this.updateUI.bind(this);
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

    this.connectionObjects = this.gameState.universe.spaceConnections.map(c =>
      this.createConnectionObject(c)
    );
    this.connectionObjects.forEach(c => c.draw(this));

    this.planetObjects = this.gameState.universe.planets.map(p =>
      this.createPlanetObject(p)
    );
  }

  setupUI() {
    let background = this.add.sprite(800, 450, "galaxy");
    background.on("pointerup", this.onUnselect);
    background.setInteractive();

    const infoAreaCallbacks = {
      onUpgradeGrowth: this.onUpgradeGrowth,
      onUpgradeIncome: this.onUpgradeIncome,
      onUpgradeSpread: this.onUpgradeSpread
    };
    let graphics = this.add.graphics({ fillStyle: { color: 0xa0a0a0 } });
    setupInfoArea(this, infoAreaCallbacks, graphics);
  }

  onUpgradeGrowth() {
    this.selectedObject.model.upgradeGrowth(this.gameState);
    this.updateUI();
  }

  onUpgradeIncome() {
    this.selectedObject.model.upgradeIncome(this.gameState);
    this.updateUI();
  }

  onUpgradeSpread() {
    this.selectedObject.model.upgradeSpread(this.gameState);
    this.updateUI();
  }

  onPlanetClicked(planetObject) {
    this.selectedObject = planetObject;
    this.onPlanetSelected();
  }

  update() {
    GameLogic.update(this.gameState);
    updateInfoArea(this.selectedObject, this.gameState);
  }

  onUnselect() {
    this.selectedObject && this.selectedObject.reset();
    this.selectedObject = null;
  }

  updateUI() {
    updateInfoArea(this.selectedObject, this.gameState);
  }

  onPlanetSelected() {
    this.planetObjects
      .filter(p => p !== this.selectedObject)
      .forEach(p => p.reset());
    this.selectedObject.onSelected();
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

  // handleGameEvent(eventType, args) {
  //   switch (eventType) {
  //     case "spread": {
  //     }
  //   }
  // }
}
