/**
* @file glUtils.js Handling WebGL stuff (shader loading, etc.)
* @author Fredrik Nysjo
* @see {@link glUtils}
*/
glUtils = {
    _program: null,
    _buffer: null
}


glUtils._vertSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;

    varying vec4 v_color;

    void main()
    {
        v_color = a_color;
        gl_Position = a_position;
    }
`;


glUtils._fragSource = `
    precision mediump float;

    varying vec4 v_color;

    void main()
    {
        gl_FragColor = v_color;
    }
`;


glUtils._loadShaderProgram = function(gl, vertSource, fragSource) {
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.log('Could not compile vertex shader: ' + gl.getShaderInfoLog(vertShader));
        gl.deleteShader(vertShader);
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.log('Could not compile fragment shader: ' + gl.getShaderInfoLog(fragShader));
        gl.deleteShader(fragShader);
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('Unable to link shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}


glUtils._createTriangleBuffer = function(gl) {
    var positions = [-0.5, -0.5, 0.5, -0.5, 0.0, 0.5];
    var colors = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
    var bytedata = new Float32Array(positions.concat(colors));

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, bytedata, gl.STATIC_DRAW);

    return buffer;
}


glUtils.draw = function() {
    console.log("Draw!");

    var canvas = document.getElementById("gl_canvas");
    var gl = canvas.getContext("webgl");

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = glUtils._program;
    var buffer = glUtils._buffer;

    gl.useProgram(program);
    var POSITION = gl.getAttribLocation(program, 'a_position');
    var COLOR = gl.getAttribLocation(program, 'a_color');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(POSITION);
    gl.vertexAttribPointer(POSITION, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR);
    gl.vertexAttribPointer(COLOR, 3, gl.FLOAT, false, 0, 24);  // HACK
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}


glUtils.init = function() {
    console.log("Init!");

    var canvas = document.getElementById("gl_canvas");
    var gl = canvas.getContext("webgl");

    var vertSource = glUtils._vertSource;
    var fragSource = glUtils._fragSource;
    glUtils._program = glUtils._loadShaderProgram(gl, vertSource, fragSource);

    glUtils._buffer = glUtils._createTriangleBuffer(gl); 
}
