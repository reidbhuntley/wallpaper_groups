import { TexRegionController } from "./tex_region_controller";
import { WallpaperGroup, type WallpaperGroupKind } from "./wallpaper_group";

const TEX_REGION_SIZE = 256.0;

const texRegionCanvas = document.getElementById(
    "tex-region-canvas",
) as HTMLCanvasElement;
texRegionCanvas.width = TEX_REGION_SIZE;
texRegionCanvas.height = TEX_REGION_SIZE;

const texRegionController = new TexRegionController(texRegionCanvas);

const groupSelect = document.getElementById(
    "group-select",
) as HTMLSelectElement;
groupSelect.addEventListener("change", (_e) => {
    const groupKind = groupSelect.value as WallpaperGroupKind;
    texRegionController.setGroup(new WallpaperGroup(groupKind));
});

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
