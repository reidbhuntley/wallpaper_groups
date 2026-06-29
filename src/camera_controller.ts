import { mat3, vec2, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Drag } from "./drag";

const ZOOM_FACTOR = 7.0 / 6.0;
const ZOOM_LEVEL_MIN = -12;
const ZOOM_LEVEL_MAX = 12;

const TWO_PI = Math.PI * 2;

const ROTATION_SNAP_MAX = TWO_PI / 80.0;

type TransformModeNone = { kind: null };

type TransformModeTranslate = {
    kind: "TRANSLATE";
};

type TransformModeRotate = {
    kind: "ROTATE";
    mouseViewStart: vec2;
    rotationStart: number;
};

type TransformModePinch = {
    kind: "PINCH";
    dragsStart: [Drag.Pos, Drag.Pos];
    rotationStart: number;
    scaleStart: number;
};

type TransformMode =
    | TransformModeNone
    | TransformModeTranslate
    | TransformModeRotate
    | TransformModePinch;

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
        const eventType = event.parent.type;
        const isStartEvent = ["mousedown", "touchstart"].includes(eventType);
        const isEndEvent = ["mouseup", "touchend"].includes(eventType);

        if (
            (isStartEvent || isEndEvent) &&
            event.drags.length !== this.dragEventPrev?.drags?.length
        ) {
            switch (event.drags.length) {
                case 1:
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
                    break;
                case 2:
                    const drag0 = event.drags[0] as Drag.Pos;
                    const drag1 = event.drags[1] as Drag.Pos;
                    this.mode = {
                        kind: "PINCH",
                        dragsStart: [drag0, drag1],
                        rotationStart: this.camera.rotation,
                        scaleStart: this.camera.scale,
                    };
                    break;
                default:
                    this.mode = { kind: null };
                    break;
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
            case "PINCH":
                this.onPinch(event, this.mode);
                break;
        }

        if (isStartEvent || this.mode.kind !== null) {
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
            rotationNew = snapAngle(rotationNew);
        }

        this.setRotation(rotationNew);
    }

    private onPinch(event: Drag.Event, mode: TransformModePinch) {
        const dragsCur = event.drags as [Drag.Pos, Drag.Pos];
        const dragsStart: [Drag.Pos, Drag.Pos] =
            dragsCur[0].touchId === mode.dragsStart[0].touchId
                ? mode.dragsStart
                : [mode.dragsStart[1], mode.dragsStart[0]];

        const vecCur = vec2.fromValues(
            dragsCur[1].clientX - dragsCur[0].clientX,
            dragsCur[1].clientY - dragsCur[0].clientY,
        );
        const vecStart = vec2.fromValues(
            dragsStart[1].clientX - dragsStart[0].clientX,
            dragsStart[1].clientY - dragsStart[0].clientY,
        );

        const rotationDelta = vec2.signedAngle(vecStart, vecCur);
        const rotationNew = mode.rotationStart + rotationDelta;
        this.setRotation(rotationNew);

        const camRotNew = this.camera.rotation;
        if (
            Math.min(Math.abs(camRotNew), Math.abs(TWO_PI - camRotNew)) <
            ROTATION_SNAP_MAX
        ) {
            this.setRotation(0);
        }

        const scaleMin = this.getZoomScale(ZOOM_LEVEL_MIN);
        const scaleMax = this.getZoomScale(ZOOM_LEVEL_MAX);
        const scaleNew =
            mode.scaleStart * (vec2.len(vecCur) / vec2.len(vecStart));
        this.camera.scale = Math.max(scaleMin, Math.min(scaleMax, scaleNew));
    }

    private onZoom(event: WheelEvent) {
        this.zoomLevel += -Math.sign(event.deltaY);
        this.zoomLevel = Math.min(
            Math.max(this.zoomLevel, ZOOM_LEVEL_MIN),
            ZOOM_LEVEL_MAX,
        );

        this.camera.scale = this.getZoomScale(this.zoomLevel);
    }

    private getZoomScale(level: number): number {
        return this.cameraScaleStart * Math.pow(ZOOM_FACTOR, level);
    }

    private setRotation(rotation: number) {
        while (rotation < 0) {
            rotation += TWO_PI;
        }
        while (rotation >= TWO_PI) {
            rotation -= TWO_PI;
        }
        this.camera.rotation = rotation;
    }

    private getCursorStyle(): string {
        if (this.mode.kind !== null) {
            return "grabbing";
        }

        return "auto";
    }
}

const ANGLE_SNAP_INTERVAL = Math.PI / 12;
function snapAngle(angle: number): number {
    return Math.round(angle / ANGLE_SNAP_INTERVAL) * ANGLE_SNAP_INTERVAL;
}

export { CameraController };
