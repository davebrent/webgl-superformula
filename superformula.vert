attribute vec2 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec2 m;
uniform vec2 n1;
uniform vec2 n2;
uniform vec2 n3;
uniform vec2 scale;

uniform float pointSize;


float superformula (float phi, float m, float n1, float n2, float n3) {
  m = max(m, 1.0);
  n1 = max(n1, 1.0);
  n2 = max(n2, 1.0);
  n3 = max(n3, 1.0);

  float t1 = pow(abs(cos((m * phi) / 4.0)), n2);
  float t2 = pow(abs(sin((m * phi) / 4.0)), n3);
  float result = pow(t1 + t2, 1.0 / n1);

  return 1.0 / result; // Divide by zero?
}


void main(void) {
  float phi = position.x;
  float theta = position.y;

  float shapeA = superformula(phi, m.x, n1.x, n2.x, n3.x) * scale.x;
  float shapeB = superformula(theta, m.y, n1.y, n2.y, n3.y) * scale.y;

  vec3 position = vec3(
    shapeA * cos(theta) * shapeB * cos(phi),
    shapeA * sin(theta) * shapeB * cos(phi),
    shapeB * sin(phi)
  );

  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
