var xCam = 100;
var yCam = 100;
var zCam = 100;
var camRotateOn = false;
var spotLightX= 0;
var spotLightY= 0;
var spotLightZ= 0;
var spotlightToggle = true;
var freelook = false;

var z_up = false;
var z_down = false;
var y_up = false;
var y_down = false;
var x_up = false;
var x_down = false;

import * as THREE from './Three.js';
import { OBJLoader } from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';
import { Water } from './objects/Water.js';
import { Sky } from './objects/Sky.js';
import { AssetManager, AssetId } from './AssetManager.js';
import { MovableObject } from './movable_object.js';
import { PlayerBoat } from './player_boat.js';
import { OrbitControls } from './cameras/OrbitControls.js';
import { DragControls } from './cameras/DragControls.js';
import { NavigationManager } from './navigation_manager.js';
import { TransformControls } from './cameras/TransformControls.js';
import { fragmentShader } from './shaders/fragmentShader.js';
import { vertexShader } from './shaders/vertexShader.js';
import { fragmentShader2 } from './shaders/fragmentShader2.js';
import { vertexShader2 } from './shaders/vertexShader2.js';

var lightPositionUniform = new THREE.Vector4(0.0, -150.0, -80.0, 1.0 );
var lightAmbient = new THREE.Vector4(0.1, 0.1, 0.1, 1.0 );
var lightDiffuse = new THREE.Vector4( 0.0, 0.2, 0.8, 1.0 );
var lightSpecular = new THREE.Vector4( 0.0, 0.5, 0.5, 0.8 );

var materialAmbient = new THREE.Vector4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = new THREE.Vector4( 0.0, 0.0, 0.0, 0.8);
var materialSpecular = new THREE.Vector4( 1.0, 1.0, 0.0, 0.8 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var onProgress; 
var onError;
const mouse = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
var mouse_moved = false;
var assetManager;
var INTERSECTED = false;

var draggableObjects = [];

var spotRotateOn = false;
var changeSpotX = 0;
var changeSpotY = 0;

var leftButtonPressed = false;
var rightMouseButtonPressed = false;

var debugSwitch = false;


var timeLeft = 150;
var elem = document.getElementById('time');
var timerId = setInterval(countdown, 1000);

var gameOverBool = false;
var totalScore = 0;

var xPressed = false;
var copTarget;

function countdown() {
    if (timeLeft === -1) {
        clearTimeout(timerId);
        gameOverBool = true;
        alert("GAME OVER!\nYOUR SCORE IS: " + totalScore);
        document.location.reload();
    } else {
        elem.innerHTML = timeLeft + ' seconds remaining';
        timeLeft--;
    }
}

document.querySelector(".scoreValue").innerHTML = "Total Score: " + totalScore;

function onMouseMove( event )
{
    leftButtonPressed = true;
}

function onClick(e) {
    if (!e)
    {
        return;
    }

    switch(`${e.which}${e.button}`)
    {
        case '10':
            //console.log('Left mouse button at ' + e.clientX + 'x' + e.clientY);
        break;
        case '21':
            //console.log('Middle mouse button ' + e.clientX + 'x' + e.clientY);
        break;
        case '32': // right mouse button
            rightMouseButtonPressed = true;
    }
}

function onMouseChange(event){
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

document.addEventListener("click", onMouseMove);
document.addEventListener("mousemove", onMouseChange);
window.addEventListener("mousedown", onClick);

var transformControls;
var spotlightCons = 100;
var changeShader = false;
var curShader = 1;

document.onkeydown = function(e) {
  switch(e.which) {
    case 38:   // uparrow
      z_down = true;
     
      break;
    case 40:    // downarrow
        z_up = true;
       
        break;      
    case 39:   // rightarrow
        x_up = true;
    
        break;
    case 37:    // leftarrow
        x_down = true;
   
        break;
    case 33:    // pgup
        y_up = true;
    
        break;
    case 34:    // pgdown
        y_down = true;
   
        break;
    case 79:   // o
         spotlightToggle = !spotlightToggle;
         break;
     case 86: // v
         changeShader = true;
        break;
   case 88: //x
        xPressed = true;
        break;
    case 104:   // numpad 8
        spotLightZ += spotlightCons;
        break;

    case 101:   // numpad 5
        spotLightZ -= spotlightCons;
        break;

    case 100:   // numpad 4
        spotLightX -= spotlightCons;
        break;

    case 102:   // numpad 6
        spotLightX += spotlightCons;
        break;

    case 109:   // numpad -
        spotLightY += spotlightCons;
        break;

    case 107:   // numpad +
        spotLightY -= spotlightCons;
        break;
        case 71:
           transformControls.setMode('translate');
           break;
       case 82:
           transformControls.setMode('rotate');
           break;
       case 83:
           transformControls.setMode('scale');
           break;
    // Toggle freelook
    case 70:    // f
        freelook = !freelook;
  }

  e.preventDefault();
};
document.onkeyup = function(e) {
  switch(e.which) {
      case 38:   // uparrow
        z_down = false;

        break;
      case 40:    // downarrow
        z_up = false;

      break;      
      case 39:   // rightarrow
       x_up = false;

      break;
      case 37:    // leftarrow
        x_down = false;

      break;
      case 33:    // pgup
        y_up = false;

      break;
      case 34:    // pgdown
        y_down = false;

      break;
  }

  e.preventDefault();
};

document.addEventListener( 'keydown', (event) => {
    if (event.code==="KeyP"){
        spotRotateOn = true;
        document.body.requestPointerLock();
    }
        
    }
);

document.addEventListener( 'keydown', (event) => {
    if (event.code==="KeyU"){
        camRotateOn = true;
        document.body.requestPointerLock();
    }
        
    }
);

class App {
  /**
   * @constructor
   */
    
  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight; 

    this.DELTA_TIME = 0;
    this.LAST_TIME = Date.now();
    
    var app = this;
    assetManager = new AssetManager(function (){
        app.scene = new Scene(this.width, this.height);
        const root = document.body.querySelector(".app");
        root.appendChild(app.scene.renderer.domElement);
        app.update = app.update.bind(app);
        app.addListeners();
        requestAnimationFrame(app.update);
    });
    assetManager.loadAssets();
  }
  


  /**
   * @method
   * @name onResize
   * @description Triggered when window is resized
   */
  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene.resize(this.width, this.height);
  }

  /**
   * @method
   * @name addListeners
   */
  addListeners() {
    window.addEventListener("resize", this.onResize.bind(this));
  }

  /**
   * @method
   * @name update
   * @description Triggered on every TweenMax tick
   */
  update() {
    this.DELTA_TIME = Date.now() - this.LAST_TIME;
    this.LAST_TIME = Date.now();

    this.scene.render();
    if (gameOverBool === false){
    requestAnimationFrame(this.update);
    }
    else{
        return;
    }
    
  }
}

class Scene extends THREE.Scene {
  /**
   * @constructor
   */
  constructor(width, height) {
    super();
    this.assetManager = assetManager;
    this.navigation_manager = new NavigationManager(this);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);
    
    this.sunPosition = new THREE.Vector3();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 30000);
    const waterGeometry = new THREE.PlaneGeometry( 30000, 30000 );

    let materialArray = [];
    let texture_rt = new THREE.TextureLoader().load( 'assets/left.png');
    let texture_lf = new THREE.TextureLoader().load( 'assets/right.png');
    let texture_dn = new THREE.TextureLoader().load( 'assets/bottom.png');
    let texture_up = new THREE.TextureLoader().load( 'assets/top.png');
    let texture_bk = new THREE.TextureLoader().load( 'assets/back.png');
    let texture_ft = new THREE.TextureLoader().load( 'assets/front.png');

    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

    for (let i = 0; i < 6; i++)
        materialArray[i].side = THREE.BackSide;

    let skyboxGeo = new THREE.BoxGeometry( 29000, 29000, 29000);
    let skybox = new THREE.Mesh( skyboxGeo, materialArray );
    this.add( skybox );
    this.water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load( 'obj/waternormals.jpg', function ( texture ) {

                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                } ),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: this.fog !== undefined
            }
    );

    this.water.rotation.x = - Math.PI / 2;
    this.add( this.water );
        
    this.sky = new Sky();
    this.sky.scale.setScalar( 10000 );
    this.sky.name = ("sky");
    //this.add( this.sky );
    
    this.skyUniforms = this.sky.material.uniforms;
    this.skyUniforms[ 'turbidity' ].value = 10;
    this.skyUniforms[ 'rayleigh' ].value = 2;
    this.skyUniforms[ 'mieCoefficient' ].value = 0.005;
    this.skyUniforms[ 'mieDirectionalG' ].value = 0.8;
    
    const light = new THREE.AmbientLight( 0x404040 ); // soft white light
    this.add( light );

    const parameters = {
            inclination: 0.49,
            azimuth: 0.205
    };

    const pmremGenerator = new THREE.PMREMGenerator( this.renderer );

    function updateSun(scene) {
        const theta = Math.PI * ( parameters.inclination - 0.5 );
        const phi = 2 * Math.PI * ( parameters.azimuth - 0.5 );

        scene.sunPosition.x = Math.cos( phi );
        scene.sunPosition.y = Math.sin( phi ) * Math.sin( theta );
        scene.sunPosition.z = Math.sin( phi ) * Math.cos( theta );

        scene.sky.material.uniforms[ 'sunPosition' ].value.copy( scene.sunPosition );
        scene.water.material.uniforms[ 'sunDirection' ].value.copy( scene.sunPosition ).normalize();

        scene.environment = pmremGenerator.fromScene( scene.sky ).texture;
    }

    updateSun(this);
    const geometry = new THREE.BoxGeometry( 30, 30, 30 );
    const material = new THREE.MeshStandardMaterial( { roughness: 0 } );


    this.playerBoat = new PlayerBoat(this,new THREE.Vector3(xCam, 10, zCam-500));
    
    
    function getRndInteger(min, max) {
        return (Math.random() * (max - min) ) + min;
    }
    
   function addStones(scene, amount)
    {
        function doWork(assetId, amount, addToNav)
        {
           for (var i = 0; i < amount/2; i++) 
           {
               var obj = scene.assetManager.getObject(assetId);
               obj.position.set(xCam + getRndInteger(-3000,3000), 2, zCam - 500 + getRndInteger(-3000,3000));
               
               var rndScale = getRndInteger(1.0, 2.5);
               var rndRotationX = getRndInteger(0, 2 * Math.PI);
               var rndRotationY = getRndInteger(0, 2 * Math.PI);
               var rndRotationZ = getRndInteger(0, 2 * Math.PI);
               
              // console.log(rndRotationX);
                 
               if (assetId === AssetId.Litter){
                   rndScale = getRndInteger(2.5, 3.5);
                   obj.rotation.set(0, rndRotationY, 0);
               }
               if (assetId === AssetId.ToxicWaste){
                   rndScale = getRndInteger(1.25, 2.5);
                    obj.position.set(xCam + getRndInteger(-3000,3000), 3, zCam - 500 + getRndInteger(-3000,3000));
                    obj.rotation.set(rndRotationX, rndRotationY, rndRotationZ);
               }
               
               obj.scale.set(rndScale, rndScale, rndScale);
               obj.name = i;
               if(addToNav){
                    scene.navigation_manager.registerStone(obj);
                }
               draggableObjects.push(obj);
               scene.add (obj);
           }
        }

        doWork(AssetId.Stone1, amount, true);
        doWork(AssetId.Stone2, amount, true);
        doWork(AssetId.Litter, 50);
        doWork(AssetId.ToxicWaste, 50, true);
    }
    
    addStones(this, 100);
    this.resize(window.innerWidth,window.innerHeight);

    var farcity = this.assetManager.getObject(4);
    farcity.position.set(xCam - 500, yCam - 120, zCam + 10000);
    farcity.scale.set(0.04, 0.04, 0.04);
    farcity.rotation.set(0, 3*Math.PI / 4, 0);
    farcity.name = "FarCity";
    this.add (farcity);
    
    var farFacility = this.assetManager.getObject(5);
    farFacility.position.set(xCam - 6300, yCam-100, zCam + 10000);
    farFacility.scale.set(0.04, 0.04, 0.04);
    farFacility.rotation.set(0, Math.PI/2, 0);
    farFacility.name = "FarFacility";
    this.add (farFacility);
    
    this.camera.rotation.x += 0.2;
    this.camera.rotation.y += 2.8;
    this.camera.rotation.z -= 0;
  
    
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.autoRotate = false;
    this.controls.update();
    this.add(this.controls);
    
    this.controls.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.ROTATE
       };
    
    // initial camera coordinates
    xCam = this.playerBoat.mesh.position.x + 35;
    yCam = this.playerBoat.mesh.position.y + 50;
    zCam = this.playerBoat.mesh.position.z - 100;
    
    this.spotLight = new THREE.SpotLight( 0xffffff, 100,0,Math.PI/10,1,2);
    this.spotLight.position.set( xCam, yCam + 1000, zCam + 1000 );

    this.spotLight.castShadow = true;

    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;

    this.spotLight.shadow.camera.near = 500;
    this.spotLight.shadow.camera.far = 4000;
    this.spotLight.shadow.camera.fov = 30;
    this.spotLight.decay = 2;
    this.spotLight.target = this.playerBoat.mesh_;
    
    this.add( this.spotLight );
    

    transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.add(transformControls);
    
    
  }

  /**
   * @method
   * @name render
   * @description Renders/Draw the scene
   */
  
  
  render() {
      if(changeShader)
      {
          this.traverse( function( node ) {

        if ( node instanceof THREE.Mesh ) {
            
            console.log(node.material);
            if(curShader === 1)
            {
                if(node.material.fragmentShader === fragmentShader())
                {
                    node.material.fragmentShader=fragmentShader2();
                    node.material.vertexShader=vertexShader2();
                }

                curShader = 2;
            }
            else
            {
                if(node.material.fragmentShader === fragmentShader2())
                {
                        node.material.fragmentShader=fragmentShader();
                    node.material.vertexShader=vertexShader();
                }

                curShader = 1;
            }

            
        }} );
          changeShader = false;
      }
    this.renderer.autoClearColor = true;
    if (spotlightToggle)
        this.spotLight.intensity = 1;
    else
        this.spotLight.intensity = 0;
    
    
      
    // rotate camera
    var localCameraOffset = new THREE.Vector3();
    localCameraOffset.x = 0;
    localCameraOffset.y = 75;
    localCameraOffset.z = -125;
   
    if (!freelook){
        var newCameraPosition = this.playerBoat.mesh.localToWorld(localCameraOffset).clone();
        xCam = newCameraPosition.x;
        yCam = newCameraPosition.y;
        zCam = newCameraPosition.z;
    }
    
    this.camera.position.x = xCam;
    this.camera.position.y = yCam;
    this.camera.position.z = zCam;   
    
    if (!spotRotateOn){
        this.spotLight.position.set(xCam + spotLightX, yCam + 100 + spotLightY, zCam + 10 + spotLightZ);
    }

    
    // control spotlight
     document.body.addEventListener( 'mousemove', ( event ) => {
         
          if ( document.pointerLockElement === document.body ) {
              
              changeSpotX += event.movementX * 40;
              changeSpotY += event.movementY * 40;
              this.spotLight.position.set(xCam + spotLightX - changeSpotX, yCam + 100 + spotLightY - changeSpotY, zCam + 10 + spotLightZ);
          }
          else{
              spotRotateOn = false;
          }

      } );
    
    var localLookOffset = new THREE.Vector3();
    localLookOffset.x = 0;
    localLookOffset.y = 30;
    localLookOffset.z = 100;
    
    if (!freelook){
        var lookTarget = this.playerBoat.mesh.localToWorld(localLookOffset).clone();
        this.controls.target = lookTarget;
    }
    else {
        
        if (z_up)
            {
                zCam += 4;
            }
        if (z_down)
            {
                zCam -= 4;
            }

        if (y_up)
            {
                yCam += 1.5;
            }
        if (y_down)
            {
                yCam -= 1.5;
            }

        if (x_up)
            {
                xCam += 4;
            }
        if (x_down)
            {
                xCam -= 4;
            }
        //this.controls.target.set(xCam, yCam, zCam);
    }
    
    const time = performance.now() * 0.001;
    
    raycaster.setFromCamera( mouse, this.camera );
    
     // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( this.children );
    this.renderer.autoClearColor = true;
    
    var badIntersect = false;
    var idx = 0;

    
    if (intersects.length > 0)
    {
        if(intersects[0].object.type === "TransformControlsPlane")
            idx = 1;
        if(intersects[idx])
        {
              var text = intersects[idx].object.name.slice(0,3);
        
        badIntersect = text === "tas" || intersects[idx].object.name === "boatrenk" || intersects[idx].object.name === "1" || intersects[idx].object.name === "yelekbot" || 
                intersects[idx].object.name === "deri" || intersects[idx].object.name === "pantolon" || intersects[idx].object.name === "cop" || intersects[idx].object.name === "8"
                || intersects[idx].object.name === "7" || intersects[idx].object.name === "4" || intersects[idx].object.name in ["1","2","3","4","5","6","7","8"] || intersects[idx].object.name === "Cylinder001";
        }
      
    }
       
    if (rightMouseButtonPressed && intersects.length > 0)
    {
        rightMouseButtonPressed = false;
        console.log(intersects);
        
        if (!badIntersect && !this.navigation_manager.isCollisionObject(intersects[idx].object))
        {
            var intersectPoint = intersects[idx].point;
            //console.log(intersects);
            if (this.playerBoat.isMoving)
            {
                this.playerBoat.stopMove();
            }
            var path = this.navigation_manager.findPath(this.playerBoat.mesh.position, intersectPoint, this.playerBoat.mesh, localLookOffset);
            if(path.length > 0)
            {
                console.log(path);
                console.log(this.playerBoat.mesh.position);
                this.playerBoat.setPath(path);
            }
            else
            {
                console.log("Can not find path!");
            }
        }
        
    }
    
    if (xPressed && copTarget)
    {   //todo 
        xPressed = false;
        transformControls.detach();
        copTarget.visible = false;
        copTarget.parent.visible = false;
        this.remove( copTarget );
        
        if (copTarget.name === "cop2" || copTarget.name === "cop3" || copTarget.name === "cop4"){
            totalScore += 10;
        }
        else if (copTarget.name.slice(0,8) === "Cylinder"){
            totalScore += 30;
            copTarget = null;
        }
        else{
            totalScore += 20;
        }
        document.querySelector(".scoreValue").innerHTML = "Total Score: " + totalScore;
        copTarget = null;
    }
    
    if (leftButtonPressed)
    {
        leftButtonPressed = false;
        
        if (intersects.length >= 1 && intersects[idx].object.name !== "sky")
        {
            var intersectObj = intersects[idx].object;
            console.log(intersectObj.name);
            if (intersectObj.name.slice(0,3) === "cop") //draggableObjects.includes(intersectObj))
            {
                copTarget = intersectObj;
                console.log("detected click to draggable object!");
                console.log(intersectObj);
                transformControls.attach(intersectObj.parent);
            }
            if (intersectObj.name.slice(0,8) === "Cylinder") //draggableObjects.includes(intersectObj))
            {
                copTarget = intersectObj;
                console.log("detected click to draggable object!");
                console.log(intersectObj);
                transformControls.attach(intersectObj.parent);
            }

            var text = intersects[idx].object.name.slice(0,3);
                if (badIntersect) {
                    console.log("bişey buldum");
                }
                console.log(intersects[idx].object.name);
        }
    }
    
    this.water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    this.playerBoat.update(localLookOffset);
    this.playerBoat.mesh.position.y = 4.5;
    
    this.controls.object.position.set(xCam, yCam, zCam);
    this.controls.update();
    this.renderer.render(this, this.camera);
    
  }

  /**
   * @method
   * @name resize
   * @description Resize the scene according to screen size
   * @param {number} newWidth
   * @param {number} newHeight
   */
  resize(newWidth, newHeight) {
    this.camera.aspect = newWidth / newHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(newWidth, newHeight);
  }
}


new App();
