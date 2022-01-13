function fragmentShader2() {
    return `
    uniform sampler2D texture1;

    in vec2 vUv;
    in vec3 v_Normal;
    in vec3 v_Position;
    in vec4 v_Color;

    uniform vec3 lightColor;
    uniform vec3 lightPosition;
    uniform vec3 ambientLightColor;
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
        vec3 lVector = spotLight.position - v_Position;
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
        getSpotLightInfo(spotLights[0]);
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(lightPosition - v_Position);
        float nDotL = max(dot(lightDirection, normal), 0.1);
        if(nDotL>0.99){
        gl_FragColor=vec4(1.0,1.0,1.0,1.0);
        }else{
        vec4 TexColor = texture2D(texture1, vUv);
        vec3 diffuse;
        diffuse = (lightColor) * TexColor.rgb * nDotL * 1.2;

        vec3 ambient1 = ambientLightColor * v_Color.rgb;
        gl_FragColor = vec4(diffuse + ambient1+spotLightColor*0.1, v_Color.a);
        }
    }
  `
}
export {fragmentShader2};