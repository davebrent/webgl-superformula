var dat = require("dat-gui");
var glMatrix = require("gl-matrix");

var vertShaderSrc = require("glsl!./superformula.vert");
var fragShaderSrc = require("glsl!./superformula.frag");


function getContext (canvas, attributes) {
  return canvas.getContext("webgl", attributes) ||
         canvas.getContext("experimental-webgl", attributes);
}


function setSize (canvas, gl, width, height) {
  var devicePixelRatio = window.devicePixelRatio || 1;

  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  gl.viewportWidth = width * devicePixelRatio;
  gl.viewportHeight = height * devicePixelRatio;
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}


function compileShader (gl, type, src) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (gl.getShaderInfoLog(shader) !== '') {
    var lines = src.split('\n');
    for (var i = 0; i < lines.length; i++) {
      lines[i] = (i + 1) + ':\t' + lines[i];
    }
    console.log(lines.join('\n'));
    throw new Error(gl.getShaderInfoLog(shader));
  }

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
    throw new Error("Shader couldn\'t compile.");
  }

  return shader;
}


function sphere (resolution) {
  var vertices = [];

  for(var i = 0; i < 360; i += resolution) {
    var theta = (i / 180.0) * Math.PI;
    for(var j = 0; j < 360; j += resolution) {
      var phi = (j / 180.0) * Math.PI;
      vertices.push(phi);
      vertices.push(theta);
    }
  }

  return new Float32Array(vertices);
}


function createGUI (gl, callback) {
  var view = new dat.GUI();

  var controller = {
    "rendering": {
      "Auto-rotate": true,
      "Draw mode": gl.POINTS,
      "Background": [0, 0, 0],
      "Color": [255, 255, 255],
      "Opacity": 0.5,
      "Point size": 0.75,
    },
    "shape1": {"m": 3, "n1": 5, "n2": 18, "n3": 18, "Scale": 1},
    "shape2": {"m": 6, "n1": 1, "n2": 1, "n3": 6, "Scale": 1}
  }

  var renderView = view.addFolder("Rendering");
  renderView.add(controller.rendering, "Auto-rotate").onChange(callback);
  renderView.add(controller.rendering, "Draw mode", {
    "Points": gl.POINTS,
    "Lines": gl.LINES,
    "Line loop": gl.LINE_LOOP,
    "Line strip": gl.LINE_STRIP,
    "Triangles": gl.TRIANGLES,
    "Triangle strip": gl.TRIANGLE_STRIP,
    "Triangle fan": gl.TRIANGLE_FAN
  }).onChange(callback);

  renderView.addColor(controller.rendering, "Background").onChange(callback);
  renderView.addColor(controller.rendering, "Color").onChange(callback);
  renderView.add(controller.rendering, "Opacity", 0, 1).onChange(callback);
  renderView.add(controller.rendering, "Point size", 0, 4).onChange(callback);
  renderView.open();

  var shape1View = view.addFolder("Superformula A");
  shape1View.add(controller.shape1, "m", 1, 50).step(1).onChange(callback);
  shape1View.add(controller.shape1, "n1", 1, 50).step(1).onChange(callback);
  shape1View.add(controller.shape1, "n2", 1, 50).step(1).onChange(callback);
  shape1View.add(controller.shape1, "n3", 1, 50).step(1).onChange(callback);
  shape1View.add(controller.shape1, "Scale", 0, 2).onChange(callback);

  var shape2View = view.addFolder("Superformula B");
  shape2View.add(controller.shape2, "m", 1, 50).step(1).onChange(callback);
  shape2View.add(controller.shape2, "n1", 1, 50).step(1).onChange(callback);
  shape2View.add(controller.shape2, "n2", 1, 50).step(1).onChange(callback);
  shape2View.add(controller.shape2, "n3", 1, 50).step(1).onChange(callback);
  shape2View.add(controller.shape2, "Scale", 0, 2).onChange(callback);

  callback(controller);
  return controller;
}


function main (canvas, gl) {
  setSize(canvas, gl, window.innerWidth, window.innerHeight);

  window.addEventListener("resize", function () {
    setSize(canvas, gl, window.innerWidth, window.innerHeight);
  }, false);

  var shader = gl.createProgram();
  gl.attachShader(shader, compileShader(gl, gl.VERTEX_SHADER, vertShaderSrc()));
  gl.attachShader(shader, compileShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc()));
  gl.linkProgram(shader);

  shader.uniforms = {
    m: gl.getUniformLocation(shader, "m"),
    n1: gl.getUniformLocation(shader, "n1"),
    n2: gl.getUniformLocation(shader, "n2"),
    n3: gl.getUniformLocation(shader, "n3"),
    scale: gl.getUniformLocation(shader, "scale"),
    color: gl.getUniformLocation(shader, "color"),
    pointSize: gl.getUniformLocation(shader, "pointSize"),
    projectionMatrix: gl.getUniformLocation(shader, "projectionMatrix"),
    modelViewMatrix: gl.getUniformLocation(shader, "modelViewMatrix")
  };

  shader.attributes = {
    position: gl.getAttribLocation(shader, "position")
  };

  gl.enableVertexAttribArray(shader.attributes.position);

  var phiGeometry = {};
  phiGeometry.buffer = gl.createBuffer();
  phiGeometry.array = sphere(1);
  phiGeometry.itemSize = 2;
  phiGeometry.numItems = phiGeometry.array.length / phiGeometry.itemSize;

  gl.bindBuffer(gl.ARRAY_BUFFER, phiGeometry.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, phiGeometry.array, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shader.attributes.position, phiGeometry.itemSize, gl.FLOAT, false, 0, 0);

  var modelViewMatrix = glMatrix.mat4.create();
  var projectionMatrix = glMatrix.mat4.create();

  gl.useProgram(shader);
  gl.bindBuffer(gl.ARRAY_BUFFER, phiGeometry.buffer);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  var gui = createGUI(gl, function (controller) {
    var params = (gui === undefined) ? controller : gui;
    var clearColor = params.rendering["Background"];
    var color = params.rendering["Color"];
    var opacity = params.rendering["Opacity"];

    gl.clearColor(clearColor[0] / 255, clearColor[1] / 255, clearColor[2] / 255, 1.0);

    gl.uniform2fv(shader.uniforms.m, [params.shape1["m"], params.shape2["m"]]);
    gl.uniform2fv(shader.uniforms.n1, [params.shape1["n1"], params.shape2["n1"]]);
    gl.uniform2fv(shader.uniforms.n2, [params.shape1["n2"], params.shape2["n2"]]);
    gl.uniform2fv(shader.uniforms.n3, [params.shape1["n3"], params.shape2["n3"]]);
    gl.uniform2fv(shader.uniforms.scale, [params.shape1["Scale"], params.shape2["Scale"]]);
    gl.uniform1f(shader.uniforms.pointSize, params.rendering["Point size"]);
    gl.uniform4fv(shader.uniforms.color, [color[0] / 255, color[1] / 255, color[2] / 255, opacity]);
  });

  var rotate = 0;

  (function render () {
    var mode = gui.rendering["Draw mode"];
    var autoRotate = gui.rendering["Auto-rotate"];

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspect = gl.viewportWidth / gl.viewportHeight;
    glMatrix.mat4.perspective(projectionMatrix, 45, aspect, 0.1, 100.0);
    glMatrix.mat4.identity(modelViewMatrix);
    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -2.0]);
    glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, rotate, [0, 1, 0]);

    if (autoRotate) {
      rotate += 0.005;
    }

    gl.uniformMatrix4fv(shader.uniforms.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(shader.uniforms.modelViewMatrix, false, modelViewMatrix);

    gl.drawArrays(mode, 0, phiGeometry.numItems);
    requestAnimationFrame(render);
  }());
}


(function () {
  var canvas = document.createElement("canvas");
  var gl = getContext(canvas);

  if (gl) {
    document.body.appendChild(canvas);
    main(canvas, gl);
  } else {
    document.getElementById("no-webgl").style.display = "block";
  }
}());
