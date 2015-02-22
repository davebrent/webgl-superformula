attribute vec2 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec2 m;
uniform vec2 n1;
uniform vec2 n2;
uniform vec2 n3;
uniform vec2 scale;

uniform float shapeAMorph;
uniform float shapeBMorph;
uniform float shapeMorph;
uniform float typeMorph;

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
  float shapeC = superformula(phi, m.y, n1.y, n2.y, n3.y) * scale.y;
  float shapeD = superformula(theta, m.x, n1.x, n2.x, n3.x) * scale.x;

  float st = sin(theta);
  float sp = sin(phi);
  float ct = cos(theta);
  float cp = cos(phi);

  vec3 mode1 = vec3(shapeA * ct * shapeB * cp,
                    shapeA * st * shapeB * cp, shapeB * sp);

  vec3 mode2 = vec3(shapeA * ct * shapeA * cp,
                    shapeA * st * shapeA * cp, shapeA * sp);

  vec3 mode3 = vec3(shapeB * ct * shapeB * cp,
                    shapeB * st * shapeB * cp, shapeB * sp);

  vec3 mode4 = vec3(shapeC * ct * shapeC * cp,
                    shapeC * st * shapeC * cp, shapeC * sp);

  vec3 mode5 = vec3(shapeD * ct * shapeD * cp,
                    shapeD * st * shapeD * cp, shapeD * sp);

  vec3 shapeAPos = mix(mode2, mode5, shapeAMorph);
  vec3 shapeBPos = mix(mode3, mode4, shapeBMorph);

  vec3 singlePos = mix(shapeAPos, shapeBPos, shapeMorph);
  vec3 combinedPos = mix(singlePos, mode1, typeMorph);

  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(combinedPos, 1.0);
}
