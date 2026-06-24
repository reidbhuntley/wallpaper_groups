import { vec2 } from "gl-matrix";
import type { WallpaperGroupKind } from "./wallpaper_group";

const SQRT_3 = Math.sqrt(3);

const CORNER_LB = vec2.fromValues(0.0, 0.0);
const CORNER_LT = vec2.fromValues(0.0, 1.0);
const CORNER_RB = vec2.fromValues(1.0, 0.0);
const CORNER_RT = vec2.fromValues(1.0, 1.0);
const EDGE_L = vec2.fromValues(0.0, 0.5);
const EDGE_B = vec2.fromValues(0.5, 0.0);
const EDGE_R = vec2.fromValues(1.0, 0.5);
const EDGE_T = vec2.fromValues(0.5, 1.0);
const CENTER = vec2.fromValues(0.5, 0.5);
const CENTROID_LB = vec2.fromValues(1.0 / 3.0, 1.0 / 3.0);
const CENTROID_RT = vec2.fromValues(2.0 / 3.0, 2.0 / 3.0);
const HEX_LB = vec2.fromValues(0.0, 1.0 / 3.0);
const HEX_RT = vec2.fromValues(1.0, 2.0 / 3.0);
const BISECTOR_B = vec2.fromValues(0.5, 0.25);

type Face = {
    pos: [vec2, vec2, vec2];
    tex: [vec2, vec2, vec2];
};

const CELL_DATA: Record<WallpaperGroupKind, Face[]> = {
    p1: [
        {
            pos: [CORNER_LB, CORNER_RB, CORNER_LT],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [CORNER_RB, CORNER_RT, CORNER_LT],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
    ],
    p2: [
        {
            pos: [CORNER_LB, CORNER_RB, EDGE_L],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [CORNER_RB, EDGE_R, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_L, EDGE_R, CORNER_LT],
            tex: [CORNER_RT, CORNER_LT, CORNER_RB],
        },
        {
            pos: [EDGE_R, CORNER_RT, CORNER_LT],
            tex: [CORNER_LT, CORNER_LB, CORNER_RB],
        },
    ],
    pm: [
        {
            pos: [CORNER_LB, CORNER_RB, EDGE_L],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [CORNER_RB, EDGE_R, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_L, EDGE_R, CORNER_LT],
            tex: [CORNER_LT, CORNER_RT, CORNER_LB],
        },
        {
            pos: [EDGE_R, CORNER_RT, CORNER_LT],
            tex: [CORNER_RT, CORNER_RB, CORNER_LB],
        },
    ],
    pg: [
        {
            pos: [CORNER_LB, CORNER_RB, EDGE_L],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [CORNER_RB, EDGE_R, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_L, EDGE_R, CORNER_LT],
            tex: [CORNER_RB, CORNER_LB, CORNER_RT],
        },
        {
            pos: [EDGE_R, CORNER_RT, CORNER_LT],
            tex: [CORNER_LB, CORNER_LT, CORNER_RT],
        },
    ],
    cm: [
        {
            pos: [CORNER_LB, CORNER_RB, CORNER_RT],
            tex: [CORNER_LT, EDGE_B, CORNER_RT],
        },
        {
            pos: [CORNER_LB, CORNER_RT, CORNER_LT],
            tex: [CORNER_LT, CORNER_RT, EDGE_B],
        },
    ],
    pmm: [
        {
            pos: [CORNER_LB, EDGE_B, EDGE_L],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [EDGE_B, CENTER, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_B, CORNER_RB, CENTER],
            tex: [CORNER_RB, CORNER_LB, CORNER_RT],
        },
        {
            pos: [CORNER_RB, EDGE_R, CENTER],
            tex: [CORNER_LB, CORNER_LT, CORNER_RT],
        },
        {
            pos: [EDGE_L, CENTER, CORNER_LT],
            tex: [CORNER_LT, CORNER_RT, CORNER_LB],
        },
        {
            pos: [CENTER, EDGE_T, CORNER_LT],
            tex: [CORNER_RT, CORNER_RB, CORNER_LB],
        },
        {
            pos: [CENTER, EDGE_R, EDGE_T],
            tex: [CORNER_RT, CORNER_LT, CORNER_RB],
        },
        {
            pos: [EDGE_R, CORNER_RT, EDGE_T],
            tex: [CORNER_LT, CORNER_LB, CORNER_RB],
        },
    ],
    pmg: [
        {
            pos: [CORNER_LB, EDGE_B, EDGE_L],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [EDGE_B, CENTER, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_B, CORNER_RB, CENTER],
            tex: [CORNER_RT, CORNER_LT, CORNER_RB],
        },
        {
            pos: [CORNER_RB, EDGE_R, CENTER],
            tex: [CORNER_LT, CORNER_LB, CORNER_RB],
        },
        {
            pos: [EDGE_L, CENTER, CORNER_LT],
            tex: [CORNER_LT, CORNER_RT, CORNER_LB],
        },
        {
            pos: [CENTER, EDGE_T, CORNER_LT],
            tex: [CORNER_RT, CORNER_RB, CORNER_LB],
        },
        {
            pos: [CENTER, EDGE_R, EDGE_T],
            tex: [CORNER_RB, CORNER_LB, CORNER_RT],
        },
        {
            pos: [EDGE_R, CORNER_RT, EDGE_T],
            tex: [CORNER_LB, CORNER_LT, CORNER_RT],
        },
    ],
    pgg: [
        {
            pos: [CORNER_LB, EDGE_B, EDGE_L],
            tex: [EDGE_T, CORNER_RT, EDGE_B],
        },
        {
            pos: [EDGE_B, EDGE_R, EDGE_L],
            tex: [EDGE_B, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_B, CORNER_RB, EDGE_R],
            tex: [CORNER_LT, EDGE_T, EDGE_B],
        },
        {
            pos: [EDGE_L, EDGE_T, CORNER_LT],
            tex: [EDGE_B, CORNER_LT, EDGE_T],
        },
        {
            pos: [EDGE_L, EDGE_R, EDGE_T],
            tex: [CORNER_RT, CORNER_LT, EDGE_B],
        },
        {
            pos: [EDGE_R, CORNER_RT, EDGE_T],
            tex: [EDGE_B, EDGE_T, CORNER_RT],
        },
    ],
    cmm: [
        {
            pos: [CORNER_LB, CORNER_RB, CENTER],
            tex: [CORNER_LT, CORNER_RB, CORNER_RT],
        },
        {
            pos: [CORNER_LB, CENTER, CORNER_LT],
            tex: [CORNER_LT, CORNER_RT, CORNER_RB],
        },
        {
            pos: [CORNER_RB, CORNER_RT, CENTER],
            tex: [CORNER_RB, CORNER_LT, CORNER_RT],
        },
        {
            pos: [CENTER, CORNER_RT, CORNER_LT],
            tex: [CORNER_RT, CORNER_LT, CORNER_RB],
        },
    ],
    p4: [
        {
            pos: [CORNER_LB, EDGE_B, EDGE_L],
            tex: [CORNER_LB, CORNER_RB, CORNER_LT],
        },
        {
            pos: [EDGE_B, CENTER, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_B, CORNER_RB, CENTER],
            tex: [CORNER_LT, CORNER_LB, CORNER_RT],
        },
        {
            pos: [CORNER_RB, EDGE_R, CENTER],
            tex: [CORNER_LB, CORNER_RB, CORNER_RT],
        },
        {
            pos: [EDGE_L, CENTER, CORNER_LT],
            tex: [CORNER_RB, CORNER_RT, CORNER_LB],
        },
        {
            pos: [CENTER, EDGE_T, CORNER_LT],
            tex: [CORNER_RT, CORNER_LT, CORNER_LB],
        },
        {
            pos: [CENTER, EDGE_R, EDGE_T],
            tex: [CORNER_RT, CORNER_LT, CORNER_RB],
        },
        {
            pos: [EDGE_R, CORNER_RT, EDGE_T],
            tex: [CORNER_LT, CORNER_LB, CORNER_RB],
        },
    ],
    p4m: [
        {
            pos: [CORNER_LB, EDGE_B, CENTER],
            tex: [CORNER_LB, CORNER_RB, CORNER_RT],
        },
        {
            pos: [CORNER_LB, CENTER, EDGE_L],
            tex: [CORNER_LB, CORNER_RT, CORNER_RB],
        },
        {
            pos: [EDGE_L, CENTER, CORNER_LT],
            tex: [CORNER_RB, CORNER_RT, CORNER_LB],
        },
        {
            pos: [CORNER_LT, CENTER, EDGE_T],
            tex: [CORNER_LB, CORNER_RT, CORNER_RB],
        },
        {
            pos: [CENTER, CORNER_RT, EDGE_T],
            tex: [CORNER_RT, CORNER_LB, CORNER_RB],
        },
        {
            pos: [CENTER, EDGE_R, CORNER_RT],
            tex: [CORNER_RT, CORNER_RB, CORNER_LB],
        },
        {
            pos: [CORNER_RB, EDGE_R, CENTER],
            tex: [CORNER_LB, CORNER_RB, CORNER_RT],
        },
        {
            pos: [EDGE_B, CORNER_RB, CENTER],
            tex: [CORNER_RB, CORNER_LB, CORNER_RT],
        },
    ],
    p4g: [
        {
            pos: [EDGE_B, CENTER, EDGE_L],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_L, CENTER, EDGE_T],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_T, CENTER, EDGE_R],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_R, CENTER, EDGE_B],
            tex: [CORNER_RB, CORNER_RT, CORNER_LT],
        },
        {
            pos: [EDGE_L, CORNER_LB, EDGE_B],
            tex: [CORNER_LT, CORNER_RT, CORNER_RB],
        },
        {
            pos: [EDGE_T, CORNER_LT, EDGE_L],
            tex: [CORNER_LT, CORNER_RT, CORNER_RB],
        },
        {
            pos: [EDGE_R, CORNER_RT, EDGE_T],
            tex: [CORNER_LT, CORNER_RT, CORNER_RB],
        },
        {
            pos: [EDGE_B, CORNER_RB, EDGE_R],
            tex: [CORNER_LT, CORNER_RT, CORNER_RB],
        },
    ],
    p3: [
        {
            pos: [CORNER_LT, CENTROID_LB, CORNER_RB],
            tex: [CORNER_LT, HEX_LB, CORNER_RB],
        },
        {
            pos: [CORNER_RB, CENTROID_RT, CORNER_LT],
            tex: [CORNER_RB, HEX_RT, CORNER_LT],
        },
        {
            pos: [CORNER_LB, CORNER_RB, CENTROID_LB],
            tex: [CORNER_RB, CORNER_LT, HEX_LB],
        },
        {
            pos: [CORNER_LB, CENTROID_LB, CORNER_LT],
            tex: [CORNER_LT, HEX_LB, CORNER_RB],
        },
        {
            pos: [CORNER_RB, CORNER_RT, CENTROID_RT],
            tex: [CORNER_LT, CORNER_RB, HEX_RT],
        },
        {
            pos: [CENTROID_RT, CORNER_RT, CORNER_LT],
            tex: [HEX_RT, CORNER_LT, CORNER_RB],
        },
    ],
    p3m1: [
        {
            pos: [CENTROID_LB, CENTROID_RT, CORNER_LT],
            tex: [CORNER_LB, EDGE_R, CORNER_LT],
        },
        {
            pos: [CORNER_RB, CENTROID_RT, CENTROID_LB],
            tex: [CORNER_LT, EDGE_R, CORNER_LB],
        },
        {
            pos: [CORNER_LB, EDGE_B, CENTROID_LB],
            tex: [CORNER_LT, BISECTOR_B, CORNER_LB],
        },
        {
            pos: [CORNER_LB, CENTROID_LB, EDGE_L],
            tex: [CORNER_LT, CORNER_LB, BISECTOR_B],
        },
        {
            pos: [EDGE_B, CORNER_RB, CENTROID_LB],
            tex: [BISECTOR_B, CORNER_LT, CORNER_LB],
        },
        {
            pos: [CENTROID_LB, CORNER_LT, EDGE_L],
            tex: [CORNER_LB, CORNER_LT, BISECTOR_B],
        },
        {
            pos: [CORNER_RB, EDGE_R, CENTROID_RT],
            tex: [CORNER_LT, BISECTOR_B, EDGE_R],
        },
        {
            pos: [CENTROID_RT, EDGE_T, CORNER_LT],
            tex: [EDGE_R, BISECTOR_B, CORNER_LT],
        },
        {
            pos: [EDGE_R, CORNER_RT, CENTROID_RT],
            tex: [BISECTOR_B, CORNER_LT, EDGE_R],
        },
        {
            pos: [CENTROID_RT, CORNER_RT, EDGE_T],
            tex: [EDGE_R, CORNER_LT, BISECTOR_B],
        },
    ],
    p31m: [
        {
            pos: [CORNER_LB, CORNER_RB, CENTROID_LB],
            tex: [CORNER_LB, CORNER_RB, EDGE_T],
        },
        {
            pos: [CORNER_LB, CENTROID_LB, CORNER_LT],
            tex: [CORNER_RB, EDGE_T, CORNER_LB],
        },
        {
            pos: [CORNER_LT, CENTROID_LB, CORNER_RB],
            tex: [CORNER_RB, EDGE_T, CORNER_LB],
        },
        {
            pos: [CORNER_RB, CENTROID_RT, CORNER_LT],
            tex: [CORNER_LB, EDGE_T, CORNER_RB],
        },
        {
            pos: [CORNER_RB, CORNER_RT, CENTROID_RT],
            tex: [CORNER_RB, CORNER_LB, EDGE_T],
        },
        {
            pos: [CENTROID_RT, CORNER_RT, CORNER_LT],
            tex: [EDGE_T, CORNER_RB, CORNER_LB],
        },
    ],
    p6: [
        {
            pos: [CORNER_LB, CORNER_RB, CENTROID_LB],
            tex: [CORNER_LB, CORNER_RB, EDGE_T],
        },
        {
            pos: [CORNER_LB, CENTROID_LB, CORNER_LT],
            tex: [CORNER_RB, EDGE_T, CORNER_LB],
        },
        {
            pos: [CORNER_LT, CENTROID_LB, CORNER_RB],
            tex: [CORNER_RB, EDGE_T, CORNER_LB],
        },
        {
            pos: [CORNER_RB, CENTROID_RT, CORNER_LT],
            tex: [CORNER_RB, EDGE_T, CORNER_LB],
        },
        {
            pos: [CORNER_RB, CORNER_RT, CENTROID_RT],
            tex: [CORNER_LB, CORNER_RB, EDGE_T],
        },
        {
            pos: [CENTROID_RT, CORNER_RT, CORNER_LT],
            tex: [EDGE_T, CORNER_LB, CORNER_RB],
        },
    ],
    p6m: [
        {
            pos: [CORNER_LB, EDGE_B, CENTROID_LB],
            tex: [CORNER_LB, CORNER_RB, CORNER_RT],
        },
        {
            pos: [EDGE_B, CORNER_RB, CENTROID_LB],
            tex: [CORNER_RB, CORNER_LB, CORNER_RT],
        },
        {
            pos: [CORNER_LB, CENTROID_LB, EDGE_L],
            tex: [CORNER_LB, CORNER_RT, CORNER_RB],
        },
        {
            pos: [CENTROID_LB, CORNER_LT, EDGE_L],
            tex: [CORNER_RT, CORNER_LB, CORNER_RB],
        },
        {
            pos: [CORNER_RB, CENTER, CENTROID_LB],
            tex: [CORNER_LB, CORNER_RB, CORNER_RT],
        },
        {
            pos: [CENTROID_LB, CENTER, CORNER_LT],
            tex: [CORNER_RT, CORNER_RB, CORNER_LB],
        },
        {
            pos: [CENTER, CENTROID_RT, CORNER_LT],
            tex: [CORNER_RB, CORNER_RT, CORNER_LB],
        },
        {
            pos: [CORNER_RB, CENTROID_RT, CENTER],
            tex: [CORNER_LB, CORNER_RT, CORNER_RB],
        },
        {
            pos: [CORNER_RB, EDGE_R, CENTROID_RT],
            tex: [CORNER_LB, CORNER_RB, CORNER_RT],
        },
        {
            pos: [EDGE_R, CORNER_RT, CENTROID_RT],
            tex: [CORNER_RB, CORNER_LB, CORNER_RT],
        },
        {
            pos: [CENTROID_RT, EDGE_T, CORNER_LT],
            tex: [CORNER_RT, CORNER_RB, CORNER_LB],
        },
        {
            pos: [CENTROID_RT, CORNER_RT, EDGE_T],
            tex: [CORNER_RT, CORNER_LB, CORNER_RB],
        },
    ],
};

type Pattern = {
    canShear: boolean;
    fixedAspectRatio: number | null;
    vertices: vec2[];
};

const PATTERN_DATA: Record<WallpaperGroupKind, Pattern> = {
    p1: {
        canShear: true,
        fixedAspectRatio: null,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    p2: {
        canShear: true,
        fixedAspectRatio: null,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    pm: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    pg: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    cm: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LT, EDGE_B, CORNER_RT],
    },
    pmm: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    pmg: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    pgg: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LT, EDGE_B, CORNER_RT],
    },
    cmm: {
        canShear: false,
        fixedAspectRatio: null,
        vertices: [CORNER_LT, CORNER_RB, CORNER_RT],
    },
    p4: {
        canShear: false,
        fixedAspectRatio: 1.0,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT, CORNER_LT],
    },
    p4m: {
        canShear: false,
        fixedAspectRatio: 1.0,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT],
    },
    p4g: {
        canShear: false,
        fixedAspectRatio: 1.0,
        vertices: [CORNER_LT, CORNER_RB, CORNER_RT],
    },
    p3: {
        canShear: false,
        fixedAspectRatio: SQRT_3 / 3.0,
        vertices: [CORNER_LT, HEX_LB, CORNER_RB, HEX_RT],
    },
    p3m1: {
        canShear: false,
        fixedAspectRatio: SQRT_3 / 2.0,
        vertices: [CORNER_LB, EDGE_R, CORNER_LT],
    },
    p31m: {
        canShear: false,
        fixedAspectRatio: SQRT_3 * 2.0,
        vertices: [CORNER_LB, CORNER_RB, EDGE_T],
    },
    p6: {
        canShear: false,
        fixedAspectRatio: SQRT_3 * 2.0,
        vertices: [CORNER_LB, CORNER_RB, EDGE_T],
    },
    p6m: {
        canShear: false,
        fixedAspectRatio: SQRT_3,
        vertices: [CORNER_LB, CORNER_RB, CORNER_RT],
    },
};

export { CELL_DATA, PATTERN_DATA };
export type { Face, Pattern };
