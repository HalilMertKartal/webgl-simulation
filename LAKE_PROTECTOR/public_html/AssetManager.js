import * as THREE from './Three.js';
import { OBJLoader } from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';
import {Color, FrontSide, Matrix4, UniformsLib, UniformsUtils, Vector3} from "./Three.js";

var onProgress;
var onError;
var uniformsOpt={uniforms: UniformsUtils.merge( [
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
            'lightColor': { value: new Color( 0x7F7F7F ) },
            'lightPosition': { value: new Vector3( 0.7, 0.7, 0.0 ) },
            'eye': { value: new Vector3() },
            'ambientLightColor':{value:new Color( 0xFFFFFF )},
            'specularAmount':{ value: new Vector3() },
            'specular':{ value: new Vector3() },
            'specularShininess':{ value: 30.0 },
        }
    ] )}

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
  `
}

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


// asset ids

const AssetId = {
    PlayerBoat: 0,
    Stone1 : 1,
    Stone2 : 2,
    Litter : 3,
    FarCity: 4,
    FarFacility : 5,
    ToxicWaste : 6,
    Max: 7
};

class AssetManager
{

    constructor(onLoadFinished,options={})
    {
        const textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
        const textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;

        const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
        const alpha = options.alpha !== undefined ? options.alpha : 1.0;
        const time = options.time !== undefined ? options.time : 0.0;
        const normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
        const sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3( 0.70707, 0.70707, 0.0 );
        const sunColor = new Color( options.sunColor !== undefined ? options.sunColor : 0xffffff );
        const eye = options.eye !== undefined ? options.eye : new Vector3( 0, 0, 0 );
        const distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
        const specularAmountVal =  options.specularAmount !== undefined ? option.emissive : 1;
        const specularShininessVal = options.specularShininess !== undefined ? option.shininess :300.0;
        const specularVal =  options.specular !== undefined ? option.specular : new Vector3(0,0,0);
        uniformsOpt.uniforms[ 'alpha' ].value = alpha;
        uniformsOpt.uniforms[ 'time' ].value = time;
        uniformsOpt.uniforms[ 'normalSampler' ].value = normalSampler;
        uniformsOpt.uniforms[ 'lightColor' ].value = sunColor;
        uniformsOpt.uniforms[ 'lightPosition' ].value = sunDirection;
        uniformsOpt.uniforms[ 'distortionScale' ].value = distortionScale;
        uniformsOpt.uniforms[ 'eye' ].value = eye;
        uniformsOpt.uniforms[ 'specularAmount' ].value = specularAmountVal;
        uniformsOpt.uniforms[ 'specularShininess' ].value = specularShininessVal;
        uniformsOpt.uniforms[ 'specular' ].value = specularVal;
        this.objectMap = new Map();
        this.onLoadFinished = onLoadFinished;
        this.loadedList = new Array();
    }

    getObject(id)
    {
        var mat1;
        var mat2;
        var obj = this.objectMap.get(id);
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh)
                {
                    mat1 = child.material1;
                    mat2 = child.material2;
                }
            });
            
            
        var val = obj.clone();
        if (id === AssetId.Stone2 || id === AssetId.Stone1 || id === AssetId.PlayerBoat || id === AssetId.FarCity || id===AssetId.Litter || id===AssetId.ToxicWaste)
        {
            val.traverse(function (child) {
                if (child instanceof THREE.Mesh)
                {
                    child.material.uniforms.texture1.value.needsUpdate = true;
                        
                    child.material2 = mat1;
                    child.material1 = mat2;
                }
            });
        }

        return val;

        //
    }

    onAssetLoaded(id)
    {
        this.loadedList.push(id);
        if (this.loadedList.length === AssetId.Max)
        {
            this.onLoadFinished();
        }
    }

    loadShaderObject(objUrl, shaderMaterial,mat2, id)
    {
        var assetMgr = this;
        var objectLoader = new OBJLoader();
        objectLoader.load(objUrl, function (obj)
        {
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    var customShader = shaderMaterial.clone();
                    child.material = customShader;
                    child.material2 = mat2.clone();
                    child.material1 = customShader;
                }
            });
            assetMgr.objectMap.set(id, obj);
            assetMgr.onAssetLoaded(id);
        }, onProgress, onError);
    }

    loadObjectWithMaterial(objUrl, matUrl, id)
    {
        var assetMgr = this;
        var materialLoader = new MTLLoader();
        materialLoader.load(matUrl, function (materials)
        {
            var objectLoader = new OBJLoader();
            materials.preload();
            objectLoader.setMaterials(materials);
            objectLoader.load(objUrl, function (obj) {
                assetMgr.objectMap.set(id, obj);
                assetMgr.onAssetLoaded(id);
            }, onProgress, onError);

        }, onProgress, onError);
    }

    loadAssets()
    {
        var assetMgr = this;
        
        var texture = THREE.ImageUtils.loadTexture( 'obj/rock2.jpg', undefined, function()
        {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 1, 1 );
            var tex = texture.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
            
            var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            console.log(texture);
            assetMgr.loadShaderObject('obj/rock2.obj',_material,_material2, AssetId.Stone2);
        });

        var texture2 = THREE.ImageUtils.loadTexture( 'obj/tas2.jpg', undefined, function()
        {
            texture2.wrapS = THREE.RepeatWrapping;
            texture2.wrapT = THREE.RepeatWrapping;
            texture2.repeat.set( 1, 1 );
            var tex = texture2.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
             var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            console.log(texture2);
            assetMgr.loadShaderObject('obj/rock1.obj',_material, _material2, AssetId.Stone1);
        });
        var texture3 = THREE.ImageUtils.loadTexture( 'obj/player/boattex.jpg', undefined, function()
        {
            texture3.wrapS = THREE.RepeatWrapping;
            texture3.wrapT = THREE.RepeatWrapping;
            texture3.repeat.set( 1, 1 );
            var tex = texture3.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
             var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            console.log(texture3);
            assetMgr.loadShaderObject('obj/player/playerboat.obj',_material,_material2, AssetId.PlayerBoat);
        });

        var texture4 = THREE.ImageUtils.loadTexture( 'obj/trash.jpg', undefined, function()
        {
            texture4.wrapS = THREE.RepeatWrapping;
            texture4.wrapT = THREE.RepeatWrapping;
            texture4.repeat.set( 1, 1 );
            var tex = texture4.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
             var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            console.log(texture4);
            assetMgr.loadShaderObject('obj/trash.obj',_material,_material2, AssetId.Litter);
        });


        var texture5 = THREE.ImageUtils.loadTexture( 'obj/toxic.jpg', undefined, function()
        {
            texture5.wrapS = THREE.RepeatWrapping;
            texture5.wrapT = THREE.RepeatWrapping;
            texture5.repeat.set( 1, 1 );
            var tex = texture5.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
            console.log(texture5);
             var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            assetMgr.loadShaderObject('obj/toxic.obj',_material, _material2, AssetId.ToxicWaste);
        });

        var texture6 = THREE.ImageUtils.loadTexture( 'obj/sehir.jpg', undefined, function()
        {
            texture6.wrapS = THREE.RepeatWrapping;
            texture6.wrapT = THREE.RepeatWrapping;
            texture6.repeat.set( 1, 1 );
            var tex = texture6.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
            console.log(texture6);
             var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            assetMgr.loadShaderObject('obj/sehir.obj',_material,_material2, AssetId.FarCity);
        });

        var texture7 = THREE.ImageUtils.loadTexture( 'obj/factory.jpg', undefined, function()
        {
            texture7.wrapS = THREE.RepeatWrapping;
            texture7.wrapT = THREE.RepeatWrapping;
            texture6.repeat.set( 1, 1 );
            var tex = texture7.clone();
            tex.needsUpdate = true;

            const uniforms = {
                texture1: {type: "t", value: tex },
                ...uniformsOpt.uniforms
            };
            var _material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: fragmentShader(),
                vertexShader: vertexShader(),
                lights:true
            });
            console.log(texture7);
             var _material2 = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader2(),
            vertexShader: vertexShader2(),
            lights:true
            });
            assetMgr.loadShaderObject('obj/factory.obj',_material,_material2, AssetId.FarFacility);
        });
    }
}

export { AssetManager, AssetId };