precision mediump float;

varying vec3 vPosition;


void main(void) {
  vec3 pos = normalize(vPosition);
  gl_FragColor = vec4(sin(pos.z), cos(pos.y), cos(pos.x), 1.0);
}
