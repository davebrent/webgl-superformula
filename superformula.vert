#define PI 3.141592653589793
#define PI2 6.283185307179586
#define EPSILON 1e-30

attribute vec2 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec2 m;
uniform vec2 n1;
uniform vec2 n2;
uniform vec2 n3;
uniform vec2 a;
uniform vec2 b;

uniform float segments;
uniform float scale;
uniform float pointSize;

varying vec3 vPosition;
varying vec3 vNormal;


float superformula (float phi, float m, float n1, float n2, float n3,
                    float a, float b) {
  a = max(a, EPSILON);
  b = max(b, EPSILON);

  float mp = (m * phi) / 4.0;

  float t1 = cos(mp) * (1.0 / a);
  float t2 = sin(mp) * (1.0 / b);

  t1 = pow(abs(t1), n2);
  t2 = pow(abs(t2), n3);

  float r = abs(pow(t1 + t2, 1.0 / n1));

  if (r == 0.0) {
    return 0.0;
  }

  return 1.0 / r;
}


vec3 calculatePosition (vec2 position) {
  float phi = position.x / segments;
  float theta = position.y / segments;

  phi = (phi * PI) - (PI / 2.0);
  theta = (theta * PI2) - PI;

  float r1 = superformula(theta, m.x, n1.x, n2.x, n3.x, a.x, b.x);
  float r2 = superformula(phi, m.y, n1.y, n2.y, n3.y, a.y, b.y);

  return vec3(
    r1 * cos(theta) * r2 * cos(phi),
    r1 * sin(theta) * r2 * cos(phi),
    r2 * sin(phi)
  ) * 0.8;
}


vec3 calculateFaceNormal (vec3 a, vec3 b, vec3 c) {
  vec3 v1 = c - a;
  vec3 v2 = b - a;
  return cross(v1, v2);
}


vec3 calculateVertexNormal (vec3 v0, vec2 position) {
  vec2 p1 = vec2(position.x, position.y + 1.0);
  vec2 p2 = vec2(position.x + 1.0, position.y);
  vec2 p3 = vec2(position.x, position.y - 1.0);
  vec2 p4 = vec2(position.x - 1.0, position.y);

  vec3 v1 = calculatePosition(p1);
  vec3 v2 = calculatePosition(p2);
  vec3 v3 = calculatePosition(p3);
  vec3 v4 = calculatePosition(p4);

  vec3 n1 = calculateFaceNormal(v0, v1, v4);
  vec3 n2 = calculateFaceNormal(v0, v1, v2);
  vec3 n3 = calculateFaceNormal(v0, v3, v2);
  vec3 n4 = calculateFaceNormal(v0, v3, v4);

  return normalize(n1 + n2 + n3 + n4);
}


void main(void) {
  vPosition = calculatePosition(position) * scale;
  // vNormal = calculateVertexNormal(vPosition, position);
  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}
