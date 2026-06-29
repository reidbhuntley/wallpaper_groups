import { mat3, vec2, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Drag } from "./drag";

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
    viewport: HTMLElement;
    private mode: TransformMode = { kind: null };
    private dragEventPrev: Drag.Event | null = null;

    private zoomLevel: number = 0;
    private cameraScaleStart: number;

    constructor(viewport: HTMLElement) {
        this.viewport = viewport;
        this.camera = new Camera();
        this.cameraScaleStart = this.camera.scale;

        viewport.addEventListener("wheel", (e) => this.onMouseWheel(e), {
            passive: false,
        });

        const onEvent = (e: MouseEvent | TouchEvent) => {
            this.onDragEvent(Drag.createEvent(e));
        };
        viewport.addEventListener("mousedown", onEvent);
        window.addEventListener("mousemove", onEvent);
        window.addEventListener("mouseup", onEvent);
        viewport.addEventListener("touchstart", onEvent);
        window.addEventListener("touchmove", onEvent, { passive: false });
        window.addEventListener("touchend", onEvent);
    }

    dragToViewCoords(drag: Drag.Pos): vec2 {
        const mat = this.camera.getViewportToViewMat(
            this.viewport.getBoundingClientRect(),
        );
        const out = vec3.fromValues(drag.clientX, drag.clientY, 1.0);
        vec3.transformMat3(out, out, mat);
        return vec2.fromValues(out[0], out[1]);
    }

    private onDragEvent(event: Drag.Event) {
        if (event.drags.length === 0) {
            this.mode = { kind: null };
        } else if (
            ["mousedown", "touchstart"].includes(event.parent.type) &&
            event.drags.length === 1
        ) {
            const drag = event.drags[0] as Drag.Pos;

            if (event.parent.shiftKey) {
                this.mode = {
                    kind: "ROTATE",
                    mouseViewStart: this.dragToViewCoords(drag),
                    rotationStart: this.camera.rotation,
                };
            } else {
                this.mode = {
                    kind: "TRANSLATE",
                };
            }
        }

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

        if (this.mode.kind !== null) {
            event.parent.preventDefault();
        }

        this.viewport.style.cursor = this.getCursorStyle();

        this.dragEventPrev = event;
    }

    private onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        this.onZoom(event);
    }

    private onTranslate(event: Drag.Event, _mode: TransformModeTranslate) {
        if (event.parent.ctrlKey) {
            this.camera.position = vec2.fromValues(0.0, 0.0);
            return;
        }

        const viewportToWorld = this.camera.getViewToWorldMat();
        mat3.multiply(
            viewportToWorld,
            viewportToWorld,
            this.camera.getViewportToViewMat(
                this.viewport.getBoundingClientRect(),
            ),
        );

        const movement = Drag.getChanges(
            event,
            this.dragEventPrev,
        )[0] as Drag.Movement;

        const delta = vec3.fromValues(
            movement.movementX,
            movement.movementY,
            0.0,
        );
        vec3.transformMat3(delta, delta, viewportToWorld);

        vec2.sub(this.camera.position, this.camera.position, delta);
    }

    private onRotate(event: Drag.Event, mode: TransformModeRotate) {
        const mouseViewStart = vec2.clone(mode.mouseViewStart);
        const mouseView = this.dragToViewCoords(event.drags[0] as Drag.Pos);

        const rotationDelta = vec2.signedAngle(mouseViewStart, mouseView);
        let rotationNew = mode.rotationStart - rotationDelta;

        if (event.parent.ctrlKey) {
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

    private getCursorStyle(): string {
        if (this.mode.kind !== null) {
            return "grabbing";
        }

        return "auto";
    }
}

export { CameraController };
