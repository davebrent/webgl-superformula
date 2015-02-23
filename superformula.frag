precision mediump float;

varying vec3 vPosition;


void main(void) {
  gl_FragColor = vec4(sin(vPosition.z),
                      cos(vPosition.y),
                      cos(vPosition.x), 1.0);
}
