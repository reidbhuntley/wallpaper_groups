import { mat3, vec2, vec3 } from "gl-matrix";
import { Camera } from "./camera";

const ZOOM_FACTOR = 7.0 / 6.0;
const ZOOM_LEVEL_MIN = -12;
const ZOOM_LEVEL_MAX = 12;

type TransformModeNone = { kind: null };

type TransformModeTranslate = {
    kind: "TRANSLATE";
};

type TransformModeRotate = {
    kind: "ROTATE";
    mouseViewStart: vec2;
    rotationStart: number;
};

type TransformMode =
    | TransformModeNone
    | TransformModeTranslate
    | TransformModeRotate;

class CameraController {
    camera: Camera;
    private mode: TransformMode = { kind: null };

    private zoomLevel: number = 0;
    private cameraScaleStart: number;

    constructor(viewport: HTMLElement) {
        this.camera = new Camera(viewport);
        this.cameraScaleStart = this.camera.scale;

        viewport.addEventListener("wheel", (e) => this.onMouseWheel(e), {
            passive: false,
        });
        viewport.addEventListener("mousedown", (e) => this.onMouseDown(e));
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    }

    mouseEventToViewCoords(event: MouseEvent): vec2 {
        const mat = this.camera.getViewportToViewMat();
        const out = vec3.fromValues(event.clientX, event.clientY, 1.0);
        vec3.transformMat3(out, out, mat);
        return vec2.fromValues(out[0], out[1]);
    }

    private onMouseDown(event: MouseEvent) {
        event.preventDefault();

        if (event.shiftKey) {
            this.mode = {
                kind: "ROTATE",
                mouseViewStart: this.mouseEventToViewCoords(event),
                rotationStart: this.camera.rotation,
            };
        } else {
            this.mode = {
                kind: "TRANSLATE",
            };
        }
    }

    private onMouseUp(event: MouseEvent) {
        this.mode = { kind: null };
    }

    private onMouseMove(event: MouseEvent) {
        switch (this.mode.kind) {
            case null:
                break;
            case "TRANSLATE":
                this.onTranslate(event, this.mode);
                break;
            case "ROTATE":
                this.onRotate(event, this.mode);
                break;
        }

        this.camera.viewport.style.cursor = this.getCursorStyle(event);
    }

    private onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        this.onZoom(event);
    }

    private onTranslate(event: MouseEvent, _mode: TransformModeTranslate) {
        if (event.ctrlKey) {
            this.camera.position = vec2.fromValues(0.0, 0.0);
            return;
        }

        const viewportToWorld = this.camera.getViewToWorldMat();
        mat3.multiply(
            viewportToWorld,
            viewportToWorld,
            this.camera.getViewportToViewMat(),
        );

        const delta = vec3.fromValues(event.movementX, event.movementY, 0.0);
        vec3.transformMat3(delta, delta, viewportToWorld);

        vec2.sub(this.camera.position, this.camera.position, delta);
    }

    private onRotate(event: MouseEvent, mode: TransformModeRotate) {
        const mouseViewStart = vec2.clone(mode.mouseViewStart);
        const mouseView = this.mouseEventToViewCoords(event);

        const rotationDelta = vec2.signedAngle(mouseViewStart, mouseView);
        let rotationNew = mode.rotationStart - rotationDelta;

        if (event.ctrlKey) {
            rotationNew /= Math.PI / 12;
            rotationNew = Math.round(rotationNew);
            rotationNew *= Math.PI / 12;
        }

        this.camera.rotation = rotationNew;
    }

    private onZoom(event: WheelEvent) {
        this.zoomLevel += -Math.sign(event.deltaY);
        this.zoomLevel = Math.min(
            Math.max(this.zoomLevel, ZOOM_LEVEL_MIN),
            ZOOM_LEVEL_MAX,
        );

        this.camera.scale =
            this.cameraScaleStart * Math.pow(ZOOM_FACTOR, this.zoomLevel);
    }

    private getCursorStyle(event: MouseEvent): string {
        if (event.buttons & 1 && this.mode.kind !== null) {
            return "grabbing";
        }

        return "auto";
    }
}

export { CameraController };
