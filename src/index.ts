import { CameraController } from "./camera_controller";
import { GroupSelectController } from "./group_select_controller";
import { PopupController } from "./popup_controller";
import { Renderer } from "./renderer";
import { TexRegionController } from "./tex_region_controller";
import { WallpaperGroup, type WallpaperGroupKind } from "./wallpaper_group";

// Set up output canvas

const outputCanvasDiv = document.getElementById(
    "output-canvas-div",
) as HTMLElement;
const outputCanvas = document.getElementById(
    "output-canvas",
) as HTMLCanvasElement;

// Set up camera

const cameraController = new CameraController(outputCanvas);

// Set up tex region controller

const TEX_REGION_WIDTH_RATIO = 0.5;
const TEX_REGION_HEIGHT_RATIO = 0.6;
const TEX_REGION_SIZE_MIN = 128.0;
const TEX_REGION_SIZE_MAX = 512.0;

const texRegionCanvas = document.getElementById(
    "tex-region-canvas",
) as HTMLCanvasElement;

const texRegionController = new TexRegionController(texRegionCanvas);

// Set up renderers

const offscreenCanvas = new OffscreenCanvas(0, 0);

let rendererMain: Renderer | null = null;
let rendererOffscreen: Renderer | null = null;

const glMain = outputCanvas.getContext("webgl2");
const glOffscreen = offscreenCanvas.getContext("webgl2");

if (glMain === null || glOffscreen === null) {
    alert(
        "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
} else {
    rendererMain = Renderer.init(
        glMain,
        texRegionController.texRegion,
        cameraController.camera,
    );
    rendererOffscreen = Renderer.init(
        glOffscreen,
        texRegionController.texRegion,
        cameraController.camera,
    );

    texRegionController.onSetTextureBitmap = (bitmap) => {
        rendererMain?.loadTexture(bitmap);
        rendererOffscreen?.loadTexture(bitmap);
    };

    rendererMain?.startRenderLoop();
}

// Resize canvases based on the container's size

const resizeOutputCanvas = () => {
    const texRegionSize = Math.max(
        TEX_REGION_SIZE_MIN,
        Math.min(
            TEX_REGION_SIZE_MAX,
            TEX_REGION_WIDTH_RATIO * outputCanvasDiv.offsetWidth,
            TEX_REGION_HEIGHT_RATIO * outputCanvasDiv.offsetHeight,
        ),
    );
    texRegionCanvas.width = texRegionSize;
    texRegionCanvas.height = texRegionSize;

    outputCanvas.width = outputCanvasDiv.offsetWidth;
    outputCanvas.height = outputCanvasDiv.offsetHeight;
    glMain?.viewport(0, 0, outputCanvas.width, outputCanvas.height);
};

resizeOutputCanvas();
window.addEventListener("load", resizeOutputCanvas);
window.addEventListener("resize", resizeOutputCanvas);

// Set up group selection

const groupSelect = document.getElementById(
    "group-select",
) as HTMLSelectElement;
const groupSelectPrev = document.getElementById(
    "group-select-prev",
) as HTMLElement;
const groupSelectNext = document.getElementById(
    "group-select-next",
) as HTMLElement;

const groupSelectController = new GroupSelectController(
    groupSelect,
    groupSelectPrev,
    groupSelectNext,
);
groupSelectController.onChange = () => {};

const onGroupChanged = (groupKind: WallpaperGroupKind) => {
    const group = new WallpaperGroup(groupKind);
    texRegionController.setGroup(group);
    rendererMain?.setGroup(group);
    rendererOffscreen?.setGroup(group);
};

onGroupChanged("p1");
groupSelectController.onChange = onGroupChanged;

// Set up texture loading

const DEFAULT_TEXTURE_PATH = "texture_default.jpg";

const defaultTexture = new Image();
defaultTexture.src = DEFAULT_TEXTURE_PATH;
defaultTexture.addEventListener("load", () => {
    texRegionController.setTextureFile(defaultTexture);
});

const loadTextureButton = document.getElementById(
    "load-texture-button",
) as HTMLButtonElement;

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";

let currentTextureName = DEFAULT_TEXTURE_PATH;

loadTextureButton.addEventListener("click", () => {
    fileInput.click();
});
fileInput.addEventListener("change", () => {
    const file = fileInput.files?.item(0);
    if (file) {
        currentTextureName = file.name;
        texRegionController.setTextureFile(file);
    }
});

// Set up output saving

const SAVE_OUTPUT_OPEN_CLASS = "open";

const saveOutputButton = document.getElementById(
    "save-output-button",
) as HTMLButtonElement;
const saveOutputCollapsible = document.getElementById(
    "save-output-collapsible",
) as HTMLElement;

const openSaveOutputCollapsible = () => {
    saveOutputCollapsible.classList.add(SAVE_OUTPUT_OPEN_CLASS);
    saveOutputButton.classList.add(SAVE_OUTPUT_OPEN_CLASS);
};

const closeSaveOutputCollapsible = () => {
    saveOutputCollapsible.classList.remove(SAVE_OUTPUT_OPEN_CLASS);
    setTimeout(() => {
        saveOutputButton.classList.remove(SAVE_OUTPUT_OPEN_CLASS);
    }, 300);
};

const saveOutputWidth = document.getElementById(
    "save-output-width",
) as HTMLInputElement;
const saveOutputHeight = document.getElementById(
    "save-output-height",
) as HTMLInputElement;
const saveOutputDownloadBtn = document.getElementById(
    "save-output-download",
) as HTMLElement;
const saveOutputCancelBtn = document.getElementById(
    "save-output-cancel",
) as HTMLElement;

saveOutputWidth.value = screen.width.toString();
saveOutputHeight.value = screen.height.toString();

saveOutputButton.addEventListener("click", openSaveOutputCollapsible);
saveOutputCancelBtn.addEventListener("click", closeSaveOutputCollapsible);
saveOutputDownloadBtn.addEventListener("click", () => {
    const whole = (x: number) => Math.trunc(Math.abs(x));
    const width = whole(Number(saveOutputWidth.value) || screen.width);
    const height = whole(Number(saveOutputHeight.value) || screen.height);

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    glOffscreen?.viewport(0, 0, width, height);

    rendererOffscreen?.renderOnce();

    const downloadFileName =
        currentTextureName.split(".")[0] +
        "_" +
        groupSelect.value +
        "_" +
        width +
        "x" +
        height +
        ".png";

    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("download", downloadFileName);
    offscreenCanvas.convertToBlob().then((blob) => {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute("href", url);
        downloadLink.click();
    });

    closeSaveOutputCollapsible();
});

// Set up popups

const aboutPopup = {
    openButton: document.getElementById("about-popup-open") as HTMLElement,
    body: document.getElementById("about-popup") as HTMLElement,
};
const controlsPopup = {
    openButton: document.getElementById("controls-popup-open") as HTMLElement,
    body: document.getElementById("controls-popup") as HTMLElement,
};
const closeBtns = Array.from(
    document.getElementsByClassName("popup-close-btn"),
).concat(Array.from(document.getElementsByClassName("popup-background")));

const popupController = new PopupController(
    [aboutPopup, controlsPopup],
    closeBtns,
);

const LOCAL_STORAGE_KEY_HAS_CLOSED = "hasClosed";
if (localStorage.getItem(LOCAL_STORAGE_KEY_HAS_CLOSED) === null) {
    popupController.open(aboutPopup.openButton);
    popupController.onClose = () => {
        localStorage.setItem(LOCAL_STORAGE_KEY_HAS_CLOSED, "true");
    };
}
