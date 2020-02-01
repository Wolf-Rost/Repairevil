import { getRandomArbitrary } from "../model/Utils";

const virusFactor = 0.33; // How fast the virus growth on planets;
let counter = 0;
let eventEmitter;
export class GameLogic {
  static update(gameState) {
    counter = counter + 1;
    if (counter % 30 == 0) {
      console.log("update");
      GameLogic.updateMoney(gameState);
      GameLogic.updateShips(gameState);
      GameLogic.updateFights(gameState);
      eventEmitter.emit("gameStep");
    }
  }

  static updateMoney(gameState) {
    for (let i = 0; i < gameState.universe.planets.length; i++) {
      const element = gameState.universe.planets[i];
      if (element.population.player > 0) {
        gameState.player.money += element.income;
      }
    }
  }

  static updateShips(gameState) {
    for (let i = 0; i < gameState.universe.planets.length; i++) {
      const element = gameState.universe.planets[i];
      if (element.population.virus > 0) {
        element.population.virus += Math.floor(
          element.growthRate *
            virusFactor *
            (Math.floor(gameState.level / 5) + 1)
        );
      }
      if (element.population.player > 0) {
        element.population.player += Math.floor(element.growthRate);
      }
    }
  }

  static updateFights(gameState) {
    for (let i = 0; i < gameState.universe.spaceConnections.length; i++) {
      const element = gameState.universe.spaceConnections[i];
      const startPlanet = element.startPlanet;
      const endPlanet = element.endPlanet;
      if (
        startPlanet.population.default == 0 &&
        this.isSpreading(element.sendPorbability)
      ) {
        console.log("spread from", startPlanet.name, "to", endPlanet.name);
        this.spread(startPlanet, endPlanet);
      }
      if (
        endPlanet.population.default == 0 &&
        this.isSpreading(element.sendPorbability)
      ) {
        console.log("spread from", endPlanet.name, "to", startPlanet.name);
        this.spread(endPlanet, startPlanet);
      }
    }
  }

  static isSpreading(sendPorbability) {
    return getRandomArbitrary(0, 100) < sendPorbability;
  }

  static spread(fromPlanet, toPlanet) {
    if (fromPlanet.population.virus > 1) {
      this.spreadVirus(fromPlanet, toPlanet);
    }
    if (fromPlanet.population.player > 1) {
      this.spreadPlayer(fromPlanet, toPlanet);
    }
  }

  static spreadVirus(fromPlanet, toPlanet) {
    var shipFleet = Math.floor(
      (fromPlanet.population.virus * fromPlanet.spreadRate) / 100
    );

    eventEmitter.emit("spread", fromPlanet, toPlanet, shipFleet, "virus");

    fromPlanet.population.virus -= shipFleet;
    this.fightPlanetWithVirus(toPlanet, shipFleet);
  }

  static spreadPlayer(fromPlanet, toPlanet) {
    var shipFleet = Math.floor(
      (fromPlanet.population.player * fromPlanet.spreadRate) / 100
    );

    eventEmitter.emit("spread", fromPlanet, toPlanet, shipFleet, "player");

    fromPlanet.population.player -= shipFleet;
    this.fightPlanetWithPlayer(toPlanet, shipFleet);
  }

  static fightPlanetWithVirus(attackedPlanet, shipFleet) {
    // planet is unowned
    if (
      attackedPlanet.population.virus == 0 &&
      attackedPlanet.population.player == 0 &&
      attackedPlanet.population.default == 0
    ) {
      attackedPlanet.population.virus += shipFleet;
    }
    // planet is owned by virus itself
    if (attackedPlanet.population.virus > 0) {
      attackedPlanet.population.virus += shipFleet;
    }
    // planet is owned by player
    if (attackedPlanet.population.player > 0) {
      attackedPlanet.population.player -= shipFleet;
      if (attackedPlanet.population.player < 0) {
        attackedPlanet.population.virus +=
          attackedPlanet.population.player * -1;
        attackedPlanet.population.player = 0;
      }
    }
    // planet is owned by default
    if (attackedPlanet.population.default > 0) {
      attackedPlanet.population.default -= shipFleet;
      if (attackedPlanet.population.default < 0) {
        attackedPlanet.population.virus +=
          attackedPlanet.population.default * -1;
        attackedPlanet.population.default = 0;
      }
    }
  }

  static fightPlanetWithPlayer(attackedPlanet, shipFleet) {
    // planet is unowned
    if (
      attackedPlanet.population.virus == 0 &&
      attackedPlanet.population.player == 0 &&
      attackedPlanet.population.default == 0
    ) {
      attackedPlanet.population.player += shipFleet;
    }
    // planet is owned by player itself
    if (attackedPlanet.population.player > 0) {
      attackedPlanet.population.player += shipFleet;
    }
    // planet is owned by virus
    if (attackedPlanet.population.virus > 0) {
      attackedPlanet.population.virus -= shipFleet;
      if (attackedPlanet.population.virus < 0) {
        attackedPlanet.population.player +=
          attackedPlanet.population.virus * -1;
        attackedPlanet.population.virus = 0;
      }
    }
    // planet is owned by default
    if (attackedPlanet.population.default > 0) {
      attackedPlanet.population.default -= shipFleet;
      if (attackedPlanet.population.default < 0) {
        attackedPlanet.population.player +=
          attackedPlanet.population.default * -1;
        attackedPlanet.population.default = 0;
      }
    }
  }

  static setEventEmitter(ee) {
    eventEmitter = ee;
  }
}
