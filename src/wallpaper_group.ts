import { CELL_DATA, PATTERN_DATA, type Pattern } from "./cell_data";

type WallpaperGroupKind =
    | "p1"
    | "p2"
    | "pm"
    | "pg"
    | "cm"
    | "pmm"
    | "pmg"
    | "pgg"
    | "cmm"
    | "p4"
    | "p4m"
    | "p4g"
    | "p3"
    | "p3m1"
    | "p31m"
    | "p6"
    | "p6m";

class WallpaperGroup {
    private kind: WallpaperGroupKind;

    constructor(kind: WallpaperGroupKind) {
        this.kind = kind;
    }

    getKind(): WallpaperGroupKind {
        return this.kind;
    }

    getPattern(): Pattern {
        return PATTERN_DATA[this.kind];
    }

    getCellFaceCount(): number {
        return CELL_DATA[this.kind].length;
    }

    getCellPosDataStride() {
        return this.getCellFaceCount() * 6;
    }

    getCellTexcoordDataStride() {
        return this.getCellFaceCount() * 6;
    }

    writeCellData(
        posBuf: Float32Array,
        posBufOff: number,
        texcoordBuf: Float32Array,
        texcoordBufOff: number,
        cellX: number,
        cellY: number,
    ) {
        const texBuf = texcoordBuf;
        const poff = posBufOff;
        const toff = texcoordBufOff;

        for (const [i, face] of CELL_DATA[this.kind].entries()) {
            const foff = i * 6;

            posBuf[poff + foff + 0] = face.pos[0][0] + cellX;
            posBuf[poff + foff + 1] = face.pos[0][1] + cellY;
            posBuf[poff + foff + 2] = face.pos[1][0] + cellX;
            posBuf[poff + foff + 3] = face.pos[1][1] + cellY;
            posBuf[poff + foff + 4] = face.pos[2][0] + cellX;
            posBuf[poff + foff + 5] = face.pos[2][1] + cellY;

            texBuf[toff + foff + 0] = face.tex[0][0];
            texBuf[toff + foff + 1] = face.tex[0][1];
            texBuf[toff + foff + 2] = face.tex[1][0];
            texBuf[toff + foff + 3] = face.tex[1][1];
            texBuf[toff + foff + 4] = face.tex[2][0];
            texBuf[toff + foff + 5] = face.tex[2][1];
        }
    }
}

export { WallpaperGroup };
export type { WallpaperGroupKind };
