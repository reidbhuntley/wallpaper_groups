import type { mat3, ReadonlyMat3 } from "gl-matrix";

function mat3Shear(out: mat3, a: ReadonlyMat3, factor: number) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3] + factor * a[0];
    out[4] = a[4] + factor * a[1];
    out[5] = a[5] + factor * a[2];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
}

export { mat3Shear };
