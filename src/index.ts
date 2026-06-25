import { Camera } from "./camera";
import { CameraController } from "./camera_controller";
import { Renderer } from "./renderer";
import { TexRegionController } from "./tex_region_controller";
import { WallpaperGroup, type WallpaperGroupKind } from "./wallpaper_group";

// Set up tex region controller

const TEX_REGION_SIZE = 300.0;

const texRegionCanvas = document.getElementById(
    "tex-region-canvas",
) as HTMLCanvasElement;
texRegionCanvas.width = TEX_REGION_SIZE;
texRegionCanvas.height = TEX_REGION_SIZE;

const texRegionController = new TexRegionController(texRegionCanvas);

// Set up output canvas

const outputCanvasDiv = document.getElementById(
    "output-canvas-div",
) as HTMLElement;
const outputCanvas = document.getElementById(
    "output-canvas",
) as HTMLCanvasElement;

// Set up camera

const cameraController = new CameraController(outputCanvas);

// Set up renderer

const gl = outputCanvas.getContext("webgl");
let renderer: Renderer | null = null;
if (gl === null) {
    alert(
        "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
} else {
    renderer = Renderer.init(
        gl,
        texRegionController.texRegion,
        cameraController.camera,
    );

    texRegionController.onSetTextureBitmap = (bitmap) => {
        renderer?.loadTexture(bitmap);
    };
}

// Resize output canvas based on its container's size

const resizeOutputCanvas = () => {
    outputCanvas.width = outputCanvasDiv.offsetWidth;
    outputCanvas.height = outputCanvasDiv.offsetHeight;
    gl?.viewport(0, 0, outputCanvas.width, outputCanvas.height);
};

resizeOutputCanvas();
window.addEventListener("load", resizeOutputCanvas);
window.addEventListener("resize", resizeOutputCanvas);

// Set up group selection

const groupSelect = document.getElementById(
    "group-select",
) as HTMLSelectElement;

const onGroupChanged = () => {
    const groupKind = groupSelect.value as WallpaperGroupKind;
    const group = new WallpaperGroup(groupKind);
    texRegionController.setGroup(group);
    renderer?.setGroup(group);
};

onGroupChanged();
groupSelect.addEventListener("change", onGroupChanged);

// Set up texture loading

const defaultTexture = new Image();
defaultTexture.src = "texture_default.jpg";
defaultTexture.addEventListener("load", () => {
    texRegionController.setTextureFile(defaultTexture);
});

const loadTextureButton = document.getElementById(
    "load-texture-button",
) as HTMLButtonElement;

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";

loadTextureButton.addEventListener("click", () => {
    fileInput.click();
});
fileInput.addEventListener("change", () => {
    const file = fileInput.files?.item(0);
    if (file) {
        texRegionController.setTextureFile(file);
    }
});
