sfomuseum.golang.wasm.fetch("wasm/point_in_polygon.wasm").then((rsp) => {

    console.log("OK PIP");
}).catch((err) => {
    console.error("Failed to load update exif binary", err);
    return;
});
