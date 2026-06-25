import { mat3, vec2, vec3 } from "gl-matrix";
import type { Camera } from "./camera";
import type { TexRegion } from "./tex_region";
import type { WallpaperGroup } from "./wallpaper_group";
import { mat3Shear } from "./shear";

const SQRT_3 = Math.sqrt(3);

class Lattice {
    width: number;
    group: WallpaperGroup;
    texRegion: TexRegion;

    constructor(width: number, group: WallpaperGroup, texRegion: TexRegion) {
        this.width = width;
        this.group = group;
        this.texRegion = texRegion;
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        const width = this.getWidth();
        const texRegion = this.texRegion;
        const ratio = () => texRegion.getHeight() / texRegion.getWidth();
        const rhombusHeight = (ratio: number) => {
            return (width * ratio * 2) / (ratio * ratio + 1);
        };

        switch (this.group.getKind()) {
            case "p1":
            case "pmm":
            case "pmg":
                return width * ratio();
            case "p2":
            case "pm":
            case "pg":
            case "pgg":
                return width * ratio() * 2;
            case "p4":
            case "p4m":
            case "p4g":
                return width;
            case "p3":
            case "p3m1":
            case "p31m":
            case "p6":
            case "p6m":
                return width * SQRT_3 * 0.5;
            case "cm":
                return rhombusHeight(ratio() * 2);
            case "cmm":
                return rhombusHeight(ratio());
        }
    }

    getShearFactor(): number {
        const texRegion = this.texRegion;
        const ratio = () => texRegion.getHeight() / texRegion.getWidth();
        const rhombusShear = (ratio: number) => {
            return (1.0 / ratio - ratio) * 0.5;
        };

        switch (this.group.getKind()) {
            case "p1":
            case "p2":
                return texRegion.getShearFactor();
            case "p3":
            case "p3m1":
            case "p31m":
            case "p6":
            case "p6m":
                return SQRT_3 / 3.0;
            case "cm":
                return rhombusShear(ratio() * 2);
            case "cmm":
                return rhombusShear(ratio());
            default:
                return 0;
        }
    }

    getRotation(): number {
        const texRegion = this.texRegion;
        const ratio = () => texRegion.getHeight() / texRegion.getWidth();
        const rhombusRotation = (ratio: number) => {
            return -Math.atan(ratio);
        };

        switch (this.group.getKind()) {
            case "cm":
                return rhombusRotation(ratio() * 2);
            case "cmm":
                return rhombusRotation(ratio());
            default:
                return 0;
        }
    }

    getWorldToLatticeMat(): mat3 {
        const width = this.getWidth();
        const height = this.getHeight();
        const shearFactor = this.getShearFactor();
        const rotation = this.getRotation();
        const scaleInv = vec2.fromValues(1.0 / width, 1.0 / height);

        const out = mat3.create();
        mat3.scale(out, out, scaleInv);
        mat3Shear(out, out, -shearFactor);
        mat3.rotate(out, out, -rotation);
        return out;
    }

    getLatticeToWorldMat(): mat3 {
        const width = this.getWidth();
        const height = this.getHeight();
        const shearFactor = this.getShearFactor();
        const rotation = this.getRotation();

        const out = mat3.create();
        mat3.rotate(out, out, rotation);
        mat3Shear(out, out, shearFactor);
        mat3.scale(out, out, vec2.fromValues(width, height));
        return out;
    }

    getExtents(camera: Camera): [vec2, vec2] {
        const elem = camera.canvas.getBoundingClientRect();

        const mat = this.getWorldToLatticeMat();
        mat3.multiply(mat, mat, camera.getViewportToWorldMat());

        const corners = [
            vec3.fromValues(elem.left, elem.top, 1.0),
            vec3.fromValues(elem.right, elem.top, 1.0),
            vec3.fromValues(elem.left, elem.bottom, 1.0),
            vec3.fromValues(elem.right, elem.bottom, 1.0),
        ];

        for (const corner of corners) {
            vec3.transformMat3(corner, corner, mat);
        }

        const xs = corners.map((p) => p[0]);
        const ys = corners.map((p) => p[1]);

        const min = vec2.fromValues(Math.min(...xs), Math.min(...ys));
        const max = vec2.fromValues(Math.max(...xs), Math.max(...ys));
        return [min, max];
    }

    getVertexData(start: vec2, end: vec2): VertexData {
        const xMin = Math.floor(start[0]) - 1;
        const yMin = Math.floor(start[1]) - 1;
        const xMax = Math.ceil(end[0]) + 1;
        const yMax = Math.ceil(end[1]) + 1;

        const xLen = xMax - xMin + 1;
        const yLen = yMax - yMin + 1;
        const nCells = xLen * yLen;

        const STRIDE_POS = this.group.getCellPosDataStride();
        const STRIDE_TEX = this.group.getCellTexcoordDataStride();
        const posBuf = new Float32Array(nCells * STRIDE_POS);
        const texcoordBuf = new Float32Array(nCells * STRIDE_TEX);

        for (let y = 0; y < yLen; y += 1) {
            for (let x = 0; x < xLen; x += 1) {
                const cellIdx = y * xLen + x;
                this.group.writeCellData(
                    posBuf,
                    cellIdx * STRIDE_POS,
                    texcoordBuf,
                    cellIdx * STRIDE_TEX,
                    xMin + x,
                    yMin + y,
                );
            }
        }

        return {
            posBuf,
            texcoordBuf,
        };
    }
}

type VertexData = {
    posBuf: Float32Array;
    texcoordBuf: Float32Array;
};

export { Lattice };
export type { VertexData };
