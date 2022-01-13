import {UniformsUtils} from "../renderers/shaders/UniformsUtils.js";
import {UniformsLib} from "../renderers/shaders/UniformsLib.js";
import {Matrix4} from "../math/Matrix4.js";
import {Color} from "../math/Color.js";
import {Vector3} from "../math/Vector3.js";

export const mirrorShader = {

    uniforms: UniformsUtils.merge( [
        UniformsLib[ 'fog' ],
        UniformsLib[ 'lights' ],
        {
            'normalSampler': { value: null },
            'mirrorSampler': { value: null },
            'alpha': { value: 1.0 },
            'time': { value: 0.0 },
            'size': { value: 1.0 },
            'distortionScale': { value: 20.0 },
            'textureMatrix': { value: new Matrix4() },
            'sunColor': { value: new Color( 0x7F7F7F ) },
            'sunDirection': { value: new Vector3( 0.70707, 0.70707, 0 ) },
            'eye': { value: new Vector3() },
            'waterColor': { value: new Color( 0x555555 ) }
        }
    ] ),

    vertexShader: /* glsl */`
				uniform mat4 textureMatrix;
				uniform float time;

				out vec4 mirrorCoord;
				out vec4 worldPosition;
                out vec4 vPosition;
				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * vPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,

    fragmentShader: /* glsl */`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				in vec4 mirrorCoord;
				in vec4 worldPosition;
				in vec4 vPosition;

                #include <tonemapping_fragment>
				#include <fog_fragment>
				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>
               
                vec3 spotLightColor;
                bool spotLightVisibility;
                bool error=false;
				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}
				 
                
                void getSpotLight( const in SpotLight spotLight) {
                    vec3 lVector = spotLight.position - vPosition.xyz;
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

					#include <logdepthbuf_fragment>
					getSpotLight(spotLights[0]);
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = spotLightColor*0.1+albedo;

					if(error){
					    gl_FragColor=vec4(1.0,1.0,1.0,1.0);
					}else
					    gl_FragColor = vec4( outgoingLight, alpha );

					
				}`

};