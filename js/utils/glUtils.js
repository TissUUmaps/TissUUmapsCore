/**
* @file glUtils.js Handling WebGL stuff (shader loading, etc.)
* @author Fredrik Nysjo
* @see {@link glUtils}
*/
glUtils = {
    _programs: {},
    _buffers: {},
    _textures: {},
    _numBarcodePoints: 0,
    _numCPPoints: 0,
    _imageSize: [1, 1],
    _viewportRect: [0, 0, 1, 1],
    _markerScale: 1.0,
    _markerScalarRange: [0.0, 1.0],
    _useColorFromMarker: false,
    _colorscaleName: "null",
    _colorscaleData: [],
    _barcodeToLUTIndex: {},
    _barcodeToKey: {},
    _redrawFlag: false,
    _options: {antialias: false},
    _showColorbar: true,
}


glUtils._markersVS = `
    uniform vec2 u_imageSize;
    uniform vec4 u_viewportRect;
    uniform mat2 u_viewportTransform;
    uniform int u_markerType;
    uniform float u_markerScale;
    uniform vec2 u_markerScalarRange;
    uniform bool u_useColorFromMarker;
    uniform sampler2D u_colorLUT;
    uniform sampler2D u_colorscale;

    attribute vec4 a_position;

    varying vec4 v_color;
    varying vec2 v_shapeOrigin;
    varying float v_shapeColorBias;

    #define MARKER_TYPE_BARCODE 0
    #define MARKER_TYPE_CP 1
    #define SHAPE_GRID_SIZE 4.0

    vec3 unpack_rgb8(float v)
    {
        // Extract RGB color from 24-bit int stored in float
        return mod(v / vec3(1.0, 256.0, 65536.0), 256.0) / 255.0;
    }

    void main()
    {
        vec2 imagePos = a_position.xy * u_imageSize;
        vec2 viewportPos = imagePos - u_viewportRect.xy;
        vec2 ndcPos = (viewportPos / u_viewportRect.zw) * 2.0 - 1.0;
        ndcPos.y = -ndcPos.y;
        ndcPos = u_viewportTransform * ndcPos;

        if (u_markerType == MARKER_TYPE_BARCODE) {
            v_color = texture2D(u_colorLUT, vec2(a_position.z, 0.5));
        } else if (u_markerType == MARKER_TYPE_CP) {
            vec2 range = u_markerScalarRange;
            float normalized = (a_position.z - range[0]) / (range[1] - range[0]);
            v_color.rgb = texture2D(u_colorscale, vec2(normalized, 0.5)).rgb;
            v_color.a = 7.0 / 255.0;  // Give CP markers a round shape
        }

        if (u_useColorFromMarker) v_color.rgb = unpack_rgb8(a_position.w);

        gl_Position = vec4(ndcPos, 0.0, 1.0);
        gl_PointSize = max(1.0, u_markerScale / u_viewportRect.w);

        v_shapeOrigin.x = mod(v_color.a * 255.0 - 1.0, SHAPE_GRID_SIZE);
        v_shapeOrigin.y = floor((v_color.a * 255.0 - 1.0) / SHAPE_GRID_SIZE);
        v_shapeColorBias = max(0.0, 1.0 - gl_PointSize * 0.2);

        // Discard point here in vertex shader if marker is hidden
        v_color.a = v_color.a > 0.0 ? 1.0 : 0.0;
        if (v_color.a == 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
    }
`;


glUtils._markersFS = `
    precision mediump float;

    uniform sampler2D u_shapeAtlas;

    varying vec4 v_color;
    varying vec2 v_shapeOrigin;
    varying float v_shapeColorBias;

    #define UV_SCALE 0.7
    #define SHAPE_GRID_SIZE 4.0

    void main()
    {
        vec2 uv = (gl_PointCoord.xy - 0.5) * UV_SCALE + 0.5;
        uv = (uv + v_shapeOrigin) * (1.0 / SHAPE_GRID_SIZE);

        vec4 shapeColor = texture2D(u_shapeAtlas, uv, -0.5);
        shapeColor = clamp(shapeColor + v_shapeColorBias, 0.0, 1.0);
        shapeColor.rgb *= shapeColor.a;

        gl_FragColor = shapeColor * v_color;
        if (gl_FragColor.a < 0.1) discard;
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
        positions[4 * i + 3] = i / numPoints;  // Scalar data
    }

    const bytedata = new Float32Array(positions);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}



// Load barcode markers loaded from CSV file into vertex buffer
glUtils.loadMarkers = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

    const markerData = dataUtils["ISS_processeddata"];
    const numPoints = markerData.length;
    const keyName = document.getElementById("ISS_key_header").value;
    const imageWidth = OSDViewerUtils.getImageWidth();
    const imageHeight = OSDViewerUtils.getImageHeight();

    // If new marker data was loaded, we need to assign each barcode an index
    // that we can use with the LUT textures for color, visibility, etc.
    glUtils._updateBarcodeToLUTIndexDict(markerData, keyName);

    const colorPropertyName = markerUtils._uniqueColorSelector;
    const useColorFromMarker = markerUtils._uniqueColor && (colorPropertyName in markerData[0]);
    let hexColor = "#000000";

    const positions = [];
    for (let i = 0; i < numPoints; ++i) {
        if (useColorFromMarker) hexColor = markerData[i][colorPropertyName];
        positions[4 * i + 0] = markerData[i].global_X_pos / imageWidth;
        positions[4 * i + 1] = markerData[i].global_Y_pos / imageHeight;
        positions[4 * i + 2] = glUtils._barcodeToLUTIndex[markerData[i].letters] / 4095.0;
        positions[4 * i + 3] = Number("0x" + hexColor.substring(1,7));
    }

    const bytedata = new Float32Array(positions);

    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers["barcodeMarkers"]);
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    glUtils._numBarcodePoints = numPoints;
    glUtils._useColorFromMarker = useColorFromMarker;
    glUtils.updateLUTTextures();
}


// Load cell morphology markers loaded from CSV file into vertex buffer
glUtils.loadCPMarkers = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

    const markerData = CPDataUtils["CP_rawdata"];
    const numPoints = markerData.length;
    const propertyName = document.getElementById("CP_property_header").value;
    const xColumnName = document.getElementById("CP_X_header").value;
    const yColumnName = document.getElementById("CP_Y_header").value;
    const colorscaleName = document.getElementById("CP_colorscale").value;
    const imageWidth = OSDViewerUtils.getImageWidth();
    const imageHeight = OSDViewerUtils.getImageHeight();

    const useColorFromMarker = colorscaleName.includes("ownColorFromColumn");
    let hexColor = "#000000";

    const positions = [];
    let scalarRange = [1e9, -1e9];
    for (let i = 0; i < numPoints; ++i) {
        if (useColorFromMarker) hexColor = markerData[i][propertyName];
        positions[4 * i + 0] = Number(markerData[i][xColumnName]) / imageWidth;
        positions[4 * i + 1] = Number(markerData[i][yColumnName]) / imageHeight;
        positions[4 * i + 2] = Number(markerData[i][propertyName]);
        positions[4 * i + 3] = Number("0x" + hexColor.substring(1,7));
        scalarRange[0] = Math.min(scalarRange[0], positions[4 * i + 2]);
        scalarRange[1] = Math.max(scalarRange[1], positions[4 * i + 2]);
    }

    const bytedata = new Float32Array(positions);

    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers["CPMarkers"]);
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    glUtils._numCPPoints = numPoints;
    glUtils._markerScalarRange = scalarRange;
    glUtils._colorscaleName = colorscaleName;
    glUtils._updateColorScaleTexture(gl, glUtils._textures["colorscale"]);
    glUtils._updateColorbarCanvas(colorscaleName, glUtils._colorscaleData, propertyName, scalarRange);
    glUtils.draw();  // Force redraw
}


glUtils._updateBarcodeToLUTIndexDict = function(markerData, keyName) {
    const barcodeToLUTIndex = {};
    const barcodeToKey = {};
    const numPoints = markerData.length;
    for (let i = 0, index = 0; i < numPoints; ++i) {
        const barcode = markerData[i].letters;
        const gene_name = markerData[i].gene_name;
        if (!(barcode in barcodeToLUTIndex)) {
            barcodeToLUTIndex[barcode] = index++;
            barcodeToKey[barcode] = (keyName == "letters" ? barcode : gene_name);
        }
    }
    glUtils._barcodeToLUTIndex = barcodeToLUTIndex;
    glUtils._barcodeToKey = barcodeToKey;
}


glUtils._createColorLUTTexture = function(gl) {
    const randomColors = [];
    for (let i = 0; i < 4096; ++i) {
        randomColors[4 * i + 0] = Math.random() * 256.0; 
        randomColors[4 * i + 1] = Math.random() * 256.0;
        randomColors[4 * i + 2] = Math.random() * 256.0;
        randomColors[4 * i + 3] = Math.floor(Math.random() * 7) + 1;
    }

    const bytedata = new Uint8Array(randomColors);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4096, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}


glUtils._updateColorLUTTexture = function(gl, texture) {
    const allMarkersCheckbox = document.getElementById("AllMarkers-checkbox-ISS");
    const showAll = allMarkersCheckbox && allMarkersCheckbox.checked;

    const colors = new Array(4096 * 4);
    for (let [barcode, index] of Object.entries(glUtils._barcodeToLUTIndex)) {
        // Get color, shape, etc. from HTML input elements for barcode
        const key = glUtils._barcodeToKey[barcode];  // Could be barcode or gene name
        const hexColor = document.getElementById(key + "-color-ISS").value;
        const shape = document.getElementById(key + "-shape-ISS").value;
        const visible = showAll || markerUtils._checkBoxes[key].checked;
        colors[4 * index + 0] = Number("0x" + hexColor.substring(1,3)); 
        colors[4 * index + 1] = Number("0x" + hexColor.substring(3,5));
        colors[4 * index + 2] = Number("0x" + hexColor.substring(5,7));
        colors[4 * index + 3] = Number(visible) * (Number(shape) + 1);
    }

    const bytedata = new Uint8Array(colors);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4096, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


glUtils._createColorScaleTexture = function(gl) {
    const bytedata = new Uint8Array(256 * 4);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}


glUtils._formatHex = function(color) {
    if (color.includes("rgb")) {
        const r = color.split(",")[0].replace("rgb(", "").replace(")", "");
        const g = color.split(",")[1].replace("rgb(", "").replace(")", "");
        const b = color.split(",")[2].replace("rgb(", "").replace(")", "");
        const hex = (Number(r) * 65536 + Number(g) * 256 + Number(b)).toString(16);
        color = "#" + ("0").repeat(6 - hex.length) + hex;
    }
    return color;
}


glUtils._updateColorScaleTexture = function(gl, texture) {
    const colors = [];
    for (let i = 0; i < 256; ++i) {
        const normalized = i / 255.0;
        if (glUtils._colorscaleName.includes("interpolate") &&
            !glUtils._colorscaleName.includes("Rainbow")) {
            const color = d3[glUtils._colorscaleName](normalized);
            const hexColor = glUtils._formatHex(color);  // D3 sometimes returns RGB strings
            colors[4 * i + 0] = Number("0x" + hexColor.substring(1,3));
            colors[4 * i + 1] = Number("0x" + hexColor.substring(3,5));
            colors[4 * i + 2] = Number("0x" + hexColor.substring(5,7));
            colors[4 * i + 3] = 1.0;
        } else {
            // Use a version of Google's Turbo colormap with brighter blue range
            // Reference: https://www.shadertoy.com/view/WtGBDw
            const r = Math.sin((normalized - 0.33) * 3.141592);
            const g = Math.sin((normalized + 0.00) * 3.141592);
            const b = Math.sin((normalized + 0.33) * 3.141592);
            const s = 1.0 - normalized;  // For purplish tone at end of the range
            colors[4 * i + 0] = Math.max(0.0, Math.min(1.0, r * (1.0 - 0.5 * b*b) + s*s)) * 255.99;
            colors[4 * i + 1] = Math.max(0.0, Math.min(1.0, g * (1.0 - r*r * b*b))) * 255.99;
            colors[4 * i + 2] = Math.max(0.0, Math.min(1.0, b * (1.0 - 0.5 * r*r))) * 255.99;
            colors[4 * i + 3] = 1.0;
        }
    }
    glUtils._colorscaleData = colors;

    const bytedata = new Uint8Array(colors);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


glUtils._updateColorbarCanvas = function(colorscaleName, colorscaleData, propertyName, propertyRange) {
    const canvas = document.getElementById("CP_colorbar");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!glUtils._showColorbar || colorscaleName == "null") return;

    const gradient = ctx.createLinearGradient(64, 0, 256+64, 0);
    const numStops = 32;
    for (let i = 0; i < numStops; ++i) {
        const normalized = i / (numStops - 1);
        const index = Math.floor(normalized * 255.99);
        const r = Math.floor(colorscaleData[4 * index + 0]);
        const g = Math.floor(colorscaleData[4 * index + 1]);
        const b = Math.floor(colorscaleData[4 * index + 2]);
        gradient.addColorStop(normalized, "rgb(" + r + "," + g + "," + b + ")");
    }

    // Draw colorbar (with outline)
    ctx.fillStyle = gradient;
    ctx.fillRect(64, 64, 256, 16);
    ctx.strokeStyle = "#555";
    ctx.strokeRect(64, 64, 256, 16);

    // Convert range annotations to scientific notation if they may overflow
    let propertyMin = propertyRange[0].toString();
    let propertyMax = propertyRange[1].toString();
    if (propertyMin.length > 9) propertyMin = propertyRange[0].toExponential(5);
    if (propertyMax.length > 9) propertyMax = propertyRange[1].toExponential(5);

    // Draw annotations (with drop shadow)
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000";  // Shadow color
    ctx.fillText(propertyName, ctx.canvas.width/2+1, 32+1);
    ctx.fillText(propertyMin, ctx.canvas.width/2-128+1, 56+1);
    ctx.fillText(propertyMax, ctx.canvas.width/2+128+1, 56+1);
    ctx.fillStyle = "#fff";  // Text color
    ctx.fillText(propertyName, ctx.canvas.width/2, 32);
    ctx.fillText(propertyMin, ctx.canvas.width/2-128, 56);
    ctx.fillText(propertyMax, ctx.canvas.width/2+128, 56);
}


// Creates a 2D-canvas for drawing the colorbar on top of the WebGL-canvas
glUtils._createColorbarCanvas = function() {
    const root = document.getElementById("gl_canvas").parentElement;
    const canvas = document.createElement("canvas");
    root.appendChild(canvas);

    canvas.id = "CP_colorbar";
    canvas.width = "384";  // Fixed width in pixels
    canvas.height = "96";  // Fixed height in pixels
    canvas.style = "position:relative; float:left; width:31%; left:68%; " +
                   "margin-top:-9%; z-index:20; pointer-events:none";
}


glUtils._loadTextureFromImageURL = function(gl, src) {
    const texture = gl.createTexture();
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);  // Requires power-of-two size images
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    image.src = src;
    return texture;
}


// This function is a workaround for making the area of the OSD navigator show
// through the WebGL canvas
glUtils.clearNavigatorArea = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

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
    const gl = canvas.getContext("webgl", glUtils._options);

    const bounds = tmapp["ISS_viewer"].viewport.getBounds();
    glUtils._viewportRect = [bounds.x, bounds.y, bounds.width, bounds.height];
    const homeBounds = tmapp["ISS_viewer"].world.getHomeBounds();
    glUtils._imageSize = [homeBounds.width, homeBounds.height];
    const orientationDegrees = tmapp["ISS_viewer"].viewport.getRotation();

    // The OSD viewer can be rotated, so need to apply the same transform to markers
    const t = orientationDegrees * (3.141592 / 180.0);
    const viewportTransform = [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)];

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const program = glUtils._programs["markers"];

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const POSITION = gl.getAttribLocation(program, "a_position");
    gl.uniform2fv(gl.getUniformLocation(program, "u_imageSize"), glUtils._imageSize);
    gl.uniform4fv(gl.getUniformLocation(program, "u_viewportRect"), glUtils._viewportRect);
    gl.uniformMatrix2fv(gl.getUniformLocation(program, "u_viewportTransform"), false, viewportTransform);
    gl.uniform2fv(gl.getUniformLocation(program, "u_markerScalarRange"), glUtils._markerScalarRange);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glUtils._textures["colorLUT"]);
    gl.uniform1i(gl.getUniformLocation(program, "u_colorLUT"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glUtils._textures["colorscale"]);
    gl.uniform1i(gl.getUniformLocation(program, "u_colorscale"), 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, glUtils._textures["shapeAtlas"]);
    gl.uniform1i(gl.getUniformLocation(program, "u_shapeAtlas"), 2);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers["barcodeMarkers"]);
    gl.enableVertexAttribArray(POSITION);
    gl.vertexAttribPointer(POSITION, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_markerType"), 0);
    gl.uniform1f(gl.getUniformLocation(program, "u_markerScale"), glUtils._markerScale);
    gl.uniform1i(gl.getUniformLocation(program, "u_useColorFromMarker"), glUtils._useColorFromMarker);
    gl.drawArrays(gl.POINTS, 0, glUtils._numBarcodePoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers["CPMarkers"]);
    gl.enableVertexAttribArray(POSITION);
    gl.vertexAttribPointer(POSITION, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_markerType"), 1);
    gl.uniform1f(gl.getUniformLocation(program, "u_markerScale"), glUtils._markerScale * 0.5);
    gl.uniform1i(gl.getUniformLocation(program, "u_useColorFromMarker"),
        glUtils._colorscaleName.includes("ownColorFromColumn"));
    if (glUtils._colorscaleName != "null") {  // Only show markers when a colorscale is selected
        gl.drawArrays(gl.POINTS, 0, glUtils._numCPPoints);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.BLEND);
    gl.useProgram(null);

    // Clear the redraw flag to avoid markers appearing on top of the OSD
    // navigator after exiting and entering the OSD canvas
    glUtils._redrawFlag = false;
}


glUtils.resize = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

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
    const gl = canvas.getContext("webgl", glUtils._options);

    if (glUtils._numBarcodePoints > 0) {  // LUTs are currently only used for barcode data
        console.log("Update LUTs");
        glUtils._updateColorLUTTexture(gl, glUtils._textures["colorLUT"]);
    }
}


glUtils.init = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

    this._programs["markers"] = this._loadShaderProgram(gl, this._markersVS, this._markersFS);
    this._buffers["barcodeMarkers"] = this._createDummyMarkerBuffer(gl, this._numBarcodePoints);
    this._buffers["CPMarkers"] = this._createDummyMarkerBuffer(gl, this._numCPMarkers);
    this._textures["colorLUT"] = this._createColorLUTTexture(gl);
    this._textures["colorscale"] = this._createColorScaleTexture(gl);
    this._textures["shapeAtlas"] = this._loadTextureFromImageURL(gl, "markershapes.png");

    this._createColorbarCanvas();  // The colorbar is drawn separately in a 2D-canvas

    glUtils.updateMarkerScale();
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.updateMarkerScale);
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.draw);
    document.getElementById("ISS_markers").addEventListener("change", glUtils.updateLUTTextures);
    document.getElementById("ISS_markers").addEventListener("change", glUtils.draw);

    tmapp["hideSVGMarkers"] = true;
}
