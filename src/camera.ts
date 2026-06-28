import { mat3, vec2 } from "gl-matrix";

class Camera {
    position: vec2 = vec2.fromValues(0.0, 0.0);
    rotation: number = 0.0;
    scale: number = 512.0;

    getViewportToViewMat(viewport: DOMRect): mat3 {
        const centerAdjust = vec2.fromValues(
            -viewport.width * 0.5,
            -viewport.height * 0.5,
        );

        const out = mat3.create();
        mat3.scale(out, out, vec2.fromValues(1.0, -1.0));
        mat3.translate(out, out, centerAdjust);
        mat3.translate(out, out, vec2.fromValues(-viewport.x, -viewport.y));
        return out;
    }

    getViewToWorldMat(): mat3 {
        const scaleInv = 1.0 / this.scale;

        const out = mat3.create();
        mat3.translate(out, out, this.position);
        mat3.rotate(out, out, this.rotation);
        mat3.scale(out, out, vec2.fromValues(scaleInv, scaleInv));
        return out;
    }

    getWorldToClipMat(viewportWidth: number, viewportHeight: number): mat3 {
        const clipScale = vec2.fromValues(
            2.0 / viewportWidth,
            2.0 / viewportHeight,
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
