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
}


glUtils._markersVS = `
    uniform vec2 u_imageSize;
    uniform vec4 u_viewportRect;

    attribute vec4 a_position;
    attribute vec4 a_color;

    varying vec4 v_color;

    void main()
    {
        vec2 imagePos = (a_position.xy * 0.5 + 0.5) * u_imageSize;
        vec2 viewportPos = imagePos - u_viewportRect.xy;
        vec2 ndcPos = (viewportPos / u_viewportRect.zw) * 2.0 - 1.0;
        ndcPos.y = -ndcPos.y;

        v_color = a_color;
        gl_Position = vec4(ndcPos, 0.0, 1.0);
        gl_PointSize = max(2.0, 1.0 / u_viewportRect.w);
    }
`;


glUtils._markersFS = `
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
        positions[2 * i + 0] = Math.random() * 2.0 - 1.0;
        positions[2 * i + 1] = Math.random() * 2.0 - 1.0;
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

    return buffer;
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

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(POSITION);
    gl.vertexAttribPointer(POSITION, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR);
    gl.vertexAttribPointer(COLOR, 3, gl.FLOAT, false, 0, glUtils._numPoints * 8);  // FIXME
    gl.drawArrays(gl.POINTS, 0, glUtils._numPoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.useProgram(null);
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


glUtils.init = function() {
    const canvas = document.getElementById("gl_canvas");
    const gl = canvas.getContext("webgl");

    this._programs["markers"] = this._loadShaderProgram(gl, this._markersVS, this._markersFS);
    this._buffers["markers"] = this._createDummyMarkerBuffer(gl, this._numPoints);
}
