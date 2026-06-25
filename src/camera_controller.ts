import type { vec2 } from "gl-matrix";
import { Camera } from "./camera";

type TransformModeNone = { kind: null };

type TransformModeTranslate = {
    kind: "TRANSLATE";
    mouseWorldStart: vec2;
    positionStart: vec2;
};

type TransformModeRotate = {
    kind: "ROTATE";
    mouseWorldStart: vec2;
    rotationStart: number;
};

type TransformMode =
    | TransformModeNone
    | TransformModeTranslate
    | TransformModeRotate;

class CameraController {
    camera: Camera;
    private mode: TransformMode = { kind: null };

    constructor(viewport: HTMLElement) {
        this.camera = new Camera(viewport);

        viewport.addEventListener("wheel", (e) => this.onMouseWheel(e), {
            passive: false,
        });
        viewport.addEventListener("mousedown", (e) => this.onMouseDown(e));
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    }

    private onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        // TODO
    }

    private onMouseDown(event: MouseEvent) {
        // TODO
    }

    private onMouseMove(event: MouseEvent) {
        this.camera.viewport.style.cursor = this.getCursorStyle(event);
        // TODO
    }

    private onMouseUp(event: MouseEvent) {
        // TODO
    }

    private getCursorStyle(event: MouseEvent): string {
        if (event.buttons & 1 && this.mode.kind !== null) {
            return "grabbing";
        }

        return "auto";
    }
}

export { CameraController };
