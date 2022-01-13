import { MovableObject } from './movable_object.js';
import * as THREE from './Three.js';
import { AssetManager, AssetId } from './AssetManager.js';

class Marker
{
    constructor(pos, material, scene)
    {
        this._scene = scene;
        this._geometry = new THREE.BufferGeometry();
        var actualPos = new THREE.Vector3(pos.x, pos.y - 1, pos.z);
        this._geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( actualPos.toArray(), 3 ) );
        this._mesh = new THREE.Points( this._geometry, material );
        this._id = pos.toString();
        this._mesh.name = this._id;
        
        scene.add(this._mesh);
        
        //this.dotGeometry.attributes.position.needsUpdate = true;
            
        //this.dotGeometry.computeBoundingSphere();
    }
    
    get id()
    {
        return this._id;
    }
    
    set id(i)
    {
        this._id = i;
    }
    
    
    destruct()
    {
        var selectedObject = this._scene.getObjectByName(this._id);
        this._scene.remove( selectedObject );
    }
    
}

class PlayerBoat extends MovableObject
{
    constructor(scene, position)
    {             
        var obj = scene.assetManager.getObject(AssetId.PlayerBoat);
        obj.position.set(position.x, position.y, position.z);
        super(obj, scene, 3);
        this.resetPath();
        this._scene = scene;
        
        this._line_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        const points = [];
        points.push(0,0,0);
        points.push(0,0,0);
        this._line_geometry = new THREE.BufferGeometry();
        this._line_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( points, 3 ) );
        this._line = new THREE.Line( this._line_geometry, this._line_material );
        this._scene.add(this._line);
                
        this.dotMaterial = new THREE.PointsMaterial( { size: 10, color: 0xFF2D00 } );
        this.markers = [];     
    }
    
    setPath(path)
    {
        this._path_index = 0;
        this._path = path;
        this._has_path = true;

        this.updateLine(path[0].pos);
        
        for(var i = 0; i < this._path.length; i++)
        {
            var node = this._path[i].pos;
            this.markers.push(new Marker(node, this.dotMaterial, this._scene));
        }
        
        super.startMove(path[0].pos);
        
        console.log("ORIGIN: ");
        console.log(super.mesh.position);
        
        console.log("PATH: ");
        console.log(path);
        
        console.log("START_MOVE: ");
        console.log(path[0].pos);
        
        console.log("DESTINATION: ");
        console.log(path[path.length-1].pos);
        
        console.log("PATH SIZE: ");
        console.log(path.length);
    }
    
    removeMarker(pos)
    {
        for(var i = 0; i < this.markers.length; i++)
        {
            var marker = this.markers[i];
            if (marker.id === pos.toString())
            {
                console.log("found!");
                marker.destruct();
            }
                
        }
    }
    
    stopMove()
    {
        super.stopMove();
        this.resetPath();
    }
    
    resetPath()
    {
        this._path_index = 0;
        this._has_path = false;
        this._path = [];
        if (this.markers)
        {
            for(var i = 0; i < this.markers.length; i++)
            {
                var marker = this.markers[i];
                marker.destruct();   
            }
        }

    }
    
    updateLine(to, localLookOffset)
    {
        if(!localLookOffset)
            return;

        //lookDirection.sub(super.mesh.position);
        //lookDirection.normalize();
         
        
        //var last = new THREE.Vector3();
        //last.x = to.x + lookDirection.x * 50;
        //last.y = to.y + lookDirection.y * 50;
        //last.z = to.z + lookDirection.z * 50;
        
        const points = [];
        
        points.push( super.mesh.position.x, super.mesh.position.y, super.mesh.position.z );
        points.push( to.x, to.y, to.z);//last.x, last.y, last.z);

        this._line_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( points, 3 ) );    
        this._line_geometry.verticesNeedUpdate = true;
        this._line_geometry.computeBoundingSphere();
    }
    
    update(localLookOffset)
    {
        super.update();
        
        if(this._has_path === false)
            return;
        
        // a portion of path is completed, go to next portion.
        if(!super.isMoving)
        {
            //console.log("REACHED: ");
            //console.log(this._path[this._path_index].pos);
            //console.log("ACTUAL_POS: ");
            //console.log(super.mesh.position.clone());
            this.removeMarker(this._path[this._path_index].pos);
            
            this._path_index++; // go to next path
            
            if(this._path_index >= this._path.length)
            {
                 console.log("PATH ENDED!");
                this.resetPath();
                return;
            }
            
            
            super.startMove(this._path[this._path_index].pos);
        }
        else
        {
            this.updateLine(this._path[this._path_index].pos, localLookOffset);
        }
    }
}

export { PlayerBoat };