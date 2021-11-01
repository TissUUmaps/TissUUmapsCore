/**
* @file glUtils.js Utilities for WebGL-based marker drawing
* @author Fredrik Nysjo
* @see {@link glUtils}
*/
glUtils = {
    _initialized: false,
    _imageSize: [1, 1],
    _viewportRect: [0, 0, 1, 1],
    _options: {antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true},

    // WebGL resources
    _programs: {},
    _buffers: {},
    _textures: {},

    // Marker settings and info stored per UID (this could perhaps be
    // better handled by having an object per UID that stores all info
    // and is easy to delete when closing a marker tab...)
    _numPoints: {},              // {uid: numPoints, ...}
    _markerScalarRange: {},      // {uid: [minval, maxval], ...}
    _markerScalarPropertyName: {},  // {uid: string, ...}
    _markerOpacity: {},          // {uid: alpha, ...}
    _useColorFromMarker: {},     // {uid: boolean, ...}
    _useColorFromColormap: {},   // {uid: boolean, ...}
    _useScaleFromMarker: {},     // {uid: boolean, ...}
    _usePiechartFromMarker: {},  // {uid: boolean, ...}
    _useShapeFromMarker: {},     // {uid: boolean, ...}
    _colorscaleName: {},         // {uid: colorscaleName, ...}
    _colorscaleData: {},         // {uid: array of RGBA values, ...}
    _barcodeToLUTIndex: {},      // {uid: dict, ...}
    _barcodeToKey: {},           // {uid: dict, ...}

    // Global marker settings and info
    _markerScale: 1.0,
    _useMarkerScaleFix: true,
    _globalMarkerScale: 1.0,
    _pickingEnabled: false,
    _pickingLocation: [0.0, 0.0],
    _pickedMarker: [-1, -1],
    _showColorbar: true,
    _showMarkerInfo: true,
    _piechartPalette: ["#fff100", "#ff8c00", "#e81123", "#ec008c", "#68217a", "#00188f", "#00bcf2", "#00b294", "#009e49", "#bad80a"]
}


glUtils._markersVS = `
    uniform vec2 u_imageSize;
    uniform vec4 u_viewportRect;
    uniform mat2 u_viewportTransform;
    uniform float u_markerScale;
    uniform float u_globalMarkerScale;
    uniform vec2 u_markerScalarRange;
    uniform float u_markerOpacity;
    uniform bool u_useColorFromMarker;
    uniform bool u_useColorFromColormap;
    uniform bool u_usePiechartFromMarker;
    uniform bool u_useShapeFromMarker;
    uniform bool u_alphaPass;
    uniform float u_pickedMarker;
    uniform sampler2D u_colorLUT;
    uniform sampler2D u_colorscale;

    attribute vec4 a_position;
    attribute float a_index;
    attribute float a_scale;

    varying vec4 v_color;
    varying vec2 v_shapeOrigin;
    varying float v_shapeSector;
    varying float v_shapeSize;

    #define SHAPE_INDEX_CIRCLE 7.0
    #define SHAPE_INDEX_CIRCLE_NOSTROKE 16.0
    #define SHAPE_GRID_SIZE 4.0
    #define DISCARD_VERTEX { gl_Position = vec4(2.0, 2.0, 2.0, 0.0); return; }

    vec3 hex_to_rgb(float v)
    {
        // Extract RGB color from 24-bit hex color stored in float
        v = clamp(v, 0.0, 16777215.0);
        return floor(mod((v + 0.49) / vec3(65536.0, 256.0, 1.0), 256.0)) / 255.0;
    }

    void main()
    {
        vec2 imagePos = a_position.xy * u_imageSize;
        vec2 viewportPos = imagePos - u_viewportRect.xy;
        vec2 ndcPos = (viewportPos / u_viewportRect.zw) * 2.0 - 1.0;
        ndcPos.y = -ndcPos.y;
        ndcPos = u_viewportTransform * ndcPos;

        float barcodeID = mod(a_position.z, 4096.0);
        v_color = texture2D(u_colorLUT, vec2(barcodeID / 4095.0, 0.5));

        if (u_useColorFromMarker || u_useColorFromColormap) {
            vec2 range = u_markerScalarRange;
            float normalized = (a_position.w - range[0]) / (range[1] - range[0]);
            v_color.rgb = texture2D(u_colorscale, vec2(normalized, 0.5)).rgb;
            if (u_useColorFromMarker) v_color.rgb = hex_to_rgb(a_position.w);
        }

        if (u_useShapeFromMarker && v_color.a > 0.0) {
            // Add one to marker index and normalize, to make things consistent
            // with how marker visibility and shape is stored in the LUT
            v_color.a = (floor(a_position.z / 4096.0) + 1.0) / 255.0;
        }

        if (u_usePiechartFromMarker && v_color.a > 0.0) {
            v_shapeSector = a_position.z / 16777215.0;
            v_color.rgb = hex_to_rgb(a_position.w);
            v_color.a = SHAPE_INDEX_CIRCLE_NOSTROKE / 255.0;
            if (u_pickedMarker == a_index) v_color.a = SHAPE_INDEX_CIRCLE / 255.0;
            if (u_alphaPass) v_color.a *= float(v_shapeSector > 0.999);
        }

        gl_Position = vec4(ndcPos, 0.0, 1.0);
        gl_PointSize = max(2.0, min(256.0, a_scale * u_markerScale * u_globalMarkerScale / u_viewportRect.w));

        v_shapeOrigin.x = mod((v_color.a + 0.00001) * 255.0 - 1.0, SHAPE_GRID_SIZE);
        v_shapeOrigin.y = floor(((v_color.a + 0.00001) * 255.0 - 1.0) / SHAPE_GRID_SIZE);
        v_shapeSize = gl_PointSize;

        // Discard point here in vertex shader if marker is hidden
        v_color.a = v_color.a > 0.0 ? u_markerOpacity : 0.0;
        if (v_color.a == 0.0) DISCARD_VERTEX;
    }
`;


glUtils._markersFS = `
    precision mediump float;

    uniform bool u_usePiechartFromMarker;
    uniform bool u_alphaPass;
    uniform sampler2D u_shapeAtlas;

    varying vec4 v_color;
    varying vec2 v_shapeOrigin;
    varying float v_shapeSector;
    varying float v_shapeSize;

    #define UV_SCALE 0.7
    #define SHAPE_GRID_SIZE 4.0

    float sectorToAlpha(float sector, vec2 uv)
    {
        vec2 dir = normalize(uv - 0.5);
        float theta = atan(dir.x, dir.y);
        return float(theta < (sector * 2.0 - 1.0) * 3.141592);
    }

    float sectorToAlphaAA(float sector, vec2 uv, float delta)
    {
        // This workaround avoids the problem with small pixel-wide
        // gaps that can appear between the first and last sector
        if (uv.y < 0.5 && abs(uv.x - 0.5) < delta) return 1.0;

        float accum = 0.0;
        accum += sectorToAlpha(sector, uv + vec2(-delta, -delta));
        accum += sectorToAlpha(sector, uv + vec2(delta, -delta));
        accum += sectorToAlpha(sector, uv + vec2(-delta, delta));
        accum += sectorToAlpha(sector, uv + vec2(delta, delta));
        return accum / 4.0;
    }

    void main()
    {
        vec2 uv = (gl_PointCoord.xy - 0.5) * UV_SCALE + 0.5;
        uv = (uv + v_shapeOrigin) * (1.0 / SHAPE_GRID_SIZE);

        vec4 shapeColor = texture2D(u_shapeAtlas, uv, -0.5);
        float shapeColorBias = max(0.0, 1.0 - v_shapeSize * 0.2);
        shapeColor.rgb = clamp(shapeColor.rgb + shapeColorBias, 0.0, 1.0);

        if (u_usePiechartFromMarker && !u_alphaPass) {
            float delta = 0.25 / v_shapeSize;
            shapeColor.a *= sectorToAlphaAA(v_shapeSector, gl_PointCoord, delta);
        }

        gl_FragColor = shapeColor * v_color;
        if (gl_FragColor.a < 0.01) discard;
    }
`;


glUtils._pickingVS = `
    uniform vec2 u_imageSize;
    uniform vec4 u_viewportRect;
    uniform mat2 u_viewportTransform;
    uniform vec2 u_canvasSize;
    uniform vec2 u_pickingLocation;
    uniform float u_markerScale;
    uniform float u_globalMarkerScale;
    uniform int u_op;
    uniform sampler2D u_colorLUT;

    attribute vec4 a_position;
    attribute float a_index;
    attribute float a_scale;

    varying vec4 v_color;

    #define OP_CLEAR 0
    #define OP_WRITE_INDEX 1

    #define DISCARD_VERTEX { gl_Position = vec4(2.0, 2.0, 2.0, 0.0); return; }

    vec3 hex_to_rgb(float v)
    {
        // Extract RGB color from 24-bit hex color stored in float
        v = clamp(v, 0.0, 16777215.0);
        return floor(mod((v + 0.49) / vec3(65536.0, 256.0, 1.0), 256.0)) / 255.0;
    }

    void main()
    {
        vec2 imagePos = a_position.xy * u_imageSize;
        vec2 viewportPos = imagePos - u_viewportRect.xy;
        vec2 ndcPos = (viewportPos / u_viewportRect.zw) * 2.0 - 1.0;
        ndcPos.y = -ndcPos.y;
        ndcPos = u_viewportTransform * ndcPos;

        v_color = vec4(0.0);
        if (u_op == OP_WRITE_INDEX) {
            float barcodeID = mod(a_position.z, 4096.0);
            float shapeID = texture2D(u_colorLUT, vec2(barcodeID / 4095.0, 0.5)).a;
            if (shapeID == 0.0) DISCARD_VERTEX;

            vec2 canvasPos = (ndcPos * 0.5 + 0.5) * u_canvasSize;
            canvasPos.y = (u_canvasSize.y - canvasPos.y);  // Y-axis is inverted
            float pointSize = max(2.0, min(256.0, a_scale * u_markerScale * u_globalMarkerScale / u_viewportRect.w));
            
            // TODO This test works as an inside/outside test for the special
            // case where the marker shape is round; for the general case, we
            // would need to sample the shape texture of each marker.
            if (length(canvasPos - u_pickingLocation) > pointSize * 0.4) DISCARD_VERTEX;

            v_color.rgb = hex_to_rgb(a_index + float(u_op));
        }

        gl_Position = vec4(-0.9999, -0.9999, 0.0, 1.0);
        gl_PointSize = 1.0;
    }
`;


glUtils._pickingFS = `
    precision mediump float;

    varying vec4 v_color;

    void main()
    {
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


glUtils._createMarkerBuffer = function(gl, numPoints) {
    const positions = [], indices = [], scales = [];
    for (let i = 0; i < numPoints; ++i) {
        positions[4 * i + 0] = Math.random();  // X-coord
        positions[4 * i + 1] = Math.random();  // Y-coord
        positions[4 * i + 2] = Math.random();  // LUT-coord
        positions[4 * i + 3] = i / numPoints;  // Scalar data
        indices[i] = i;  // Store index needed for picking
        scales[i] = 1.0;  // Marker scale factor
    }

    const bytedata = new Float32Array(positions.concat(indices.concat(scales)));

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}


// Create a list of normalized sector angles in format (TODO)
glUtils._createPiechartAngles = function(sectors) {
    let angles = [], sum = 0.0;
    for (let i = 0; i < sectors.length; ++i) {
        sum += Number(sectors[i]);
    }
    for (let i = 0; i < sectors.length; ++i) {
        angles[i] = Number(sectors[i]) / sum;
    }
    for (let i = sectors.length - 2; i >= 0; --i) {
        angles[i] += angles[i + 1];
    }
    return angles;
}


// Load markers loaded from CSV file into vertex buffer
glUtils.loadMarkers = function(uid) {
    if (!glUtils._initialized) return;
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

    // Get marker data and other info like image size
    const markerData = dataUtils.data[uid]["_processeddata"];
    let numPoints = markerData.length;
    const keyName = dataUtils.data[uid]["_gb_col"];
    const xPosName = dataUtils.data[uid]["_X"];
    const yPosName = dataUtils.data[uid]["_Y"];
    const imageWidth = OSDViewerUtils.getImageWidth();
    const imageHeight = OSDViewerUtils.getImageHeight();

    // If new marker data was loaded, we need to assign each barcode an index
    // that we can use with the LUT textures for color, visibility, etc.
    glUtils._updateBarcodeToLUTIndexDict(uid, markerData, keyName);
    const barcodeToLUTIndex = glUtils._barcodeToLUTIndex[uid];

    // Check how the user wants to draw the markers
    const colorPropertyName = dataUtils.data[uid]["_cb_col"];
    const useColorFromMarker = (dataUtils.data[uid]["_cb_col"] != null && dataUtils.data[uid]["_cb_cmap"] == null);
    let hexColor = "#000000";

    const scalarPropertyName = dataUtils.data[uid]["_cb_col"];
    const colorscaleName = dataUtils.data[uid]["_cb_cmap"];
    const useColorFromColormap = dataUtils.data[uid]["_cb_cmap"] != null;
    let scalarRange = [1e9, -1e9];  // This range will be computed from the data

    const scalePropertyName = dataUtils.data[uid]["_scale_col"];
    const useScaleFromMarker = dataUtils.data[uid]["_scale_col"] != null;

    const sectorsPropertyName = dataUtils.data[uid]["_pie_col"];
    const usePiechartFromMarker = dataUtils.data[uid]["_pie_col"] != null;
    const piechartPalette = glUtils._piechartPalette;

    const shapePropertyName = dataUtils.data[uid]["_shape_col"];
    const useShapeFromMarker = dataUtils.data[uid]["_shape_col"] != null;
    const numShapes = Object.keys(markerUtils._symbolStrings).length;
    let shapeIndex = 0;

    // Create vertex data for markers
    const positions = [], indices = [], scales = [];
    if (usePiechartFromMarker) {
        const numSectors = markerData[0][sectorsPropertyName].split(";").length;
        for (let i = 0; i < numPoints; ++i) {
            const sectors = markerData[i][sectorsPropertyName].split(";");
            const piechartAngles = glUtils._createPiechartAngles(sectors);
            for (let j = 0; j < numSectors; ++j) {
                const k = (i * numSectors + j);
                hexColor = piechartPalette[j % piechartPalette.length];
                positions[4 * k + 0] = markerData[i][xPosName] / imageWidth;
                positions[4 * k + 1] = markerData[i][yPosName] / imageHeight;
                positions[4 * k + 2] = barcodeToLUTIndex[markerData[i][keyName]] +
                                       Math.floor(piechartAngles[j] * 4095.0) * 4096.0;
                positions[4 * k + 3] = Number("0x" + hexColor.substring(1,7));
                indices[k] = i;  // Store index needed for picking
                if (useScaleFromMarker) scales[k] = markerData[i][scalePropertyName];
                else scales[k] = 1.0;  // Marker scale factor
            }
        }
        numPoints *= numSectors;
    } else {
        for (let i = 0; i < numPoints; ++i) {
            if (useColorFromMarker) hexColor = markerData[i][colorPropertyName];
            if (useColorFromColormap) scalarValue = markerData[i][scalarPropertyName];
            if (useShapeFromMarker) {
                // Assume that it is the shape name that is stored in the data
                shapeIndex = markerUtils._symbolStrings.indexOf(markerData[i][shapePropertyName]);
                shapeIndex = Math.max(0.0, Math.floor(Number(shapeIndex))) % numShapes;
            }

            positions[4 * i + 0] = markerData[i][xPosName] / imageWidth;
            positions[4 * i + 1] = markerData[i][yPosName] / imageHeight;
            positions[4 * i + 2] = barcodeToLUTIndex[markerData[i][keyName]] +
                                   Number(shapeIndex) * 4096.0;
            positions[4 * i + 3] = useColorFromColormap ? Number(scalarValue)
                                                        : Number("0x" + hexColor.substring(1,7));
            indices[i] = i;  // Store index needed for picking

            if (useScaleFromMarker) scales[i] = markerData[i][scalePropertyName];
            else scales[i] = 1.0;  // Marker scale factor
            if (useColorFromColormap) {
                scalarRange[0] = Math.min(scalarRange[0], scalarValue);
                scalarRange[1] = Math.max(scalarRange[1], scalarValue);
            }
        }
    }

    if (!(uid + "_markers" in glUtils._buffers)) {
        document.getElementById(uid + "_menu-UI").addEventListener("input", glUtils.updateColorLUTTextures);
        document.getElementById(uid + "_menu-UI").addEventListener("input", glUtils.draw);
    }

    // Create WebGL objects (if this has not already been done)
    if (!(uid + "_markers" in glUtils._buffers))
        glUtils._buffers[uid + "_markers"] = glUtils._createMarkerBuffer(gl, numPoints);
    if (!(uid + "_colorLUT" in glUtils._textures))
        glUtils._textures[uid + "_colorLUT"] = glUtils._createColorLUTTexture(gl);
    if (!(uid + "_colorscale" in glUtils._textures))
        glUtils._textures[uid + "_colorscale"] = glUtils._createColorScaleTexture(gl);

    // Upload vertex data to buffer
    const bytedata = new Float32Array(positions.concat(indices.concat(scales)));
    gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers[uid + "_markers"]);
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Update marker info and LUT + colormap textures
    glUtils._numPoints[uid] = numPoints;
    glUtils._markerOpacity[uid] = 1.0;  // TODO
    glUtils._markerScalarRange[uid] = scalarRange;
    glUtils._markerScalarPropertyName[uid] = scalarPropertyName;
    glUtils._colorscaleName[uid] = colorscaleName;
    glUtils._useColorFromMarker[uid] = useColorFromMarker;
    glUtils._useColorFromColormap[uid] = useColorFromColormap;
    glUtils._useScaleFromMarker[uid] = useScaleFromMarker;
    glUtils._usePiechartFromMarker[uid] = usePiechartFromMarker;
    glUtils._useShapeFromMarker[uid] = useShapeFromMarker;
    if (useColorFromColormap) {
        glUtils._updateColorScaleTexture(gl, uid, glUtils._textures[uid + "_colorscale"]);
    }
    glUtils._updateColorbarCanvas();
    glUtils._updateColorLUTTexture(gl, uid, glUtils._textures[uid + "_colorLUT"]);
}


glUtils.deleteMarkers = function(uid) {
    if (!glUtils._initialized) return;
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

    if (!(uid in glUtils._numPoints)) return;  // Assume markers are already deleted

    // Delete marker settings and info for UID
    delete glUtils._numPoints[uid];
    delete glUtils._markerScalarRange[uid];
    delete glUtils._markerOpacity[uid];
    delete glUtils._useColorFromMarker[uid];
    delete glUtils._useColorFromColormap[uid];
    delete glUtils._useScaleFromMarker[uid];
    delete glUtils._usePiechartFromMarker[uid];
    delete glUtils._colorscaleName[uid];
    delete glUtils._colorscaleData[uid];
    delete glUtils._barcodeToLUTIndex[uid];
    delete glUtils._barcodeToKey[uid];

    // Clean up WebGL resources
    gl.deleteBuffer(glUtils._buffers[uid + "_markers"]);
    gl.deleteTexture(glUtils._textures[uid + "_colorLUT"]);
    gl.deleteTexture(glUtils._textures[uid + "_colorscale"]);

    // Make sure colorbar is also deleted from the 2D canvas
    glUtils._updateColorbarCanvas();
}


// TODO Fix naming of this function, since we now use it for generic markers
glUtils._updateBarcodeToLUTIndexDict = function (uid, markerData, keyName) {
    const barcodeToLUTIndex = {};
    const barcodeToKey = {};
    const numPoints = markerData.length;
    for (let i = 0, index = 0; i < numPoints; ++i) {
        const barcode = markerData[i][keyName];
        if (!(barcode in barcodeToLUTIndex)) {
            barcodeToLUTIndex[barcode] = index++;
            barcodeToKey[barcode] = barcode;
            index = index % 4096;  // Prevent index from becoming >= the maximum LUT size,
                                   // since this causes problems with pie-chart markers
        }
    }
    glUtils._barcodeToLUTIndex[uid] = barcodeToLUTIndex;
    glUtils._barcodeToKey[uid] = barcodeToKey;
    console.log("barcodeToLUTIndex, barcodeToKey", barcodeToLUTIndex, barcodeToKey);
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


glUtils._updateColorLUTTexture = function(gl, uid, texture) {
    if (!(uid + "_colorLUT" in glUtils._textures)) return;

    const colors = new Array(4096 * 4);
    for (let [barcode, index] of Object.entries(glUtils._barcodeToLUTIndex[uid])) {
        const key = (barcode != "undefined" ? glUtils._barcodeToKey[uid][barcode] : "All");
        console.log("key",key, barcode);
        const inputs = interfaceUtils._mGenUIFuncs.getGroupInputs(uid, key);
        const hexColor = "color" in inputs ? inputs["color"] : "#ffff00";
        const shape = "shape" in inputs ? inputs["shape"] : "circle";
        const visible = "visible" in inputs ? inputs["visible"] : true;
        // OBS! Need to clamp this value, since indexOf() can return -1
        const shapeIndex = Math.max(0, markerUtils._symbolStrings.indexOf(shape));

        colors[4 * index + 0] = Number("0x" + hexColor.substring(1,3)); 
        colors[4 * index + 1] = Number("0x" + hexColor.substring(3,5));
        colors[4 * index + 2] = Number("0x" + hexColor.substring(5,7));
        colors[4 * index + 3] = Number(visible) * (Number(shapeIndex) + 1);
    }

    const bytedata = new Uint8Array(colors);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4096, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


glUtils.updateColorLUTTextures = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl", glUtils._options);

    for (let [uid, numPoints] of Object.entries(glUtils._numPoints)) {
        glUtils._updateColorLUTTexture(gl, uid, glUtils._textures[uid + "_colorLUT"]);
    }
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


glUtils._updateColorScaleTexture = function(gl, uid, texture) {
    const colors = [];
    const colorscaleName = glUtils._colorscaleName[uid];
    console.log(colorscaleName);
    for (let i = 0; i < 256; ++i) {
        const normalized = i / 255.0;
        if (colorscaleName.includes("interpolate") &&
            !colorscaleName.includes("Rainbow")) {
            const color = d3[colorscaleName](normalized);
            const hexColor = glUtils._formatHex(color);  // D3 sometimes returns RGB strings
            colors[4 * i + 0] = Number("0x" + hexColor.substring(1,3));
            colors[4 * i + 1] = Number("0x" + hexColor.substring(3,5));
            colors[4 * i + 2] = Number("0x" + hexColor.substring(5,7));
            colors[4 * i + 3] = 255.0;
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
            colors[4 * i + 3] = 255.0;
        }
    }
    glUtils._colorscaleData[uid] = colors;

    const bytedata = new Uint8Array(colors);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, bytedata);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


glUtils._updateColorbarCanvas = function() {
    const canvas = document.getElementById("colorbar_canvas");
    const ctx = canvas.getContext("2d");

    // Determine canvas height needed to show colorbars for all markersets that
    // have colormaps
    let canvasHeight = 0;
    const rowHeight = 70;  // Note: hardcoded value
    for (let [uid, numPoints] of Object.entries(glUtils._numPoints)) {
        if (glUtils._showColorbar && glUtils._useColorFromColormap[uid])
            canvasHeight += rowHeight + 10;
    }
    canvasHeight -= 10; // No margin for last colorbar 

    // Resize and clear canvas
    ctx.canvas.height = canvasHeight;
    ctx.canvas.style.marginTop = -canvasHeight + "px";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (ctx.canvas.height == -10) {
        ctx.canvas.className = "d-none";
        return;  // Nothing more to do for empty canvas
    }
    ctx.canvas.className = "viewer-layer";
    // Create colorbars for the markersets
    let yOffset = 0;
    for (let [uid, numPoints] of Object.entries(glUtils._numPoints)) {
        if (!glUtils._useColorFromColormap[uid]) continue;

        const propertyRange = glUtils._markerScalarRange[uid];
        const propertyName = glUtils._markerScalarPropertyName[uid];
        const colorscaleData = glUtils._colorscaleData[uid];

        // Define gradient for color scale
        const gradient = ctx.createLinearGradient(5, 0, 256+5, 0);
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
        ctx.fillRect(5, 48 + yOffset, 256, 16);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(5, 48 + yOffset, 256, 16);

        // Convert range annotations to precision 7 and remove trailing zeros
        let propertyMin = propertyRange[0].toPrecision(7).replace(/\.([^0]+)0+$/,".$1");
        let propertyMax = propertyRange[1].toPrecision(7).replace(/\.([^0]+)0+$/,".$1");
        // Convert range annotations to scientific notation if they may overflow
        if (propertyMin.length > 9) propertyMin = propertyRange[0].toExponential(5);
        if (propertyMax.length > 9) propertyMax = propertyRange[1].toExponential(5);
        // Get marker tab name to show together with property name
        const tabName = interfaceUtils.getElementById(uid + "_marker-tab-name").textContent;
        let label = tabName + "." + propertyName;

        // Draw annotations (with drop shadow)
        ctx.font = "16px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillStyle = "#000";  // Shadow color
        ctx.fillText(label, ctx.canvas.width/2+1, 18+1 + yOffset);
        ctx.textAlign = "left";
        ctx.fillText(propertyMin, ctx.canvas.width/2-128+1, 40+1 + yOffset);
        ctx.textAlign = "right";
        ctx.fillText(propertyMax, ctx.canvas.width/2+128+1, 40+1 + yOffset);
        yOffset += rowHeight + 10;  // Move to next colorbar row
    }
}


// Creates a 2D-canvas for drawing the colorbar on top of the WebGL-canvas
glUtils._createColorbarCanvas = function() {
    const root = document.getElementById("gl_canvas").parentElement;
    const canvas = document.createElement("canvas");
    root.appendChild(canvas);

    canvas.id = "colorbar_canvas";
    canvas.className = "d-none";
    canvas.width = "266";  // Fixed width in pixels
    canvas.height = "96";  // Fixed height in pixels
    canvas.style = "position:relative; float:right; width:266px; bottom: 11px; right: 14px; " +
                   "margin-top:-96px; z-index:20; pointer-events:none";
}


// Creates WebGL canvas for drawing the markers
glUtils._createMarkerWebGLCanvas = function() {
    const canvas = document.createElement("canvas");
    canvas.id = "gl_canvas";
    canvas.width = "1"; canvas.height = "1";
    canvas.style = "position:relative; pointer-events:none; z-index: 12;";
    return canvas;
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


// @deprecated Not required anymore, but kept for backwards-compatibility
glUtils.clearNavigatorArea = function() {}


glUtils.drawColorPass = function(gl, viewportTransform, markerScaleAdjusted) {
    // Set up render pipeline
    const program = glUtils._programs["markers"];
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const POSITION = gl.getAttribLocation(program, "a_position");
    const INDEX = gl.getAttribLocation(program, "a_index");
    const SCALE = gl.getAttribLocation(program, "a_scale");

    gl.uniform2fv(gl.getUniformLocation(program, "u_imageSize"), glUtils._imageSize);
    gl.uniform4fv(gl.getUniformLocation(program, "u_viewportRect"), glUtils._viewportRect);
    gl.uniformMatrix2fv(gl.getUniformLocation(program, "u_viewportTransform"), false, viewportTransform);
    gl.uniform1f(gl.getUniformLocation(program, "u_markerScale"), markerScaleAdjusted);
    gl.uniform1f(gl.getUniformLocation(program, "u_globalMarkerScale"), glUtils._globalMarkerScale);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, glUtils._textures["shapeAtlas"]);
    gl.uniform1i(gl.getUniformLocation(program, "u_shapeAtlas"), 2);

    for (let [uid, numPoints] of Object.entries(glUtils._numPoints)) {
        if (numPoints == 0) continue;

        gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers[uid + "_markers"]);
        gl.enableVertexAttribArray(POSITION);
        gl.vertexAttribPointer(POSITION, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(INDEX);
        gl.vertexAttribPointer(INDEX, 1, gl.FLOAT, false, 0, numPoints * 16);
        gl.enableVertexAttribArray(SCALE);
        gl.vertexAttribPointer(SCALE, 1, gl.FLOAT, false, 0, numPoints * 20);

        gl.uniform2fv(gl.getUniformLocation(program, "u_markerScalarRange"), glUtils._markerScalarRange[uid]);
        gl.uniform1f(gl.getUniformLocation(program, "u_markerOpacity"), glUtils._markerOpacity[uid]);
        gl.uniform1i(gl.getUniformLocation(program, "u_useColorFromMarker"), glUtils._useColorFromMarker[uid]);
        gl.uniform1i(gl.getUniformLocation(program, "u_useColorFromColormap"), glUtils._useColorFromColormap[uid]);
        gl.uniform1i(gl.getUniformLocation(program, "u_usePiechartFromMarker"), glUtils._usePiechartFromMarker[uid]);
        gl.uniform1i(gl.getUniformLocation(program, "u_useShapeFromMarker"), glUtils._useShapeFromMarker[uid]);
        gl.uniform1f(gl.getUniformLocation(program, "u_pickedMarker"),
            glUtils._pickedMarker[0] == uid ? glUtils._pickedMarker[1] : -1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, glUtils._textures[uid + "_colorscale"]);
        gl.uniform1i(gl.getUniformLocation(program, "u_colorscale"), 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glUtils._textures[uid + "_colorLUT"]);
        gl.uniform1i(gl.getUniformLocation(program, "u_colorLUT"), 0);

        if (glUtils._usePiechartFromMarker[uid]) {
            // 1st pass: draw alpha for whole marker shapes
            gl.uniform1i(gl.getUniformLocation(program, "u_alphaPass"), true);
            gl.drawArrays(gl.POINTS, 0, numPoints);
            // 2nd pass: draw colors for individual piechart sectors
            gl.uniform1i(gl.getUniformLocation(program, "u_alphaPass"), false);
            gl.colorMask(true, true, true, false);
            gl.drawArrays(gl.POINTS, 0, numPoints);
            gl.colorMask(true, true, true, true);
        } else {
            gl.drawArrays(gl.POINTS, 0, numPoints);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // Restore render pipeline state
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.BLEND);
    gl.useProgram(null);
}


glUtils.drawPickingPass = function(gl, viewportTransform, markerScaleAdjusted) {
    // Set up render pipeline
    const program = glUtils._programs["picking"];
    gl.useProgram(program);

    const POSITION = gl.getAttribLocation(program, "a_position");
    const INDEX = gl.getAttribLocation(program, "a_index");
    const SCALE = gl.getAttribLocation(program, "a_scale");

    gl.uniform2fv(gl.getUniformLocation(program, "u_imageSize"), glUtils._imageSize);
    gl.uniform4fv(gl.getUniformLocation(program, "u_viewportRect"), glUtils._viewportRect);
    gl.uniformMatrix2fv(gl.getUniformLocation(program, "u_viewportTransform"), false, viewportTransform);
    gl.uniform2fv(gl.getUniformLocation(program, "u_canvasSize"), [gl.canvas.width, gl.canvas.height]);
    gl.uniform2fv(gl.getUniformLocation(program, "u_pickingLocation"), glUtils._pickingLocation);
    gl.uniform1f(gl.getUniformLocation(program, "u_globalMarkerScale"), glUtils._globalMarkerScale);
    gl.uniform1f(gl.getUniformLocation(program, "u_markerScale"), markerScaleAdjusted);

    glUtils._pickedMarker = [-1, -1];  // Reset to no picked marker
    for (let [uid, numPoints] of Object.entries(glUtils._numPoints)) {
        if (numPoints == 0) continue;

        gl.bindBuffer(gl.ARRAY_BUFFER, glUtils._buffers[uid + "_markers"]);
        gl.enableVertexAttribArray(POSITION);
        gl.vertexAttribPointer(POSITION, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(INDEX);
        gl.vertexAttribPointer(INDEX, 1, gl.FLOAT, false, 0, numPoints * 16);
        gl.enableVertexAttribArray(SCALE);
        gl.vertexAttribPointer(SCALE, 1, gl.FLOAT, false, 0, numPoints * 20);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glUtils._textures[uid + "_colorLUT"]);
        gl.uniform1i(gl.getUniformLocation(program, "u_colorLUT"), 0);

        // 1st pass: clear the corner pixel
        gl.uniform1i(gl.getUniformLocation(program, "u_op"), 0);
        gl.drawArrays(gl.POINTS, 0, 1);
        // 2nd pass: draw all the markers (as single pixels)
        gl.uniform1i(gl.getUniformLocation(program, "u_op"), 1);
        gl.drawArrays(gl.POINTS, 0, numPoints);

        // Read back pixel at location (0, 0) to get the picked object
        const result = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);
        const picked = Number(result[2] + result[1] * 256 + result[0] * 65536) - 1;
        if (picked >= 0)
            glUtils._pickedMarker = [uid, picked];
    }

    // Restore render pipeline state
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
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

    // Compute adjusted marker scale so that the actual marker size becomes less
    // dependant on screen resolution or window size
    let markerScaleAdjusted = glUtils._markerScale;
    if (glUtils._useMarkerScaleFix) markerScaleAdjusted *= (gl.canvas.height / 900.0);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    if (glUtils._pickingEnabled) {
        glUtils.drawPickingPass(gl, viewportTransform, markerScaleAdjusted);
        glUtils._pickingEnabled = false;  // Clear flag until next click event
    }

    glUtils.drawColorPass(gl, viewportTransform, markerScaleAdjusted);
}


glUtils.pick = function(event) {
    if (event.quick) {
        glUtils._pickingEnabled = true;
        glUtils._pickingLocation = [event.position.x, event.position.y];
        glUtils.draw();  // This will update the value of glUtils._pickedMarker

        const pickedMarker = glUtils._pickedMarker;
        const hasPickedMarker = pickedMarker[1] >= 0;

        tmapp["ISS_viewer"].removeOverlay("ISS_marker_info");
        if (hasPickedMarker && glUtils._showMarkerInfo) {
            const div = document.createElement("div");
            div.id = "ISS_marker_info";
            div.width = "1px"; div.height = "1px";
            div.innerHTML = pickedMarker;  // FIXME Show ID for now, until makePiechartTable is fixed
            //div.innerHTML = markerUtils.makePiechartTable(dataUtils.data[uid]["ISS_processeddata"][pickedMarker]);
            div.classList.add("viewer-layer", "m-0", "p-1");

            tmapp["ISS_viewer"].addOverlay({
                element: div,
                placement: "TOP_LEFT",
                location: tmapp["ISS_viewer"].viewport.viewerElementToViewportCoordinates(event.position),
                checkResize: false,
                rotationMode: OpenSeadragon.OverlayRotationMode.NO_ROTATION
            });
        }
    }
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


// @deprecated Not required anymore, but kept for backwards-compatibility
glUtils.postRedraw = function() {}


glUtils.updateMarkerScale = function() {
    const globalMarkerSize = Number(document.getElementById("ISS_globalmarkersize_text").value);
    // Clamp the scale factor to avoid giant markers and slow rendering if the
    // user inputs a very large value (say 10000 or something)
    glUtils._markerScale = Math.max(0.01, Math.min(20.0, globalMarkerSize / 25.0));
}


glUtils.init = function() {
    if (glUtils._initialized) return;

    let canvas = document.getElementById("gl_canvas");
    if (!canvas) canvas = this._createMarkerWebGLCanvas();
    const gl = canvas.getContext("webgl", glUtils._options);

    // Place marker canvas under the OSD canvas. Doing this also enables proper
    // compositing with the minimap and other OSD elements.
    const osd = document.getElementsByClassName("openseadragon-canvas")[0];
    osd.appendChild(canvas);

    this._programs["markers"] = this._loadShaderProgram(gl, this._markersVS, this._markersFS);
    this._programs["picking"] = this._loadShaderProgram(gl, this._pickingVS, this._pickingFS);
    this._textures["shapeAtlas"] = this._loadTextureFromImageURL(gl, "misc/markershapes.png");

    this._createColorbarCanvas();  // The colorbar is drawn separately in a 2D-canvas

    glUtils.updateMarkerScale();
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.updateMarkerScale);
    document.getElementById("ISS_globalmarkersize_text").addEventListener("input", glUtils.draw);

    tmapp["hideSVGMarkers"] = true;
    tmapp["ISS_viewer"].removeHandler('resize', glUtils.resizeAndDraw);
    tmapp["ISS_viewer"].addHandler('resize', glUtils.resizeAndDraw);
    tmapp["ISS_viewer"].removeHandler('open', glUtils.draw);
    tmapp["ISS_viewer"].addHandler('open', glUtils.draw);
    tmapp["ISS_viewer"].removeHandler('viewport-change', glUtils.draw);
    tmapp["ISS_viewer"].addHandler('viewport-change', glUtils.draw);
    tmapp["ISS_viewer"].removeHandler('canvas-click', glUtils.pick);
    tmapp["ISS_viewer"].addHandler('canvas-click', glUtils.pick);

    glUtils._initialized = true;
    glUtils.resize();  // Force initial resize to OSD canvas size
}
