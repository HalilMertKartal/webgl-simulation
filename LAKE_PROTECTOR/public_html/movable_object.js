import * as THREE from './Three.js';

class MovableObject
{
    constructor(mesh, scene, speed)
    {
        this.speed = speed;
        this.scene = scene;
        this.mesh_  = mesh;
        this.destination = new THREE.Vector3();
        this._isMoving = false;
        this._isRotating = false;
        this._deltaMovement = new THREE.Vector3();
        this.targetQuat = new THREE.Quaternion();
        
        mesh.lookAt(new THREE.Vector3(0, 1, 0));
        
        this.mesh_.name = "boat";
        scene.add(this.mesh_);
    }
    
    get mesh()
    {
        return this.mesh_;
    }
    
    get deltaRotation()
    {
        return this._deltaRotation;
    }
    
    set deltaRotation(dr) {
        this._deltaRotation = dr;
    }
    
    get deltaMovement()
    {
        return this._deltaMovement;
    }
    
    set deltaMovement(dm) {
        this._deltaMovement = dm;
    }
    
    get isMoving()
    {
        return this._isMoving;
    }
    
    set isMoving(dm) {
        this._isMoving = dm;
    }
    
    get isRotating()
    {
        return this._isRotating;
    }
    
    set isRotating(dm) {
        this._isRotating = dm;
    }
    
  
    startMove(destination)
    {
        this.destination = destination.clone();
        
        this.destination.y = this.mesh_.position.y;
     
        var quatBackup = this.mesh_.quaternion.clone();
        this.mesh_.lookAt(destination);
        this.targetQuat = this.mesh_.quaternion.clone();
        
        this.mesh_.setRotationFromQuaternion(quatBackup);   
        
        this._isRotating = true;
        this._isMoving = true;
    }
    
    stopMove()
    {
        this._isRotating = false;
        this._isMoving = false;
    }
    
    update()
    {    
        if (this._isMoving)
        {
            if (this._isRotating)
            {
                var currentQuat = this.mesh_.quaternion.clone();
            
                if(currentQuat.angleTo(this.targetQuat) < 0.001)
                {
                    //this._isMoving = true;
                    this._isRotating = false;
                }

                currentQuat.slerp( this.targetQuat, 0.1 ); 

                this.mesh_.setRotationFromQuaternion(currentQuat);
            }

            var destination = this.destination.clone();
            
            var difference = destination.sub(this.mesh.position);
            console.log("dist: ");
            console.log(difference.length());
 
            var distance  = difference.length();
            difference.normalize();           
           
            var speed = this.speed;
            if (speed >= distance)
            {
                speed = distance;
                this._isMoving = false;
            }
            
            this._deltaMovement.x = difference.x * speed;
            this._deltaMovement.y = difference.y * speed;
            this._deltaMovement.z = difference.z * speed;
            
            this.mesh_.position.add(this._deltaMovement);
        }
        else
        {
            this._deltaMovement.x = 0;
            this._deltaMovement.y = 0;
            this._deltaMovement.z = 0;
        }
    }
    
}

export { MovableObject };