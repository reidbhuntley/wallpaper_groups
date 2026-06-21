main();

function main() {
    const canvasDiv = document.getElementById("canvas-div") as HTMLElement;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    window.onload = window.onresize = () => {
        canvas.width = canvasDiv.offsetWidth;
        canvas.height = canvasDiv.offsetHeight;
    };
}
