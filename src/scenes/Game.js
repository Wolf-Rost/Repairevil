import Phaser from "phaser";
import { PlanetObject } from "../ui/PlanetObject";
import { ConnectionObject } from "../ui/ConnectionObject";
import { Player } from "../model/Player";
import {
    GameState,
    GamePhaseIngame,
    GamePhaseEnd,
    GamePhaseChooseBase,
} from "../model/GameState";
import { Universe } from "../model/Universe";
import { GameLogic } from "../model/GameLogic";
import { setupInfoArea, updateInfoArea, setSliderValue } from "../ui/InfoArea";
import { Viewport, InfoArea } from "../ui/consts";
import { OwnerPlayer } from "../model/Planet";
import { InputManager } from "../ui/InputManager";
import { getPopulationPercentiles } from "../ui/util";
import { StrengthMeter } from "../ui/StrengthMeter";

export default class extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });

        this.level = 1;

        this.selectedObject = null;
        this.planetObjects = Array();
        this.frameCounter = 0;

        this.eventEmitter = new Phaser.Events.EventEmitter();
        GameLogic.setEventEmitter(this.eventEmitter);

        this.onUpgradeGrowth = this.onUpgradeGrowth.bind(this);
        this.onUpgradeIncome = this.onUpgradeIncome.bind(this);
        this.onUpgradeSpread = this.onUpgradeSpread.bind(this);
        this.onUnselect = this.onUnselect.bind(this);
        this.update = this.update.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.onPlanetClicked = this.onPlanetClicked.bind(this);
        this.onBaseChosen = this.onBaseChosen.bind(this);
        this.onPlanetSelected = this.onPlanetSelected.bind(this);
        this.onEndGame = this.onEndGame.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.startLevel = this.startLevel.bind(this);
        this.selectNextPlanet = this.selectNextPlanet.bind(this);
        this.onChangeSpreadRate = this.onChangeSpreadRate.bind(this);
        this.onClickBackground = this.onClickBackground.bind(this);

        this.allConnectionsVisible = false;
    }

    preload() {
        // var url;
        // url =
        //     "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexsliderplugin.min.js";
        // this.load.plugin("rexsliderplugin", url, true);
        // url =
        //     "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/images/white-dot.png";
        // this.load.image("dot", url);

        this.load.image("planet0", "src/assets/planets/purple.png");
        this.load.image("planet1", "src/assets/planets/orange.png");
        this.load.image("planet2", "src/assets/planets/white.png");
        this.load.image("galaxy", "src/assets/galaxy.jpg");
        this.load.image("virus", "src/assets/virus.png");
        this.load.image("cure", "src/assets/cure.png");
        // this.load.image("light", "src/assets/light.png");
        this.load.image("glow_player", "src/assets/glow_player.png");
        this.load.image("glow_virus", "src/assets/glow_virus.png");
        this.load.image("glow_default", "src/assets/glow_default.png");
        this.load.image("rect", "src/assets/rect.png");
    }

    create() {
        const callbacks = {
            onA: () => this.onUpgradeGrowth(),
            onS: () => this.onUpgradeIncome(),
            onD: () => this.onUpgradeSpread(),
            onF: () => this.onBaseChosen(),
            onTab: () => this.selectNextPlanet(),
            onSpaceUp: () => this.toggleSpaceConnections(),
        };
        this.inputManager = new InputManager(this, callbacks);

        this.setupUI();
        this.endGameText = this.add.text(
            (Viewport.width * 3) / 4 / 2,
            Viewport.height / 3,
            "",
            {
                fontFamily: '"Roboto Condensed"',
                fontSize: 50,
                color: "#ffffff",
            }
        );
        this.endGameText.setOrigin(0.5, 0);
        this.endGameText.setDepth(5);

        this.strengthMeter = new StrengthMeter(
            InfoArea.x + InfoArea.margin,
            InfoArea.y + 150,
            InfoArea.width - 2 * InfoArea.margin,
            40
        );

        this.startLevel(this.level);
    }

    destroy() {
        this.selectedObject = null;
        this.planetObjects && this.planetObjects.forEach(p => p.destroy());
        this.connectionObjects &&
            this.connectionObjects.forEach(c => c.destroy());
    }

    startLevel(level) {
        let universe = new Universe();
        universe.generate(level);
        let player = new Player();
        this.gameState = new GameState(universe, player, level);

        this.connectionObjects = this.gameState.universe.spaceConnections.map(
            c => this.createConnectionObject(c)
        );

        this.planetObjects = this.gameState.universe.planets.map(p =>
            this.createPlanetObject(p)
        );

        const percentiles = getPopulationPercentiles(this.planetObjects);
        percentiles.forEach((percentile, i) =>
            percentile.forEach(planetObject =>
                planetObject.init(this, 0.6 - 0.1 * i)
            )
        );

        this.setupSelectBase();

        this.gameState.gamePhase = GamePhaseChooseBase;
        this.endGameText.visible = false;
    }

    setupSelectBase() {
        this.eventEmitter.removeAllListeners();
        this.eventEmitter.on("planetClicked", this.onPlanetClicked);
        this.eventEmitter.on("planetSelected", this.onPlanetSelected);
        this.eventEmitter.on("choosePlanetClicked", this.onBaseChosen);
        updateInfoArea(this.selectedObject, this.gameState);
    }

    setupIngame() {
        this.eventEmitter.removeAllListeners();
        this.eventEmitter.on("planetClicked", this.onPlanetClicked);
        this.eventEmitter.on("planetSelected", this.onPlanetSelected);
        this.eventEmitter.on("gameStep", this.updateUI);
        this.eventEmitter.on("endGame", this.onEndGame);
        this.eventEmitter.on("changeSpreadRate", this.onChangeSpreadRate);

        this.eventEmitter.on(
            "spread",
            (fromPlanet, toPlanet, shipFleet, owner) => {
                let fromPlanetPosition = fromPlanet.getPosition();
                let toPlanetPosition = toPlanet.getPosition();

                let path = new Phaser.Curves.Path(
                    fromPlanetPosition[0],
                    fromPlanetPosition[1]
                );

                path.lineTo(toPlanetPosition[0], toPlanetPosition[1]);

                let delay = 50;
                let duration = 1000;

                let connectionObjectList = this.connectionObjects.filter(
                    connectionObject => {
                        let startPlanet = connectionObject.model.startPlanet;
                        let endPlanet = connectionObject.model.endPlanet;
                        return (
                            (fromPlanet == startPlanet ||
                                toPlanet == startPlanet) &&
                            (fromPlanet == endPlanet || toPlanet == endPlanet)
                        );
                    }
                );

                if (connectionObjectList.length == 1) {
                    let c = connectionObjectList[0];
                    c.draw(this, owner);
                }

                let sprite = "virus";

                if (owner == OwnerPlayer) {
                    sprite = "cure";
                }

                for (var i = 0; i < shipFleet / 200; i++) {
                    var follower = this.add.follower(path, 0, 0, sprite);

                    follower.startFollow({
                        duration: duration,
                        positionOnPath: true,
                        repeat: 0,
                        ease: "Sine.easeInOut",
                        delay: i * delay,
                    });

                    setTimeout(
                        f => {
                            f.destroy();
                        },
                        duration + i * delay,
                        follower
                    );
                }
            }
        );

        updateInfoArea(this.selectedObject, this.gameState);
        this.eventEmitter.emit("planetSelected", this.selectedObject);
    }

    onBaseChosen() {
        if (this.selectedObject) {
            this.selectedObject.model.spawnPlayer(this.gameState);
            this.setupIngame();
        } else console.error("no planet is selected");
    }

    setupUI() {
        let background = this.add.sprite(800, 450, "galaxy");
        background.on("pointerup", this.onClickBackground);
        background.setInteractive();

        const infoAreaCallbacks = {
            onUpgradeGrowth: this.onUpgradeGrowth,
            onUpgradeIncome: this.onUpgradeIncome,
            onUpgradeSpread: this.onUpgradeSpread,
        };
        let graphics = this.add.graphics({ fillStyle: { color: 0xa0a0a0 } });
        setupInfoArea(this, infoAreaCallbacks, graphics);
    }

    onClickBackground() {
        if (event.screenX < window.innerWidth * (3 / 4)) {
            this.onUnselect();
        }
    }

    onEndGame(won) {
        if (this.gameState.gamePhase !== GamePhaseIngame) {
            return;
        }

        this.gameState.gamePhase = GamePhaseEnd;
        if (won) {
            this.endGameText.setText("You won!");
            this.level = this.level + 1;
        } else {
            this.endGameText.setText("Try again");
        }
        this.endGameText.visible = true;

        this.allConnectionsVisible = false;
        setTimeout(this.restartGame, 3000);
    }

    restartGame() {
        this.destroy();
        this.startLevel(this.level);
    }

    onUpgradeGrowth() {
        if (!this.selectedObject) {
            return;
        }
        this.selectedObject.model.upgradeGrowth(this.gameState);
        this.updateUI();
    }

    onUpgradeIncome() {
        if (!this.selectedObject) {
            return;
        }
        this.selectedObject.model.upgradeIncome(this.gameState);
        this.updateUI();
    }

    onUpgradeSpread() {
        if (!this.selectedObject) {
            return;
        }
        this.selectedObject.model.upgradeSpread(this.gameState);
        this.updateUI();
    }

    onPlanetClicked(planetObject) {
        this.selectedObject = planetObject;
        this.eventEmitter.emit("planetSelected", planetObject);
    }

    update() {
        if (this.gameState.gamePhase == GamePhaseIngame) {
            GameLogic.update(this.gameState, this.eventEmitter);
        }
        this.planetObjects.forEach(p => p.draw(p === this.selectedObject));
        updateInfoArea(this.selectedObject, this.gameState);

        this.strengthMeter.update(
            this,
            GameLogic.getPlayerPopulation(this.gameState),
            GameLogic.getVirusPopulation(this.gameState),
            GameLogic.getDefaultPopulation(this.gameState)
        );
    }

    onUnselect() {
        if (this.allConnectionsVisible == false) {
            this.selectedObject = null;

            this.clearDrawedSpaceConnection();
        }
    }

    updateUI() {
        updateInfoArea(this.selectedObject, this.gameState);
    }

    onPlanetSelected(planetObject) {
        setSliderValue(planetObject.model.spreadRate / 100);
        if (this.allConnectionsVisible == false) {
            this.clearDrawedSpaceConnection();
            let planet = planetObject.model;
            let connectionObjects = this.connectionObjects.filter(
                spaceConnection => {
                    return (
                        spaceConnection.model.startPlanet == planet ||
                        spaceConnection.model.endPlanet == planet
                    );
                }
            );
            connectionObjects.forEach(c => c.draw(this));
        }
    }

    createPlanetObject(model) {
        const assetName = "planet" + Math.floor(Math.random() * 3);
        let sprite = this.add.sprite(0, 0, assetName);
        sprite.setDepth(0.1);

        let glowSpritePlayer = this.add.sprite(0, 0, "glow_player");
        glowSpritePlayer.setDepth(0.05);
        glowSpritePlayer.setOrigin(0.5, 0.5);
        let glowSpriteVirus = this.add.sprite(0, 0, "glow_virus");
        glowSpriteVirus.setDepth(0.05);
        glowSpriteVirus.setOrigin(0.5, 0.5);
        let glowSpriteDefault = this.add.sprite(0, 0, "glow_default");
        glowSpriteDefault.setDepth(0.05);
        glowSpriteDefault.setOrigin(0.5, 0.5);

        let planet = new PlanetObject(model, sprite, {
            glowSpritePlayer,
            glowSpriteVirus,
            glowSpriteDefault,
        });
        sprite.on("pointerup", () =>
            this.eventEmitter.emit("planetClicked", planet)
        );
        return planet;
    }

    createConnectionObject(model) {
        let connection = new ConnectionObject(model);
        connection.init(this);
        return connection;
    }

    clearDrawedSpaceConnection() {
        this.connectionObjects &&
            this.connectionObjects.forEach(c => c.hideDefaultLine());
    }

    selectNextPlanet() {
        const index = this.planetObjects.findIndex(
            p => p === this.selectedObject
        );
        let nextIndex = index + 1;
        if (nextIndex == this.planetObjects.length) {
            nextIndex = 0;
        }
        this.selectedObject = this.planetObjects[nextIndex];
        this.onPlanetSelected(this.planetObjects[nextIndex]);
    }

    onChangeSpreadRate(value) {
        this.selectedObject.model.spreadRate = value * 100;
    }

    toggleSpaceConnections() {
        if (this.allConnectionsVisible) {
            this.connectionObjects.forEach(connectionObject => {
                connectionObject.hideDefaultLine();
            });
            this.planetObjects.forEach(planetObject => {
                planetObject.hideFullDetails();
            });
        } else {
            this.connectionObjects.forEach(connectionObject => {
                connectionObject.draw(this);
            });
            this.planetObjects.forEach(planetObject => {
                planetObject.showFullDetails();
            });
        }
        this.allConnectionsVisible = !this.allConnectionsVisible;
    }
}
