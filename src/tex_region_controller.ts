import { mat3, vec2, vec3 } from "gl-matrix";
import { TexRegion } from "./tex_region";
import { WallpaperGroup } from "./wallpaper_group";

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

type MouseTarget =
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

const EDGE_RADIUS = 1.0 / 48.0;
const CORNER_RADIUS = 1.0 / 48.0;

class TexRegionController {
    canvas: HTMLCanvasElement;
    texRegion: TexRegion = new TexRegion();
    group: WallpaperGroup = new WallpaperGroup("p6");
    mode: TransformMode = { kind: null };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.onMouseUp(e));
        requestAnimationFrame(() => this.render());
    }

    getScaleFactor(): number {
        const elem = this.canvas.getBoundingClientRect();
        return Math.min(elem.width, elem.height);
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

    mouseEventToTexCoords(event: MouseEvent): vec2 {
        const mat = this.getViewportToTexCoordMat();
        return transformMouseCoords(event, mat);
    }

    mouseEventToShearedExtentCoords(event: MouseEvent): vec2 {
        const mat = this.texRegion.getTexCoordToShearedExtentMat();
        mat3.multiply(mat, mat, this.getViewportToTexCoordMat());
        return transformMouseCoords(event, mat);
    }

    mouseEventToExtentCoords(event: MouseEvent): vec2 {
        const mat = this.texRegion.getTexCoordToExtentMat();
        mat3.multiply(mat, mat, this.getViewportToTexCoordMat());
        return transformMouseCoords(event, mat);
    }

    mouseExtentCoordsToTarget(mouseCoords: vec2): MouseTarget {
        const [extentLB, extentRT] = this.texRegion.getExtents();
        const corners = this.texRegion.getCorners();
        for (const [cornerName, corner] of corners) {
            if (vec2.dist(corner, mouseCoords) <= CORNER_RADIUS) {
                return cornerName;
            }
        }

        const isInsideX =
            mouseCoords[0] >= extentLB[0] && mouseCoords[0] <= extentRT[0];
        const isInsideY =
            mouseCoords[1] >= extentLB[1] && mouseCoords[1] <= extentRT[1];

        if (isInsideY) {
            if (Math.abs(mouseCoords[0] - extentLB[0]) <= EDGE_RADIUS) {
                return "LEFT";
            }
            if (Math.abs(mouseCoords[0] - extentRT[0]) <= EDGE_RADIUS) {
                return "RIGHT";
            }
        }
        if (isInsideX) {
            if (Math.abs(mouseCoords[1] - extentLB[1]) <= EDGE_RADIUS) {
                return "BOTTOM";
            }
            if (Math.abs(mouseCoords[1] - extentRT[1]) <= EDGE_RADIUS) {
                return "TOP";
            }
        }

        if (isInsideX && isInsideY) {
            return "INSIDE";
        }

        return null;
    }

    private onMouseDown(event: MouseEvent) {
        const mouseExtent = this.mouseEventToExtentCoords(event);
        const target = this.mouseExtentCoordsToTarget(mouseExtent);

        this.mode = (() => {
            switch (target) {
                case null:
                    return { kind: null };
                case "INSIDE":
                    return {
                        kind: "TRANSLATE",
                        mouseTexStart: this.mouseEventToTexCoords(event),
                        translationStart: this.texRegion.getTranslation(),
                    };
                case "LEFT":
                case "RIGHT":
                    return {
                        kind: "GROW",
                        mouseExtentStart: mouseExtent,
                        lengthStart: this.texRegion.getWidth(),
                        edge: target,
                    };
                case "BOTTOM":
                case "TOP":
                    return {
                        kind: "GROW",
                        mouseExtentStart: mouseExtent,
                        lengthStart: this.texRegion.getHeight(),
                        edge: target,
                    };
                case "LB":
                case "LT":
                case "RB":
                case "RT":
                    if (event.altKey) {
                        this.texRegion.normalize();
                        return {
                            kind: "SHEAR",
                            corner: target,
                        };
                    } else {
                        this.texRegion.normalize();
                        return {
                            kind: "ROTATE",
                            mouseTexStart: this.mouseEventToTexCoords(event),
                            rotationStart: this.texRegion.getRotation(),
                        };
                    }
            }
        })();
    }

    private onMouseUp(_event: MouseEvent) {
        this.mode = { kind: null };
    }

    private onMouseMove(event: MouseEvent) {
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

        this.canvas.style.cursor = this.getCursorStyle(event);
    }

    private onTranslate(event: MouseEvent, mode: TransformModeTranslate) {
        const out = this.mouseEventToTexCoords(event);
        vec2.sub(out, out, mode.mouseTexStart);
        vec2.add(out, out, mode.translationStart);
        this.texRegion.setTranslation(out);
    }

    private onGrow(event: MouseEvent, mode: TransformModeGrow) {
        const mousePos = this.mouseEventToExtentCoords(event);
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
            const length = mode.lengthStart + lengthDelta;
            switch (mode.edge) {
                case "LEFT":
                case "RIGHT":
                    this.texRegion.setWidth(length, mode.edge);
                    break;
                case "BOTTOM":
                case "TOP":
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
    }

    private onRotate(event: MouseEvent, mode: TransformModeRotate) {
        const mouseTexStart = vec2.clone(mode.mouseTexStart);
        const mouseTex = this.mouseEventToTexCoords(event);

        const centerTex = this.texRegion.getExtentCenterTexCoord();
        vec2.sub(mouseTexStart, mouseTexStart, centerTex);
        vec2.sub(mouseTex, mouseTex, centerTex);

        const rotationDelta = vec2.signedAngle(mouseTexStart, mouseTex);
        let rotationNew = mode.rotationStart + rotationDelta;

        if (event.ctrlKey) {
            rotationNew /= Math.PI / 12;
            rotationNew = Math.round(rotationNew);
            rotationNew *= Math.PI / 12;
        }

        this.texRegion.setRotation(rotationNew);
    }

    private onShear(event: MouseEvent, mode: TransformModeShear) {
        if (!this.group.getPattern().canShear) {
            return;
        }

        const mousePos = this.mouseEventToShearedExtentCoords(event);
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
    }

    private getCursorStyle(event: MouseEvent): string {
        if (event.buttons & 1 && this.mode.kind !== null) {
            return "grabbing";
        }

        const mouseExtent = this.mouseEventToExtentCoords(event);
        const target = this.mouseExtentCoordsToTarget(mouseExtent);
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

        const drawPath = (path: vec2[]) => {
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
            ctx.stroke();
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = "grey";
        ctx.setLineDash([]);
        drawPath(patternVerts);

        ctx.lineWidth = 3.0;
        ctx.strokeStyle = "lightgrey";
        ctx.setLineDash([10.0, 10.0]);
        drawPath(corners);

        ctx.fillStyle = "white";
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "lightgrey";
        ctx.setLineDash([]);
        const rad = CORNER_RADIUS * this.getScaleFactor();
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

function transformMouseCoords(event: MouseEvent, mat: mat3): vec2 {
    const out = vec3.fromValues(event.clientX, event.clientY, 1.0);
    vec3.transformMat3(out, out, mat);
    return vec2.fromValues(out[0], out[1]);
}

export { TexRegionController };
