import { mat3, vec2, vec3 } from "gl-matrix";
import type { Camera } from "./camera";
import type { TexRegionController } from "./tex_region_controller";
import { Lattice } from "./lattice";
import type { TexRegion } from "./tex_region";
import { WallpaperGroup } from "./wallpaper_group";

const vertexSrc = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 uLatticeMatrix;
    uniform mat3 uTexCoordMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
        gl_Position = vec4((uLatticeMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = (uTexCoordMatrix * vec3(aTextureCoord, 1.0)).xy;
    }
`;

const fragmentSrc = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`;

type ProgramInfo = {
    program: WebGLProgram;
    attribLocations: {
        vertexPosition: number;
        textureCoord: number;
    };
    uniformLocations: {
        latticeMatrix: WebGLUniformLocation;
        texCoordMatrix: WebGLUniformLocation;
        uSampler: WebGLUniformLocation;
    };
};

class Renderer {
    gl: WebGLRenderingContext;
    texRegion: TexRegion;
    group: WallpaperGroup = new WallpaperGroup("p1");
    camera: Camera;
    latticeWidth: number;

    private textureSize: {
        width: number;
        height: number;
    } = {
        width: 0,
        height: 0,
    };
    private texture: WebGLTexture;
    private buffers: {
        vertexPosition: WebGLBuffer;
        textureCoord: WebGLBuffer;
    };
    private programInfo: ProgramInfo;

    static init(
        gl: WebGLRenderingContext,
        texRegion: TexRegion,
        camera: Camera,
        latticeWidth: number,
    ): Renderer | null {
        const prog = initShaderProgram(gl, vertexSrc, fragmentSrc);
        if (prog === null) {
            return null;
        }

        const vertexPosition = gl.getAttribLocation(prog, "aVertexPosition");
        const textureCoord = gl.getAttribLocation(prog, "aTextureCoord");

        const latticeMatrix = gl.getUniformLocation(prog, "uLatticeMatrix");
        const texCoordMatrix = gl.getUniformLocation(prog, "uTexCoordMatrix");
        const uSampler = gl.getUniformLocation(prog, "uSampler");
        if (
            latticeMatrix === null ||
            texCoordMatrix === null ||
            uSampler === null
        ) {
            return null;
        }

        const programInfo = {
            program: prog,
            attribLocations: {
                vertexPosition,
                textureCoord,
            },
            uniformLocations: {
                latticeMatrix,
                texCoordMatrix,
                uSampler,
            },
        };

        return new Renderer(gl, texRegion, camera, latticeWidth, programInfo);
    }

    private constructor(
        gl: WebGLRenderingContext,
        texRegion: TexRegion,
        camera: Camera,
        latticeWidth: number,
        programInfo: ProgramInfo,
    ) {
        this.gl = gl;
        this.texRegion = texRegion;
        this.camera = camera;
        this.latticeWidth = latticeWidth;
        this.programInfo = programInfo;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.texture = gl.createTexture();
        this.buffers = {
            vertexPosition: gl.createBuffer(),
            textureCoord: gl.createBuffer(),
        };

        this.loadPlaceholderTexture();

        requestAnimationFrame(() => {
            this.render();
        });
    }

    setGroup(group: WallpaperGroup) {
        this.group = group;
    }

    loadPlaceholderTexture() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 0, 255]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            width,
            height,
            border,
            srcFormat,
            srcType,
            pixel,
        );
    }

    loadTexture(bitmap: ImageBitmap) {
        this.textureSize = {
            width: bitmap.width,
            height: bitmap.height,
        };

        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            bitmap,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    getTexCoordToRectTexCoordMat(): mat3 {
        const texSize = Math.min(
            this.textureSize.width,
            this.textureSize.height,
        );
        const wScale = texSize / this.textureSize.width;
        const hScale = texSize / this.textureSize.height;

        const out = mat3.create();
        // flip y-coord to match expected WebGL coords
        mat3.translate(out, out, vec2.fromValues(0.0, 1.0));
        mat3.scale(out, out, vec2.fromValues(1.0, -1.0));

        // crop to square
        mat3.translate(
            out,
            out,
            vec2.fromValues((1.0 - wScale) * 0.5, (1.0 - hScale) * 0.5),
        );
        mat3.scale(out, out, vec2.fromValues(wScale, hScale));
        return out;
    }

    private render() {
        const gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const group = this.group;
        const texRegion = this.texRegion;
        const lattice = new Lattice(this.latticeWidth, group, texRegion);

        const vertexData = lattice.getVertexData(
            ...lattice.getExtents(this.camera),
        );

        const latticeMat = this.camera.getWorldToClipMat();
        mat3.multiply(latticeMat, latticeMat, lattice.getLatticeToWorldMat());

        const texCoordMat = this.getTexCoordToRectTexCoordMat();
        mat3.multiply(
            texCoordMat,
            texCoordMat,
            texRegion.getExtentToTexCoordMat(),
        );
        mat3.multiply(
            texCoordMat,
            texCoordMat,
            texRegion.getPatternToExtentMat(),
        );

        this.setPositionAttribute(vertexData.posBuf);
        this.setTextureAttribute(vertexData.texcoordBuf);

        gl.useProgram(this.programInfo.program);

        gl.uniformMatrix3fv(
            this.programInfo.uniformLocations.latticeMatrix,
            false,
            latticeMat,
        );
        gl.uniformMatrix3fv(
            this.programInfo.uniformLocations.texCoordMatrix,
            false,
            texCoordMat,
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

        const vertexCount = vertexData.posBuf.length / 2;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        requestAnimationFrame(() => {
            this.render();
        });
    }

    private setPositionAttribute(array: Float32Array) {
        const gl = this.gl;
        const attribLoc = this.programInfo.attribLocations.vertexPosition;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);

        const num = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(attribLoc, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(attribLoc);
    }

    private setTextureAttribute(array: Float32Array) {
        const gl = this.gl;
        const attribLoc = this.programInfo.attribLocations.textureCoord;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);

        const num = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(attribLoc, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(attribLoc);
    }
}

function initShaderProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string,
): WebGLProgram | null {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (vertexShader === null || fragmentShader === null) {
        return null;
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(shaderProgram);
        console.error(`Unable to initialize the shader program: ${log}`);

        return null;
    }

    return shaderProgram;
}

function loadShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (shader === null) {
        console.error("Unable to create shader");
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        console.error(`An error occurred compiling the shaders: ${log}`);

        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

export { Renderer };
