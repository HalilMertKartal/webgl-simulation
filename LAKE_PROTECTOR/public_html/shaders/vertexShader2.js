function vertexShader2() {
    return `
    uniform vec4 sunColor;
    out vec2 vUv;
    out vec4 v_Color;
    out vec3 v_Normal;
    out vec3 v_Position;
    void main() {
      vUv = uv;
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      v_Color=sunColor + normalMatrix[0][0] * 0.;
      v_Normal= normalize(mat3(modelViewMatrix)*normal.xyz);
      v_Position = modelViewPosition.xyz;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `
}
export {vertexShader2};