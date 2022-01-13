function vertexShader() {
    return `
    
    out vec3 vNormal;
    out vec3 vPosition;
    out vec4 vColor;
    out vec2 vUv; 

    void main() {
      
      vNormal = normalMatrix * normal;
      vPosition = (modelViewMatrix * vec4( position, 1.0 )).xyz;
      vUv =uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `;
}
export {vertexShader};