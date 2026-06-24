import { TexRegionController } from "./tex_region_controller";

const TEX_REGION_SIZE = 256.0;

function main() {
    const texRegionCanvas = document.getElementById(
        "tex-region-canvas",
    ) as HTMLCanvasElement;
    texRegionCanvas.width = TEX_REGION_SIZE;
    texRegionCanvas.height = TEX_REGION_SIZE;

    const texRegionController = new TexRegionController(texRegionCanvas);

    const outputCanvasDiv = document.getElementById(
        "output-canvas-div",
    ) as HTMLElement;
    const outputCanvas = document.getElementById(
        "output-canvas",
    ) as HTMLCanvasElement;

    window.onload = window.onresize = () => {
        outputCanvas.width = outputCanvasDiv.offsetWidth;
        outputCanvas.height = outputCanvasDiv.offsetHeight;
    };
}

main();
