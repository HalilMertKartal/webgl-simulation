function fragmentShader() {
    return `    
    
    uniform sampler2D texture1;
    
    in vec2 vUv; 
    in vec3 vNormal;
    in vec3 vPosition;
    
    uniform vec3 lightColor;
    uniform vec3 lightPosition;
    uniform vec3 ambientLightColor;
    
    precision mediump float;

    uniform vec4 color;

    uniform vec4 specularColor;
    
    uniform float specularAmount;
    uniform float specularShininess;
    
    struct SpotLight {
        vec3 position;
        vec3 direction;
        vec3 color;
        float distance;
        float decay;
        float coneCos;
        float penumbraCos;
    };
    uniform SpotLight[1] spotLights;
    vec3 spotLightColor;
    bool spotLightVisibility;
    
    #define saturate( a ) clamp( a, 0.0, 1.0 )
    
    float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
    return smoothstep( coneCosine, penumbraCosine, angleCosine );
    }
    
    float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
    #if defined ( PHYSICALLY_CORRECT_LIGHTS )
        float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
        if ( cutoffDistance > 0.0 ) {
            distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
        }
        return distanceFalloff;
    #else
        
        if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
            return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
        }
        return 1.0;
    #endif
}
    
    void getSpotLightInfo( const in SpotLight spotLight ) {
        vec3 lVector = spotLight.position - vPosition;
        vec3 lightDirection = normalize( lVector );
        float angleCos = dot( lightDirection, spotLight.direction );
        float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
        if ( spotAttenuation > 0.0 ) {
            float lightDistance = length( lVector );
            spotLightColor = spotLight.color * spotAttenuation;
            spotLightColor *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
            spotLightVisibility = ( spotLightColor != vec3( 0.0 ) );
        }
        else {
            spotLightColor = vec3( 0.0 );
            spotLightVisibility = false;
        }
    
    }
    
    
    void main() {
      vec3 lightDirection = normalize(lightPosition - vPosition);     
      getSpotLightInfo(spotLights[0]);
      vec3 normal = normalize(vNormal);

      vec3 directionToCamera = normalize(cameraPosition - vPosition);
      
      vec3 halfwayVector = normalize( directionToCamera + lightDirection );

      // Calculate the specular highlight
      float specularBrightness = (
        
        specularAmount *

        pow(
          max(0.0, dot(vNormal, halfwayVector)),
          specularShininess
        )
      );
      
      // lambertian lighting model
      float surfaceBrightness = max(dot(lightDirection, normal), 0.3);
      vec4 TexColor = texture2D(texture1, vUv);
      vec3 diffuse;
      if(spotLightVisibility){
      diffuse = (spotLightColor*0.3+lightColor) * TexColor.rgb * surfaceBrightness * 1.2;
      }else{
      diffuse = (lightColor*0.4) * TexColor.rgb * surfaceBrightness * 1.8;
      }
      

      // Multiply together all of the various light values
      gl_FragColor = vec4(diffuse + specularColor.xyz * specularBrightness, 1.0);
      
    }
  `
}
export {fragmentShader};