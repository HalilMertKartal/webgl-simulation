import * as THREE from './Three.js';
// x:100, y: 0 ,z: -400


class Node
{
    constructor(pos)
    {
        this._pos = pos;
        this._parent = null;
        this._g = 0;
        this._f = 0;
        this._h = 0;
        this._closed = false;
        this._visited = false;
        
        this._neighbors = [];
    }
    
    resetNodeInfo()
    {
        this._parent = null;
        this._g = 0;
        this._f = 0;
        this._h = 0;
        this._closed = false;
        this._visited = false;
    }
    
    get visited()
    {
        return this._visited;
    }
    
    set visited(dr) {
        this._visited = dr;
    }
    
    get closed()
    {
        return this._closed;
    }
    
    set closed(dr) {
        this._closed = dr;
    }
    
    
    get parent()
    {
        return this._parent;
    }
    
    set parent(dr) {
        this._parent = dr;
    }
    
    get pos()
    {
        return this._pos;
    }
    
    set pos(dr) {
        this._pos_f = dr;
    }
    
    get g()
    {
        return this._g;
    }
    
    set g(dr) {
        this._g = dr;
    }
    
    get h()
    {
        return this._h;
    }
    
    set h(dr) {
        this._h = dr;
    }
    
    
    get f()
    {
        return this._f;
    }
    
    set f(dr) {
        this._f = dr;
    }
    
    get neighbors()
    {
        return this._neighbors;
    }
    
    set neighbors(dr) {
        this._neighbors = dr;
    }
    
}

class NavigationManager
{
    constructor(scene)
    {
        this._scene = scene;
        this._collision_boxes = [];
        this._nodes = new Map();
        this._mapWidth = 200;
        this._mapHeight = 200;
        this._gridDistance = 50;
        this._mapOrigin = new THREE.Vector3(-2000,0,-5000);
        this._raycaster = new THREE.Raycaster();
        
        // generate grids
        this.generateGrids(this._gridDistance, this._mapWidth, this._mapHeight, this._mapOrigin);
        console.log(this._nodes);
         
        // mapOriginZ + i * dist, 0 <= i < width  (-1000 -> +4940)
        // mapOriginX + i * dist, 0 <= i < height (0 -> 5940)
        
       //for (let [key, value] of this._nodes) {
       //   this.showPoint(value.pos);
      // }

       // for (const point of this._nodes) 
        //{
        //    this.showPoint(point);
         //   console.assert(this.isGridX(point.x), "isGridX wrong!");
         //   console.assert(this.isGridZ(point.z), "isGridZ wrong!");
        //}
    }
    
    isCollisionObject(obj)
    {
        for(var i = 0; i < this._collision_boxes.length; i++)
        {
            if(obj === this._collision_boxes[i])
                return true;
        }
        return false;
    }
    
    registerStone(obj)
    {
        const geometry = new THREE.BoxGeometry( 100, 30, 100 );
        //const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        const cube = new THREE.Mesh( geometry); //material  );
        cube.material.visible = false;
        cube.position.set(obj.position.x, obj.position.y, obj.position.z);
        this._collision_boxes.push( cube );
        this._scene.add(cube);
    }
        
    isGridZ(z)
    {
        console.assert(z >= this._mapOrigin.z, "isGridZ, out of map bounds!");
        
        const difference = z - this._mapOrigin.z;
        const remainder = difference % this._gridDistance;
        return remainder === 0;
        
    }
    
    isGridX(x)
    {
        // this._mapOrigin.x + this._gridDistance * i, i £ (0, this._mapWidth)
        console.assert(x >= this._mapOrigin.x, "isGridX, out of map bounds!");
        
        const difference = x - this._mapOrigin.x;
        const remainder = difference % this._gridDistance;
        return remainder === 0;
    }
    
    isEdgeObstructed(from, to)
    {
        // check if there exists a stone between from to to.
        var dir = to.clone();
        dir.sub(from);
        dir.normalize();
        
        this._raycaster.set(from.clone(), dir);
        
        var far = new THREE.Vector3();
        this._raycaster.far = far.subVectors(to, from).length() + 100;
        var intersects = this._raycaster.intersectObjects( this._collision_boxes);
        if ( intersects.length > 0 ) {      
               return true;     
        }
        
        return false;
    }
    
    getClosestGrid(pos, obj, lookOffset)
    {
        // we use this to make sure to select a grid that object looks towards, not behind.
        var i = ((pos.x - this._mapOrigin.x) / this._gridDistance)>>0;
        var rounded_x = this._mapOrigin.x + (i * this._gridDistance);   
        
        i = (((pos.z - this._mapOrigin.z) / this._gridDistance)>>0);
        var rounded_z =  this._mapOrigin.z + (i * this._gridDistance);;      
        
        return new THREE.Vector3(rounded_x,0,rounded_z);
        
        if(!obj)
        {
            return new THREE.Vector3(rounded_x,0,rounded_z);
        }
        
        var lookTarget = obj.localToWorld(lookOffset).clone();
        var xIncreased = lookTarget.x > obj.position.x;
        var zIncreased = lookTarget.z > obj.position.z;
        
        if(xIncreased)
        {
            while(rounded_x < lookTarget.x)
                rounded_x += this._gridDistance;
        }
        else
        {
             while(rounded_x > lookTarget.x)
                rounded_x -= this._gridDistance;
        }
            
        if(zIncreased)
        {
            while(rounded_z < lookTarget.z)
                rounded_z += this._gridDistance;
        }
        else
        {
             while(rounded_z > lookTarget.z)
                rounded_z -= this._gridDistance;
        }
      
        console.assert(this.isGridX(rounded_x), "getClosestGrid rounded to non-map X");
        console.assert(this.isGridZ(rounded_z), "getClosestGrid rounded to non-map Z");
       
        const val = new THREE.Vector3(rounded_x,0,rounded_z);
        return val;
    }
    
    
    findPath(s, d, obj, lookOffset)
    {
        var heap = function() {
            return new BinaryHeap(function(node) {
                return node.f;
            });
        };
    
        for (let [key, value] of this._nodes) {
            value.resetNodeInfo();
        }
      
        console.log("COLLISION SIZE: ");
        console.log(this._collision_boxes.length);
        
        THREE.Vector3.prototype.toString = function () {
        return '[' + this.x + ',' + this.y +  ',' + this.z + ']';
        };
        
        var start = this._nodes.get(this.getClosestGrid(s, obj, lookOffset).toString());
        console.log("Start: ");
        console.log(start);
        console.assert(start, "start pos not found in nodes!");
        if(!start)
        {
             alert("0");
             return [];
        }
            
        
        var end = this._nodes.get(this.getClosestGrid(d).toString());
        console.assert(end, "end pos not found in nodes!");
        console.log("End: ");
        console.log(end);
        if(!end)
        {
            alert("The point you clicked is not on the map. Try again");
            return [];
        }

        var openHeap = heap();
        openHeap.push(start);  
        
        while(openHeap.size() > 0)
        {
            var currentNode = openHeap.pop();
            
            if(currentNode.pos === end.pos) 
            {
                var curr = currentNode;
                var ret = [];
                while(curr.parent) {
                  ret.push(curr);
                  curr = curr.parent;
                }
                return ret.reverse();
            }
            
            // move current node from open to closed and process neighbors
            currentNode.closed = true;
            
            for(var i = 0; i< currentNode.neighbors.length; i++)
            {
                var neighbor = currentNode.neighbors[i];
                if(neighbor.closed || this.isEdgeObstructed(currentNode.pos, neighbor.pos)) 
                {
                    // already processed / path contains stone
                    continue;
                }
                
                var gScore = currentNode.g + 1; // 1 is the distance from a node to it's neighbor
                var beenVisited = neighbor.visited;
                if(!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.pos.manhattanDistanceTo(end.pos);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }      
        }
        
        return []; // failure
    }
    
    showPoint(pos)
    {
        var dotGeometry = new THREE.BufferGeometry();
        dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pos.toArray(), 3 ) );
        var dotMaterial = new THREE.PointsMaterial( { size: 2, color: 0xFFD700 } );
        var dot = new THREE.Points( dotGeometry, dotMaterial );
        this._scene.add( dot );
    }
    
    generateGrids(distance, width, height, start)
    {
        // without this i can't use vector3 as map key
        THREE.Vector3.prototype.toString = function () {
        return '[' + this.x + ',' + this.y +  ',' + this.z + ']';
        };
              
        var x = start.x;
        
        for(var i =0; i < width; i++)
        {
            var z = start.z;
            for(var j = 0; j < height; j++)
            {
                const pos   = new THREE.Vector3(x, 0, z);
                const upPos = new THREE.Vector3(x, 0, z + distance);
                const rightPos = new THREE.Vector3(x + distance, 0, z);
                
                const upRightPos = new THREE.Vector3(x + distance, 0, z + distance);
                const downRightPos = new THREE.Vector3(x + distance, 0, z - distance);
                
                var currentNode = this._nodes.get(pos.toString());
                if (!currentNode)
                {
                    currentNode = new Node(pos);
                    this._nodes.set(pos.toString(),currentNode);
                }
                
                var upNode = this._nodes.get(upPos.toString());
                if (!upNode)
                {
                    upNode = new Node(upPos);
                    this._nodes.set(upPos.toString(),upNode);
                }
                
                
                var rightNode = this._nodes.get(rightPos.toString());
                if (!rightNode)
                {
                    rightNode = new Node(rightPos);
                    this._nodes.set(rightPos.toString(),rightNode);
                }
                
                var upRightNode = this._nodes.get(upRightPos.toString());
                if (!upRightNode)
                {
                    upRightNode = new Node(upRightPos);
                    this._nodes.set(upRightPos.toString(),upRightNode);
                }
                
                var downRightNode = this._nodes.get(downRightPos.toString());
                if (!downRightNode)
                {
                    downRightNode = new Node(downRightPos);
                    this._nodes.set(downRightPos.toString(),downRightNode);
                }
                
                // add up edge
                currentNode.neighbors.push(upNode);
                upNode.neighbors.push(currentNode);
                
                // add right edge
                currentNode.neighbors.push(rightNode);
                rightNode.neighbors.push(currentNode);
                
                // add up right edge
                currentNode.neighbors.push(upRightNode); // todo set edge value
                upRightNode.neighbors.push(currentNode);
                
                // add down right edge
                currentNode.neighbors.push(downRightNode);
                downRightNode.neighbors.push(currentNode);
                               
                z += distance; // goto next row
            }
            
            x += distance; // goto next column
        }
    }  
}

function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      var swap = null;
      var child1Score;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};

export { NavigationManager };