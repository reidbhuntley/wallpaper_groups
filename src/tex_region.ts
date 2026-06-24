import { mat3, vec2, vec3 } from "gl-matrix";
import { mat3Shear } from "./shear";

const TWO_PI = Math.PI * 2;

const WIDTH_MIN = 0.1;
const WIDTH_MAX = 1.0;
const HEIGHT_MIN = 0.1;
const HEIGHT_MAX = 1.0;
const SHEAR_ABS_MIN = 0.1;
const SHEAR_ABS_MAX = 2.0;

class TexRegion {
    private extentLB: vec2 = vec2.fromValues(-0.25, -0.25);
    private extentRT: vec2 = vec2.fromValues(0.25, 0.25);
    private shearFactor: number = 0.0;
    private rotation: number = 0.0;
    private translation: vec2 = vec2.fromValues(0.5, 0.5);

    getWidth(): number {
        return this.extentRT[0] - this.extentLB[0];
    }

    getHeight(): number {
        return this.extentRT[1] - this.extentLB[1];
    }

    getExtentCenter(): vec2 {
        const out = vec2.create();
        vec2.add(out, this.extentLB, this.extentRT);
        vec2.scale(out, out, 0.5);
        return out;
    }

    getExtentCenterTexCoord(): vec2 {
        const transform = this.getExtentToTexCoordMat();
        const extentCenter = this.getExtentCenter();
        const extentCenterTex = vec3.fromValues(
            extentCenter[0],
            extentCenter[1],
            1.0,
        );
        vec3.transformMat3(extentCenterTex, extentCenterTex, transform);
        return vec2.fromValues(extentCenterTex[0], extentCenterTex[1]);
    }

    /**
     * Moves the extent center to the origin in extent space
     * while keeping positions in texcoord space fixed
     */
    normalize() {
        const eventCenterTex = this.getExtentCenterTexCoord();
        const hwidth = this.getWidth() * 0.5;
        const hheight = this.getHeight() * 0.5;
        this.extentLB = vec2.fromValues(-hwidth, -hheight);
        this.extentRT = vec2.fromValues(hwidth, hheight);
        this.translation = eventCenterTex;
    }

    getPatternToExtentMat(): mat3 {
        const width = this.getWidth();
        const height = this.getHeight();

        const out = mat3.create();
        mat3.translate(out, out, this.extentLB);
        mat3.scale(out, out, vec2.fromValues(width, height));
        return out;
    }

    getExtentToTexCoordMat(): mat3 {
        const out = mat3.create();
        mat3.translate(out, out, this.translation);
        mat3.rotate(out, out, this.rotation);
        mat3Shear(out, out, this.shearFactor);
        return out;
    }

    getTexCoordToShearedExtentMat(): mat3 {
        const translationNeg = vec2.create();
        vec2.scale(translationNeg, this.translation, -1.0);

        const out = mat3.create();
        mat3.rotate(out, out, -this.rotation);
        mat3.translate(out, out, translationNeg);
        return out;
    }

    getTexCoordToExtentMat(): mat3 {
        const translationNeg = vec2.create();
        vec2.scale(translationNeg, this.translation, -1.0);

        const out = mat3.create();
        mat3Shear(out, out, -this.shearFactor);
        mat3.rotate(out, out, -this.rotation);
        mat3.translate(out, out, translationNeg);
        return out;
    }

    getExtents(): [vec2, vec2] {
        return [vec2.clone(this.extentLB), vec2.clone(this.extentRT)];
    }

    getCorners(): ["LB" | "RB" | "RT" | "LT", vec2][] {
        return [
            ["LB", vec2.clone(this.extentLB)],
            ["RB", vec2.fromValues(this.extentRT[0], this.extentLB[1])],
            ["RT", vec2.clone(this.extentRT)],
            ["LT", vec2.fromValues(this.extentLB[0], this.extentRT[1])],
        ];
    }

    setWidth(width: number, growFrom: "LEFT" | "RIGHT" | "CENTER") {
        const widthOld = this.getWidth();
        const widthNew = Math.min(Math.max(width, WIDTH_MIN), WIDTH_MAX);
        const widthDiff = widthNew - widthOld;
        switch (growFrom) {
            case "LEFT":
                this.extentLB[0] -= widthDiff;
                break;
            case "RIGHT":
                this.extentRT[0] += widthDiff;
                break;
            case "CENTER":
                const hwidthDiff = widthDiff * 0.5;
                this.extentLB[0] -= hwidthDiff;
                this.extentRT[0] += hwidthDiff;
                break;
        }
    }

    setHeight(height: number, growFrom: "BOTTOM" | "TOP" | "CENTER") {
        const heightOld = this.getHeight();
        const heightNew = Math.min(Math.max(height, HEIGHT_MIN), HEIGHT_MAX);
        const heightDiff = heightNew - heightOld;
        switch (growFrom) {
            case "BOTTOM":
                this.extentLB[1] -= heightDiff;
                break;
            case "TOP":
                this.extentRT[1] += heightDiff;
                break;
            case "CENTER":
                const hheightDiff = heightDiff * 0.5;
                this.extentLB[1] -= hheightDiff;
                this.extentRT[1] += hheightDiff;
                break;
        }
    }

    getShearFactor(): number {
        return this.shearFactor;
    }

    setShearFactor(shearFactor: number) {
        const shearAbs = Math.abs(shearFactor);
        if (shearAbs > SHEAR_ABS_MAX) {
            shearFactor = Math.sign(shearFactor) * SHEAR_ABS_MAX;
        } else if (shearAbs < SHEAR_ABS_MIN) {
            shearFactor = 0.0;
        }
        this.shearFactor = shearFactor;
    }

    getRotation(): number {
        return this.rotation;
    }

    setRotation(rotation: number) {
        while (rotation < 0) {
            rotation += TWO_PI;
        }
        while (rotation >= TWO_PI) {
            rotation -= TWO_PI;
        }
        this.rotation = rotation;
    }

    getTranslation(): vec2 {
        return vec2.clone(this.translation);
    }

    setTranslation(translation: vec2) {
        const delta = vec2.create();
        vec2.sub(delta, translation, this.translation);

        const centerOld = this.getExtentCenterTexCoord();
        const centerNew = vec2.create();
        vec2.add(centerNew, centerOld, delta);

        // clip the change in translation so that the new center point
        // still stays between 0 and 1 in both x and y coords
        let clipFactor = 1.0;

        if (centerNew[0] < 0.0) {
            clipFactor = Math.min(clipFactor, centerOld[0] / delta[0]);
        } else if (centerNew[0] >= 1.0) {
            clipFactor = Math.min(clipFactor, (1.0 - centerOld[0]) / delta[0]);
        }

        if (centerNew[1] < 0.0) {
            clipFactor = Math.min(clipFactor, centerOld[1] / delta[1]);
        } else if (centerNew[1] >= 1.0) {
            clipFactor = Math.min(clipFactor, (1.0 - centerOld[1]) / delta[1]);
        }

        clipFactor = Math.max(clipFactor, 0.0);

        vec2.scaleAndAdd(this.translation, this.translation, delta, clipFactor);
    }
}

export { TexRegion };
