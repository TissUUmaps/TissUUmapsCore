/**
* @file glUtils.js Handling WebGL stuff (shader loading, etc.)
* @author Fredrik Nysjo
* @see {@link glUtils}
*/
glUtils = {
    _programs: {},
    _buffers: {},
    _textures: {},
    _numPoints: 1,
    _imageSize: [1, 1],
    _viewportRect: [0, 0, 1, 1],
    _markerScale: 1.0,
    _barcodeToLUTIndex: {},
    _redrawFlag: false,
}


glUtils._markersVS = `
    uniform vec2 u_imageSize;
    uniform vec4 u_viewportRect;
    uniform float u_markerScale;
    uniform sampler2D u_colorLUT;

    attribute vec4 a_position;

    varying vec4 v_color;

    void main()
    {
        vec2 imagePos = a_position.xy * u_imageSize;
        vec2 viewportPos = imagePos - u_viewportRect.xy;
        vec2 ndcPos = (viewportPos / u_viewportRect.zw) * 2.0 - 1.0;
        ndcPos.y = -ndcPos.y;

        v_color = texture2D(u_colorLUT, vec2(a_position.z, 0.5));
        gl_Position = vec4(ndcPos, 0.0, 1.0);
        gl_PointSize = max(1.0, u_markerScale / u_viewportRect.w);

        // Discard point here in vertex shader if marker is hidden
        if (v_color.a == 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
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


glUtils._createDummyMarkerBuffer = function(gl, numPoints) {
    const positions = [];
    for (let i = 0; i < numPoints; ++i) {
        positions[4 * i + 0] = Math.random();  // X-coord
        positions[4 * i + 1] = Math.random();  // Y-coord
        positions[4 * i + 2] = Math.random();  // LUT-coord
        positions[4 * i + 3] = 0.0;  // Reserved for future use
    }

    const bytedata = new Float32Array(positions);

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

    // If new marker data was loaded, we need to assign each barcode an index
    // that we can use with the LUT textures for color, visibility, etc.
    glUtils._updateBarcodeToLUTIndexDict(markerData);

    const positions = [];
    for (let i = 0; i < numPoints; ++i) {
        positions[4 * i + 0] = markerData[i].global_X_pos / imageWidth;
        positions[4 * i + 1] = markerData[i].global_Y_pos / imageHeight;
        positions[4 * i + 2] = glUtils._barcodeToLUTIndex[markerData[i].letters] / 255.0;
        positions[4 * i + 3] = 0.0;  // Reserved for future use
    }

    const bytedata = new Float32Array(positions);

    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers["markers"]);
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    glUtils._numPoints = numPoints;
    glUtils.updateLUTTextures();
}


glUtils._updateBarcodeToLUTIndexDict = function(markerData) {
    const barcodeToLUTIndex = {};
    const numPoints = markerData.length;
    for (let i = 0, index = 0; i < numPoints; ++i) {
        const barcode = markerData[i].letters;
        if (!(barcode in barcodeToLUTIndex)) {
            barcodeToLUTIndex[barcode] = index++;
        }
    }
    glUtils._barcodeToLUTIndex = barcodeToLUTIndex;
}


glUtils._createColorLUTTexture = function(gl) {
    const randomColors = [];
    for (let i = 0; i < 256; ++i) {
        randomColors[4 * i + 0] = Math.random() * 255.999; 
        randomColors[4 * i + 1] = Math.random() * 255.999;
        randomColors[4 * i + 2] = Math.random() * 255.999;
        randomColors[4 * i + 3] = 255.0;
    }

    const bytedata = new Uint8Array(randomColors);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}


glUtils._updateColorLUTTexture = function(gl, texture) {
    const allMarkersCheckbox = document.getElementById("AllMarkers-checkbox-ISS");
    const showAll = allMarkersCheckbox && allMarkersCheckbox.checked;

    const colors = new Array(256 * 4);
    for (let [barcode, index] of Object.entries(glUtils._barcodeToLUTIndex)) {
        // Get color value from HTML color assigned to barcode
        const hexColor = HTMLElementUtils.barcodeHTMLColor(barcode);
        const visible = showAll || markerUtils._checkBoxes[barcode].checked;
        colors[4 * index + 0] = Number("0x" + hexColor.substring(1,3)); 
        colors[4 * index + 1] = Number("0x" + hexColor.substring(3,5));
        colors[4 * index + 2] = Number("0x" + hexColor.substring(5,7));
        colors[4 * index + 3] = Number(visible) * 255;
    }

    const bytedata = new Uint8Array(colors);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);
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
    const colorLUT = glUtils._textures["colorLUT"];

    gl.useProgram(program);
    const POSITION = gl.getAttribLocation(program, "a_position");
    gl.uniform2fv(gl.getUniformLocation(program, "u_imageSize"), glUtils._imageSize);
    gl.uniform4fv(gl.getUniformLocation(program, "u_viewportRect"), glUtils._viewportRect);
    gl.uniform1f(gl.getUniformLocation(program, "u_markerScale"), glUtils._markerScale);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorLUT);
    gl.uniform1i(gl.getUniformLocation(program, "u_colorLUT"), 0);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(POSITION);
    gl.vertexAttribPointer(POSITION, 4, gl.FLOAT, false, 0, 0);
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


glUtils.updateLUTTextures = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    console.log("Update LUTs");
    glUtils._updateColorLUTTexture(gl, glUtils._textures["colorLUT"]);
}


glUtils.init = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    this._programs["markers"] = this._loadShaderProgram(gl, this._markersVS, this._markersFS);
    this._buffers["markers"] = this._createDummyMarkerBuffer(gl, this._numPoints);
    this._textures["colorLUT"] = this._createColorLUTTexture(gl);

    glUtils.updateMarkerScale();
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.updateMarkerScale);
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.draw);
    document.getElementById("ISS_markers").addEventListener("click", glUtils.updateLUTTextures);
    document.getElementById("ISS_markers").addEventListener("click", glUtils.draw);

    tmapp["hideSVGMarkers"] = true;
}
