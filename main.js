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


function sphere (segments) {
  var vertices = [];
  var indices = [];
  var uvs = [];
  var x, y, u, v, v1, v2, v3, v4, theta, phi;

  for (y = 0; y <= segments; y++) {
    for (x = 0; x <= segments; x++) {
      var u = 1 - (x / segments);
      var v = 1 - (y / segments);

      vertices.push(x);
      vertices.push(y);

      uvs.push(u);
      uvs.push(v);
    }
  }

  for (y = 0; y < segments; y++) {
    for (x = 0; x < segments; x++) {
      v1 = (y * (segments + 1)) + x;
      v2 = v1 + segments + 1;
      v3 = v1 + 1;
      v4 = v2 + 1;

      indices.push(v1);
      indices.push(v2);
      indices.push(v3);

      indices.push(v2);
      indices.push(v4);
      indices.push(v3);
    }
  }

  return {
    vertices: new Uint16Array(vertices),
    indices: new Uint16Array(indices),
    uvs: new Float32Array(uvs),
  };
}


function createAttribute (gl, type, data, itemSize, numItems) {
  var attribute = {
    buffer: gl.createBuffer(),
    itemSize: itemSize,
    numItems: (numItems === undefined) ? data.length / itemSize : numItems
  };

  gl.bindBuffer(type, attribute.buffer);
  gl.bufferData(type, data, gl.STATIC_DRAW);
  return attribute;
}


function createGUI (gl, callback) {
  var view = new dat.GUI();

  var controller = {
    "rendering": {
      "Auto-rotate": true,
      "Draw mode": gl.TRIANGLES,
      "Background": [0, 0, 0],
      "Scale": 1,
      "Point size": 0.75,
    },
    "shape1": {"m": 5, "n1": 0.1, "n2": 1.7, "n3": 1.7, "a": 1, "b": 1},
    "shape2": {"m": 1, "n1": 0.3, "n2": 0.5, "n3": 0.5, "a": 1, "b": 1}
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
  renderView.add(controller.rendering, "Point size", 0, 4).onChange(callback);
  renderView.add(controller.rendering, "Scale", 0, 2).onChange(callback);
  renderView.open();

  var shape1View = view.addFolder("Superformula 1");
  shape1View.add(controller.shape1, "a").onChange(callback);
  shape1View.add(controller.shape1, "b").onChange(callback);
  shape1View.add(controller.shape1, "m").onChange(callback);
  shape1View.add(controller.shape1, "n1").onChange(callback);
  shape1View.add(controller.shape1, "n2").onChange(callback);
  shape1View.add(controller.shape1, "n3").onChange(callback);
  shape1View.open();

  var shape2View = view.addFolder("Superformula 2");
  shape2View.add(controller.shape1, "a").onChange(callback);
  shape2View.add(controller.shape1, "b").onChange(callback);
  shape2View.add(controller.shape2, "m").onChange(callback);
  shape2View.add(controller.shape2, "n1").onChange(callback);
  shape2View.add(controller.shape2, "n2").onChange(callback);
  shape2View.add(controller.shape2, "n3").onChange(callback);
  shape2View.open();

  callback(controller);
  return controller;
}


function main (canvas, gl) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.enable(gl.CULL_FACE);

  setSize(canvas, gl, window.innerWidth, window.innerHeight);

  window.addEventListener("resize", function () {
    setSize(canvas, gl, window.innerWidth, window.innerHeight);
  }, false);

  var vertShader = compileShader(gl, gl.VERTEX_SHADER, vertShaderSrc());
  var fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc());

  var shader = gl.createProgram();
  gl.attachShader(shader, vertShader);
  gl.attachShader(shader, fragShader);
  gl.linkProgram(shader);

  shader.uniforms = {
    m: gl.getUniformLocation(shader, "m"),
    n1: gl.getUniformLocation(shader, "n1"),
    n2: gl.getUniformLocation(shader, "n2"),
    n3: gl.getUniformLocation(shader, "n3"),
    a: gl.getUniformLocation(shader, "a"),
    b: gl.getUniformLocation(shader, "b"),
    scale: gl.getUniformLocation(shader, "scale"),
    pointSize: gl.getUniformLocation(shader, "pointSize"),
    projectionMatrix: gl.getUniformLocation(shader, "projectionMatrix"),
    modelViewMatrix: gl.getUniformLocation(shader, "modelViewMatrix"),
    segments: gl.getUniformLocation(shader, "segments"),
  };

  shader.attributes = {
    position: gl.getAttribLocation(shader, "position")
  };

  gl.enableVertexAttribArray(shader.attributes.position);

  var numSegments = 96;
  var geometry = sphere(numSegments);

  var attributes = {
    uv: createAttribute(gl, gl.ARRAY_BUFFER, geometry.uvs, 2),
    position: createAttribute(gl, gl.ARRAY_BUFFER, geometry.vertices, 2),
    index: createAttribute(gl, gl.ELEMENT_ARRAY_BUFFER, geometry.indices, 1)
  };

  geometry = null;

  gl.vertexAttribPointer(shader.attributes.uv, attributes.uv.itemSize,
                         gl.FLOAT, false, 0, 0);
  gl.vertexAttribPointer(shader.attributes.position,
                         attributes.position.itemSize,
                         gl.UNSIGNED_SHORT, false, 0, 0);

  var modelViewMatrix = glMatrix.mat4.create();
  var projectionMatrix = glMatrix.mat4.create();
  var normalMatrix = glMatrix.mat4.create();

  gl.useProgram(shader);
  gl.uniform1f(shader.uniforms.segments, numSegments);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attributes.index.buffer);

  var gui = createGUI(gl, function (controller) {
    var params = (gui === undefined) ? controller : gui;
    var clearColor = params.rendering["Background"];

    gl.clearColor(clearColor[0] / 255, clearColor[1] / 255,
                  clearColor[2] / 255, 1.0);

    gl.uniform1f(shader.uniforms.pointSize, params.rendering["Point size"]);
    gl.uniform1f(shader.uniforms.scale, params.rendering["Scale"]);

    gl.uniform2fv(shader.uniforms.m, [
      params.shape1["m"],
      params.shape2["m"]
    ]);

    gl.uniform2fv(shader.uniforms.n1, [
      params.shape1["n1"],
      params.shape2["n1"]
    ]);

    gl.uniform2fv(shader.uniforms.n2, [
      params.shape1["n2"],
      params.shape2["n2"]
    ]);

    gl.uniform2fv(shader.uniforms.n3, [
      params.shape1["n3"],
      params.shape2["n3"]
    ]);

    gl.uniform2fv(shader.uniforms.a, [
      params.shape1["a"],
      params.shape2["a"]
    ]);

    gl.uniform2fv(shader.uniforms.b, [
      params.shape1["b"],
      params.shape2["b"]
    ]);
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
    glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, rotate, [1, 1, 1]);

    if (autoRotate) {
      rotate += 0.005;
    }

    gl.uniformMatrix4fv(
      shader.uniforms.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(
      shader.uniforms.modelViewMatrix, false, modelViewMatrix);

    gl.drawElements(mode, attributes.index.numItems, gl.UNSIGNED_SHORT, 0);
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
