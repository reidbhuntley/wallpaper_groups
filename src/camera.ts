import { mat3, vec2 } from "gl-matrix";

class Camera {
    canvas: HTMLCanvasElement;
    position: vec2 = vec2.fromValues(0.0, 0.0);
    rotation: number = 0.0;
    scale: number = 1.0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    getViewportToWorldMat(): mat3 {
        const scaleInv = 1.0 / this.scale;

        const elem = this.canvas.getBoundingClientRect();
        const centerAdjust = vec2.fromValues(
            -elem.width * 0.5,
            -elem.height * 0.5,
        );

        // transformations will get applied in reverse order
        const out = mat3.create();

        // view to world space
        mat3.translate(out, out, this.position);
        mat3.rotate(out, out, this.rotation);
        mat3.scale(out, out, vec2.fromValues(scaleInv, scaleInv));

        // viewport to view space
        mat3.scale(out, out, vec2.fromValues(1.0, -1.0));
        mat3.translate(out, out, centerAdjust);
        mat3.translate(out, out, vec2.fromValues(-elem.x, -elem.y));

        return out;
    }

    getWorldToClipMat(): mat3 {
        const canvasRect = this.canvas.getBoundingClientRect();
        const clipScale = vec2.fromValues(
            2.0 / canvasRect.width,
            2.0 / canvasRect.height,
        );

        const positionNeg = vec2.create();
        vec2.scale(positionNeg, this.position, -1.0);

        // transformations will get applied in reverse order
        const out = mat3.create();

        // view to clip space
        mat3.scale(out, out, clipScale);

        // world to view space
        mat3.scale(out, out, vec2.fromValues(this.scale, this.scale));
        mat3.rotate(out, out, -this.rotation);
        mat3.translate(out, out, positionNeg);

        return out;
    }
}

export { Camera };
