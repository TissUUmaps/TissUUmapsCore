/**
* @file glUtils.js Handling WebGL stuff (shader loading, etc.)
* @author Fredrik Nysjo
* @see {@link glUtils}
*/
glUtils = {
    _programs: {},
    _buffers: {},
    _numPoints: 100000,
    _imageSize: [1, 1],
    _viewportRect: [0, 0, 1, 1],
    _markerScale: 1.0,
    _redrawFlag: false,
}


glUtils._markersVS = `
    uniform vec2 u_imageSize;
    uniform vec4 u_viewportRect;
    uniform float u_markerScale;

    attribute vec4 a_position;
    attribute vec4 a_color;

    varying vec4 v_color;

    void main()
    {
        vec2 imagePos = a_position.xy * u_imageSize;
        vec2 viewportPos = imagePos - u_viewportRect.xy;
        vec2 ndcPos = (viewportPos / u_viewportRect.zw) * 2.0 - 1.0;
        ndcPos.y = -ndcPos.y;

        v_color = a_color;
        gl_Position = vec4(ndcPos, 0.0, 1.0);
        gl_PointSize = max(1.0, u_markerScale / u_viewportRect.w);
    }
`;


glUtils._markersFS = `
    precision mediump float;

    varying vec4 v_color;

    void main()
    {
        if (length(gl_PointCoord.xy - 0.5) > 0.5) discard;
        gl_FragColor = v_color;
    }
`;


glUtils._loadShaderProgram = function(gl, vertSource, fragSource) {
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.log("Could not compile vertex shader: " + gl.getShaderInfoLog(vertShader));
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.log("Could not compile fragment shader: " + gl.getShaderInfoLog(fragShader));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.deleteShader(vertShader);  // Flag shaders for automatic deletion after
    gl.deleteShader(fragShader);  // their program object is destroyed
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Unable to link shader program: " + gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}


glUtils._createTriangleBuffer = function(gl) {
    const positions = [-0.5, -0.5, 0.5, -0.5, 0.0, 0.5];
    const colors = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
    const bytedata = new Float32Array(positions.concat(colors));

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}


glUtils._createDummyMarkerBuffer = function(gl, numPoints) {
    const positions = [];
    for (let i = 0; i < numPoints; ++i) {
        positions[2 * i + 0] = Math.random();
        positions[2 * i + 1] = Math.random();
    }

    const colors = [];
    for (let i = 0; i < numPoints; ++i) {
        colors[3 * i + 0] = Math.random(); 
        colors[3 * i + 1] = Math.random();
        colors[3 * i + 2] = Math.random();
    }

    const bytedata = new Float32Array(positions.concat(colors));

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}


// Overwrite dummy data in vertex buffer with markers loaded from CSV file
glUtils.loadMarkers = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    const markerData = dataUtils["ISS_processeddata"];
    const numPoints = markerData.length;
    const imageWidth = OSDViewerUtils.getImageWidth();
    const imageHeight = OSDViewerUtils.getImageHeight();

    const positions = [];
    for (let i = 0; i < numPoints; ++i) {
        positions[2 * i + 0] = markerData[i].global_X_pos / imageWidth;
        positions[2 * i + 1] = markerData[i].global_Y_pos / imageHeight;
    }

    const colors = [];
    for (let i = 0; i < numPoints; ++i) {
        // Get color value from initial HTML color assigned to barcode. We
        // probably want to store these colors in a LUT texture instead, to
        // make it possible to change colors from the GUI
        const seed = markerData[i].letters;
        const hexColor = HTMLElementUtils.barcodeHTMLColor(seed);
        colors[3 * i + 0] = Number("0x" + hexColor.substring(1,3)) / 255.0; 
        colors[3 * i + 1] = Number("0x" + hexColor.substring(3,5)) / 255.0;
        colors[3 * i + 2] = Number("0x" + hexColor.substring(5,7)) / 255.0;
    }

    const bytedata = new Float32Array(positions.concat(colors));

    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers["markers"]);
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    glUtils._numPoints = numPoints;
}


// This function is a workaround for making the area of the OSD navigator show
// through the WebGL canvas
glUtils.clearNavigatorArea = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    const navigator = tmapp["ISS_viewer"].navigator;
    const navigatorSize = navigator.viewport.containerSize;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, navigatorSize.x + 4, navigatorSize.y + 9);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


glUtils.draw = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    const bounds = tmapp["ISS_viewer"].viewport.getBounds();
    glUtils._viewportRect = [bounds.x, bounds.y, bounds.width, bounds.height];
    const homeBounds = tmapp["ISS_viewer"].world.getHomeBounds();
    glUtils._imageSize = [homeBounds.width, homeBounds.height];

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const program = glUtils._programs["markers"];
    const buffer = glUtils._buffers["markers"];

    gl.useProgram(program);
    const POSITION = gl.getAttribLocation(program, "a_position");
    const COLOR = gl.getAttribLocation(program, "a_color");
    gl.uniform2fv(gl.getUniformLocation(program, "u_imageSize"), glUtils._imageSize);
    gl.uniform4fv(gl.getUniformLocation(program, "u_viewportRect"), glUtils._viewportRect);
    gl.uniform1f(gl.getUniformLocation(program, "u_markerScale"), glUtils._markerScale);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(POSITION);
    gl.vertexAttribPointer(POSITION, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR);
    gl.vertexAttribPointer(COLOR, 3, gl.FLOAT, false, 0, glUtils._numPoints * 8);  // FIXME
    gl.drawArrays(gl.POINTS, 0, glUtils._numPoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.useProgram(null);

    // Clear the redraw flag to avoid markers appearing on top of the OSD
    // navigator after exiting and entering the OSD canvas
    glUtils._redrawFlag = false;
}


glUtils.resize = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    const op = tmapp["object_prefix"];
    const newSize = tmapp[op + "_viewer"].viewport.containerSize;
    gl.canvas.width = newSize.x;
    gl.canvas.height = newSize.y;
}


glUtils.resizeAndDraw = function() {
    glUtils.resize();
    glUtils.draw();
}


glUtils.redraw = function() {
    if (glUtils._redrawFlag == false) return;
    glUtils.draw();
}


glUtils.postRedraw = function() {
    glUtils._redrawFlag = true;
    // We want markers to be redrawn after the OSD navigator has faded out
    window.setTimeout(glUtils.redraw, 3000);
}


glUtils.updateMarkerScale = function() {
    const globalMarkerSize = Number(document.getElementById("ISS_globalmarkersize_text").value);
    // Clamp the scale factor to avoid giant markers and slow rendering if the
    // user inputs a very large value (say 10000 or something)
    glUtils._markerScale = Math.max(0.01, Math.min(5.0, globalMarkerSize / 100.0));
}


glUtils.init = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    this._programs["markers"] = this._loadShaderProgram(gl, this._markersVS, this._markersFS);
    this._buffers["markers"] = this._createDummyMarkerBuffer(gl, this._numPoints);

    glUtils.updateMarkerScale();
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.updateMarkerScale);
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.draw);
}
