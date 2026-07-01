import { mat3, vec2, vec3 } from "gl-matrix";
import { TexRegion } from "./tex_region";
import { WallpaperGroup } from "./wallpaper_group";
import { Drag } from "./drag";

type TransformModeNone = { kind: null };

type TransformModeTranslate = {
    kind: "TRANSLATE";
    mouseTexStart: vec2;
    translationStart: vec2;
};

type TransformModeGrow = {
    kind: "GROW";
    mouseExtentStart: vec2;
    lengthStart: number;
    edge: "LEFT" | "BOTTOM" | "RIGHT" | "TOP";
};

type TransformModeRotate = {
    kind: "ROTATE";
    mouseTexStart: vec2;
    rotationStart: number;
};

type TransformModeShear = {
    kind: "SHEAR";
    corner: "LB" | "RB" | "RT" | "LT";
};

type TransformMode =
    | TransformModeNone
    | TransformModeTranslate
    | TransformModeGrow
    | TransformModeRotate
    | TransformModeShear;

type DragTarget =
    | null
    | "LEFT"
    | "BOTTOM"
    | "RIGHT"
    | "TOP"
    | "LB"
    | "RB"
    | "RT"
    | "LT"
    | "INSIDE";

const EDGE_RADIUS = 11.0;
const CORNER_RADIUS = 15.0;

class TexRegionController {
    canvas: HTMLCanvasElement;
    texRegion: TexRegion = new TexRegion();
    onSetTextureBitmap: ((texture: ImageBitmap) => void) | null = null;
    private group: WallpaperGroup = new WallpaperGroup("p1");
    private mode: TransformMode = { kind: null };
    private texture: ImageBitmap | null = null;

    private widthDesired: number;
    private heightDesired: number;
    private shearDesired: number;

    constructor(canvas: HTMLCanvasElement) {
        this.widthDesired = this.texRegion.getWidth();
        this.heightDesired = this.texRegion.getHeight();
        this.shearDesired = this.texRegion.getShearFactor();
        this.setGroup(this.group);

        this.canvas = canvas;

        const onEvent = (e: MouseEvent | TouchEvent) => {
            this.onDragEvent(Drag.createEvent(e));
        };
        canvas.addEventListener("mousedown", onEvent);
        window.addEventListener("mousemove", onEvent);
        window.addEventListener("mouseup", onEvent);
        canvas.addEventListener("touchstart", onEvent);
        window.addEventListener("touchmove", onEvent, { passive: false });
        window.addEventListener("touchend", onEvent);
        requestAnimationFrame(() => this.render());
    }

    getGroup(): WallpaperGroup {
        return this.group;
    }

    setGroup(group: WallpaperGroup) {
        this.group = group;
        const pattern = group.getPattern();
        if (!pattern.canShear) {
            this.texRegion.setShearFactor(0.0);
        } else {
            this.texRegion.setShearFactor(this.shearDesired);
        }
        if (pattern.fixedAspectRatio === null) {
            this.texRegion.setSizeFixedAspectRatio(
                this.widthDesired,
                this.heightDesired,
            );
        } else {
            this.texRegion.setSizeFixedAspectRatio(
                this.widthDesired,
                this.widthDesired / pattern.fixedAspectRatio,
            );
        }
    }

    getScaleFactor(): number {
        const elem = this.canvas.getBoundingClientRect();
        return Math.max(elem.width, elem.height);
    }

    getViewportToTexCoordMat(): mat3 {
        const elem = this.canvas.getBoundingClientRect();
        const scaleFactorInv = 1.0 / this.getScaleFactor();

        const out = mat3.create();
        mat3.translate(out, out, vec2.fromValues(0.0, 1.0));
        mat3.scale(out, out, vec2.fromValues(scaleFactorInv, -scaleFactorInv));
        mat3.translate(out, out, vec2.fromValues(-elem.x, -elem.y));
        return out;
    }

    getTexCoordToCanvasMat(): mat3 {
        const scaleFactor = this.getScaleFactor();

        const out = mat3.create();
        mat3.scale(out, out, vec2.fromValues(scaleFactor, -scaleFactor));
        mat3.translate(out, out, vec2.fromValues(0.0, -1.0));
        return out;
    }

    dragToTexCoords(drag: Drag.Pos): vec2 {
        const mat = this.getViewportToTexCoordMat();
        return transformDragCoords(drag, mat);
    }

    dragToShearedExtentCoords(drag: Drag.Pos): vec2 {
        const mat = this.texRegion.getTexCoordToShearedExtentMat();
        mat3.multiply(mat, mat, this.getViewportToTexCoordMat());
        return transformDragCoords(drag, mat);
    }

    dragToExtentCoords(drag: Drag.Pos): vec2 {
        const mat = this.texRegion.getTexCoordToExtentMat();
        mat3.multiply(mat, mat, this.getViewportToTexCoordMat());
        return transformDragCoords(drag, mat);
    }

    dragExtentCoordsToTarget(dragCoords: vec2): DragTarget {
        const scaleFactor = this.getScaleFactor();
        const cornerRadius = CORNER_RADIUS / scaleFactor;

        const [extentLB, extentRT] = this.texRegion.getExtents();
        const corners = this.texRegion.getCorners();
        for (const [cornerName, corner] of corners) {
            if (vec2.dist(corner, dragCoords) <= cornerRadius) {
                return cornerName;
            }
        }

        const isInsideX =
            dragCoords[0] >= extentLB[0] && dragCoords[0] <= extentRT[0];
        const isInsideY =
            dragCoords[1] >= extentLB[1] && dragCoords[1] <= extentRT[1];

        const edgeRadius = EDGE_RADIUS / scaleFactor;

        if (isInsideY) {
            if (Math.abs(dragCoords[0] - extentLB[0]) <= edgeRadius) {
                return "LEFT";
            }
            if (Math.abs(dragCoords[0] - extentRT[0]) <= edgeRadius) {
                return "RIGHT";
            }
        }
        if (isInsideX) {
            if (Math.abs(dragCoords[1] - extentLB[1]) <= edgeRadius) {
                return "BOTTOM";
            }
            if (Math.abs(dragCoords[1] - extentRT[1]) <= edgeRadius) {
                return "TOP";
            }
        }

        if (isInsideX && isInsideY) {
            return "INSIDE";
        }

        return null;
    }

    private onDragEvent(event: Drag.Event) {
        const eventType = event.parent.type;
        const isStartEvent = ["mousedown", "touchstart"].includes(eventType);

        if (event.drags.length !== 1) {
            this.mode = { kind: null };
        } else if (isStartEvent) {
            const drag = event.drags[0] as Drag.Pos;
            const dragExtent = this.dragToExtentCoords(drag);
            const target = this.dragExtentCoordsToTarget(dragExtent);

            this.mode = (() => {
                switch (target) {
                    case null:
                        return { kind: null };
                    case "INSIDE":
                        return {
                            kind: "TRANSLATE",
                            mouseTexStart: this.dragToTexCoords(drag),
                            translationStart: this.texRegion.getTranslation(),
                        };
                    case "LEFT":
                    case "RIGHT":
                        return {
                            kind: "GROW",
                            mouseExtentStart: dragExtent,
                            lengthStart: this.texRegion.getWidth(),
                            edge: target,
                        };
                    case "BOTTOM":
                    case "TOP":
                        return {
                            kind: "GROW",
                            mouseExtentStart: dragExtent,
                            lengthStart: this.texRegion.getHeight(),
                            edge: target,
                        };
                    case "LB":
                    case "LT":
                    case "RB":
                    case "RT":
                        if (event.parent.altKey) {
                            this.texRegion.normalize();
                            return {
                                kind: "SHEAR",
                                corner: target,
                            };
                        } else {
                            this.texRegion.normalize();
                            return {
                                kind: "ROTATE",
                                mouseTexStart: this.dragToTexCoords(drag),
                                rotationStart: this.texRegion.getRotation(),
                            };
                        }
                }
            })();
        }

        switch (this.mode.kind) {
            case null:
                break;
            case "TRANSLATE":
                this.onTranslate(event, this.mode);
                break;
            case "GROW":
                this.onGrow(event, this.mode);
                break;
            case "ROTATE":
                this.onRotate(event, this.mode);
                break;
            case "SHEAR":
                this.onShear(event, this.mode);
                break;
        }

        if (isStartEvent || this.mode.kind !== null) {
            event.parent.preventDefault();
        }

        let mouseTarget: DragTarget = null;
        if (event.parent instanceof MouseEvent) {
            const mouseExtent = this.dragToExtentCoords({
                touchId: null,
                clientX: event.parent.clientX,
                clientY: event.parent.clientY,
            });
            mouseTarget = this.dragExtentCoordsToTarget(mouseExtent);
        }
        this.canvas.style.cursor = this.getCursorStyle(mouseTarget);
    }

    private onTranslate(event: Drag.Event, mode: TransformModeTranslate) {
        const drag = event.drags[0] as Drag.Pos;
        const out = this.dragToTexCoords(drag);
        vec2.sub(out, out, mode.mouseTexStart);
        vec2.add(out, out, mode.translationStart);
        this.texRegion.setTranslation(out);
    }

    private onGrow(event: Drag.Event, mode: TransformModeGrow) {
        const drag = event.drags[0] as Drag.Pos;
        const mousePos = this.dragToExtentCoords(drag);
        const lengthDelta = (() => {
            switch (mode.edge) {
                case "LEFT":
                    return mode.mouseExtentStart[0] - mousePos[0];
                case "BOTTOM":
                    return mode.mouseExtentStart[1] - mousePos[1];
                case "RIGHT":
                    return mousePos[0] - mode.mouseExtentStart[0];
                case "TOP":
                    return mousePos[1] - mode.mouseExtentStart[1];
            }
        })();

        const aspectRatio = this.group.getPattern().fixedAspectRatio;
        if (aspectRatio === null) {
            // non-uniform scaling
            let length = mode.lengthStart + lengthDelta;
            switch (mode.edge) {
                case "LEFT":
                case "RIGHT":
                    if (event.parent.ctrlKey) {
                        length = this.texRegion.getHeight();
                    }
                    this.texRegion.setWidth(length, mode.edge);
                    break;
                case "BOTTOM":
                case "TOP":
                    if (event.parent.ctrlKey) {
                        length = this.texRegion.getWidth();
                    }
                    this.texRegion.setHeight(length, mode.edge);
                    break;
            }
        } else {
            // uniform scaling
            const length = mode.lengthStart + lengthDelta * 2;
            const [width, height] = (() => {
                switch (mode.edge) {
                    case "LEFT":
                    case "RIGHT":
                        return [length, length / aspectRatio];
                    case "BOTTOM":
                    case "TOP":
                        return [length * aspectRatio, length];
                }
            })();
            this.texRegion.setSizeFixedAspectRatio(width, height);
        }

        this.widthDesired = this.texRegion.getWidth();
        this.heightDesired = this.texRegion.getHeight();
    }

    private onRotate(event: Drag.Event, mode: TransformModeRotate) {
        const drag = event.drags[0] as Drag.Pos;
        const mouseTexStart = vec2.clone(mode.mouseTexStart);
        const mouseTex = this.dragToTexCoords(drag);

        const centerTex = this.texRegion.getExtentCenterTexCoord();
        vec2.sub(mouseTexStart, mouseTexStart, centerTex);
        vec2.sub(mouseTex, mouseTex, centerTex);

        const rotationDelta = vec2.signedAngle(mouseTexStart, mouseTex);
        let rotationNew = mode.rotationStart + rotationDelta;

        if (event.parent.ctrlKey) {
            rotationNew /= Math.PI / 12;
            rotationNew = Math.round(rotationNew);
            rotationNew *= Math.PI / 12;
        }

        this.texRegion.setRotation(rotationNew);
    }

    private onShear(event: Drag.Event, mode: TransformModeShear) {
        if (!this.group.getPattern().canShear) {
            return;
        }

        const drag = event.drags[0] as Drag.Pos;
        const mousePos = this.dragToShearedExtentCoords(drag);
        const extents = this.texRegion.getExtents();
        const [referenceExtent, sign] = (() => {
            switch (mode.corner) {
                case "LB":
                    return [extents[0], -1];
                case "LT":
                    return [extents[0], 1];
                case "RB":
                    return [extents[1], -1];
                case "RT":
                    return [extents[1], 1];
            }
        })();

        const deltaX = (mousePos[0] - referenceExtent[0]) * sign * 2;
        const deltaY = this.texRegion.getHeight();
        this.texRegion.setShearFactor(deltaX / deltaY);
        this.shearDesired = this.texRegion.getShearFactor();
    }

    setTextureFile(file: ImageBitmapSource) {
        createImageBitmap(file).then((bitmap) => {
            this.texture = bitmap;
            if (this.onSetTextureBitmap !== null) {
                this.onSetTextureBitmap(bitmap);
            }
        });
    }

    private getCursorStyle(target: DragTarget): string {
        if (this.mode.kind !== null) {
            return "grabbing";
        }

        switch (target) {
            case null:
            case "INSIDE":
                return "auto";
            case "LEFT":
            case "BOTTOM":
            case "RIGHT":
            case "TOP":
                return "grab";
            case "LB":
            case "RB":
            case "RT":
            case "LT":
                return "pointer";
        }
    }

    private render() {
        const canvas = this.canvas;
        const ctx = canvas.getContext("2d");
        if (ctx === null) {
            requestAnimationFrame(() => this.render());
            return;
        }

        const texToCanvas = this.getTexCoordToCanvasMat();
        const extentToTex = this.texRegion.getExtentToTexCoordMat();
        const patToExtent = this.texRegion.getPatternToExtentMat();

        const patToCanvas = mat3.clone(texToCanvas);
        mat3.multiply(patToCanvas, patToCanvas, extentToTex);
        mat3.multiply(patToCanvas, patToCanvas, patToExtent);

        const cornersPat: [number, number][] = [
            [0.0, 0.0],
            [1.0, 0.0],
            [1.0, 1.0],
            [0.0, 1.0],
        ];
        const corners = cornersPat.map((v) => {
            const out = vec3.fromValues(v[0], v[1], 1.0);
            vec3.transformMat3(out, out, patToCanvas);
            return out;
        });

        const patternVerts = this.group.getPattern().vertices.map((v) => {
            const out = vec3.fromValues(v[0], v[1], 1.0);
            vec3.transformMat3(out, out, patToCanvas);
            return out;
        });

        const tracePath = (path: vec2[]) => {
            if (path.length === 0) {
                return;
            }
            const first = path[0] as vec2;

            ctx.beginPath();
            ctx.moveTo(first[0], first[1]);
            for (const point of path.slice(1)) {
                ctx.lineTo(point[0], point[1]);
            }
            ctx.closePath();
        };

        // show checkerboard pattern behind transparent images
        renderCheckerboard(canvas, ctx);

        if (this.texture) {
            // crop texture to square
            const texSize = Math.max(this.texture.width, this.texture.height);
            const texWidth = (this.texture.width / texSize) * canvas.width;
            const texHeight = (this.texture.height / texSize) * canvas.height;
            ctx.drawImage(
                this.texture,
                (canvas.width - texWidth) * 0.5,
                (canvas.height - texHeight) * 0.5,
                texWidth,
                texHeight,
            );
        }

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = "grey";
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        tracePath(patternVerts);
        ctx.fill();
        tracePath(patternVerts);
        ctx.stroke();

        ctx.lineWidth = 3.0;
        ctx.strokeStyle = "lightgrey";
        ctx.setLineDash([10.0, 10.0]);
        tracePath(corners);
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "lightgrey";
        ctx.setLineDash([]);
        const rad = CORNER_RADIUS * 0.3;
        for (const corner of corners) {
            ctx.beginPath();
            ctx.ellipse(corner[0], corner[1], rad, rad, 0, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(corner[0], corner[1], rad, rad, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }

        requestAnimationFrame(() => this.render());
    }
}

function transformDragCoords(drag: Drag.Pos, mat: mat3): vec2 {
    const out = vec3.fromValues(drag.clientX, drag.clientY, 1.0);
    vec3.transformMat3(out, out, mat);
    return vec2.fromValues(out[0], out[1]);
}

function renderCheckerboard(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
) {
    const SIZE = 10.0;
    const PRIMARY_COLOR = "#eeeeee";
    const SECONDARY_COLOR = "#dddddd";

    const repeatX = Math.ceil(canvas.width / SIZE);
    const repeatY = Math.ceil(canvas.height / SIZE);

    for (let y = 0; y < repeatY; y++) {
        for (let x = 0; x < repeatX; x++) {
            let posX = x * SIZE;
            let posY = y * SIZE;

            ctx.fillStyle = x % 2 === y % 2 ? PRIMARY_COLOR : SECONDARY_COLOR;
            ctx.fillRect(posX, posY, SIZE, SIZE);
        }
    }
}

export { TexRegionController };
