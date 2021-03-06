import { horizontalCells, verticalCells } from "../model/Universe";

export const Viewport = { width: 1600, height: 900 };
let gameGridMargin = 50;
export const GameGrid = {
    horizontalCells: horizontalCells,
    verticalCells: verticalCells,
    margin: gameGridMargin,
    cellWidth:
        ((Viewport.width * 3) / 4 - 2 * gameGridMargin) / horizontalCells,
    cellHeight: (Viewport.height - 2 * gameGridMargin) / verticalCells,
};

export const InfoArea = {
    x: (Viewport.width * 3) / 4,
    y: 0,
    width: Viewport.width / 4,
    height: Viewport.height,
    margin: 20,
};

export const colors = {
    noTint: 0xffffff,
    selectedDefaultPlanetTint: 0xaaaaaa,
    selectedPlayerPlanetTint: 0x00bb00,
    selectedVirusPlanetTint: 0xbb0000,
    playerPlanetTint: 0x00ff00,
    virusPlanetTint: 0xff0000,
    connectionColor: 0x00ff00,
    connectionPlayerColor: 0x00ff00,
    connectionVirusColor: 0xff0000,
    TextButton: {
        default: "#ffffff",
        hover: "#4444dd",
        active: "#0000ff",
    },
};
