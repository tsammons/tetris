if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
      return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
          window.setTimeout( callback, 1000 / 60 );
      };
    })();
}

window.Tetris = window.Tetris || {};
Tetris.Board = {};

Tetris.Board.COLLISION = {NONE: 0, WALL: 1, GROUND: 2};
Object.freeze(Tetris.Board.COLLISION);

Tetris.Board.FIELD = {EMPTY:0, ACTIVE:1, PETRIFIED:2};
Object.freeze(Tetris.Board.FIELD);


Tetris.Board.fields = [];
Tetris.Board.init = function (_x, _y, _z){
    for (var x=0; x<_x; x++){
        Tetris.Board.fields[x] = [];
        for (var y=0; y<_y; y++){
            Tetris.Board.fields[x][y] = [];
            for (var z=0; z < _z; z++){
                Tetris.Board.fields[x][y][z] = Tetris.Board.FIELD.EMPTY;
            }
        }
    }
}

Tetris.Utils = {};

//allow multiple versions of a single vector to be stored to prevent memory problems
Tetris.Utils.cloneVector = function(v){
    return new THREE.Vector3(v.x, v.y, v.z);
}

Tetris.Utils.roundVector = function(v) {
    v.x = Math.round(v.x);
    v.y = Math.round(v.y);
    v.z = Math.round(v.z);
};

Tetris.Block = {};

//shapes
Tetris.Block.shapes = [
	[
        {x: 0, y:0, z:0}
    ],
    [
        {x: 0, y:0, z:0},
        {x: 0, y:0, z:1},
        {x: 0, y:0, z:2},
        {x: 0, y:0, z:3}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 1, y: 0, z: 0},
        {x: 1, y: 0, z: 1},
        {x: 1, y: 0, z: 2}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 1},
        {x: 1, y: 0, z: 0},
        {x: 1, y: 0, z: 1}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 1},
        {x: 0, y: 0, z: 2},
        {x: 1, y: 0, z: 1}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 1},
        {x: 1, y: 0, z: 1},
        {x: 1, y: 0, z: 2}
    ]
];



// configuration object
var boundingBoxConfig = {
    width: 800,
    height: 100,
    depth: 2000,
    splitX: 8,
    splitY: 1,
    splitZ: 20
};


Tetris.Block.position = {};
Tetris.Colors = [
    0x1bf9dc, 0xffff00, 0x28b463
];
//generate 
Tetris.Block.generate = function(){
    var geometry, tmpGeometry;

    var type = Math.floor(Math.random() * (Tetris.Block.shapes.length));
    this.blockType = type;

    //how the block is an array of block positions
    Tetris.Block.shape = [];

    
    //Loads the block positions
    for (var i = 0; i < Tetris.Block.shapes[type].length; i++){
        Tetris.Block.shape[i] = Tetris.Utils.cloneVector(Tetris.Block.shapes[type][i]);
    }

    //Takes the blocks, then combiens them into one shape 
    geometry = new THREE.CubeGeometry(Tetris.blockSize, Tetris.blockSize, Tetris.blockSize);
    for (var i = 1; i < Tetris.Block.shape.length; i++){
        var newCubeGeometry = new THREE.CubeGeometry(Tetris.blockSize, Tetris.blockSize, Tetris.blockSize);
        tmpGeometry = new THREE.Mesh(newCubeGeometry);
        tmpGeometry.position.x = Tetris.blockSize * Tetris.Block.shape[i].x;
        tmpGeometry.position.z = Tetris.blockSize * Tetris.Block.shape[i].z;
        THREE.GeometryUtils.merge(geometry, tmpGeometry);
    }

    Tetris.Block.mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, [
        new THREE.MeshBasicMaterial({color:0x000000, shading:THREE.FlatShading, wireframe:true, transparent:true}),
        new THREE.MeshBasicMaterial({color:Tetris.Colors[Math.floor(Math.random() * (Tetris.Colors.length))]})//0xff0000})

    ]);
    console.log

    //Initial Position
    Tetris.Block.position = {
        x: Math.floor(Tetris.boundingBoxConfig.splitX/2)-1, 
        y: 0,
        z: 19
    };

    if (Tetris.Board.testCollision(true) === Tetris.Board.COLLISION.GROUND) {
        Tetris.gameOver = true;
        Tetris.pointsDOM.innerHTML = "GAME OVER";
    }

    Tetris.Block.mesh.position.x = (Tetris.Block.position.x - Tetris.boundingBoxConfig.splitX/2) * Tetris.blockSize/2;
    Tetris.Block.mesh.position.y = 0;
    Tetris.Block.mesh.position.z = (Tetris.Block.position.z - Tetris.boundingBoxConfig.splitZ / 2) * Tetris.blockSize + Tetris.blockSize / 2;
    Tetris.Block.mesh.rotation = {x: 0, y: 0, z: 0};
    Tetris.Block.mesh.overdraw = true;


    Tetris.scene.add(Tetris.Block.mesh); 
}

Tetris.Block.rotate = function(x,y,z){
    Tetris.Block.mesh.rotateX(x*Math.PI/180);
    Tetris.Block.mesh.rotateY(y*Math.PI/180);
    Tetris.Block.mesh.rotateZ(z*Math.PI/180);

    var rotationMatrix = new THREE.Matrix4();

    Tetris.Block.mesh.rotation.x += x * Math.PI/180;
    Tetris.Block.mesh.rotation.y += y * Math.PI/180;
    Tetris.Block.mesh.rotation.z += z * Math.PI/180;

    var a = new THREE.Euler(Tetris.Block.mesh.rotation.x, Tetris.Block.mesh.rotation.y, Tetris.Block.mesh.rotation.z, 'XYZ');
    rotationMatrix.makeRotationFromEuler(a);

    //console.log(rotationMatrix.elements);

    for (i = 0; i < Tetris.Block.shape.length; i++){

        Tetris.Block.shape[i] = Tetris.Utils.cloneVector(Tetris.Block.shapes[this.blockType][i]).applyMatrix4(rotationMatrix);
        Tetris.Utils.roundVector(Tetris.Block.shape[i]);
        console.log(Tetris.Block.shape[i].x, Tetris.Block.shape[i].y, Tetris.Block.shape[i].z);
    }
    if (Tetris.Board.testCollision(false) == Tetris.Board.COLLISION.WALL){
        console.log('INVALID')
        Tetris.Block.rotate(-x, -y, -z); //Basically rotate it back if it detects a collision
    }
};


//convert to static 
Tetris.Block.petrify = function(){
    var shape = Tetris.Block.shape;
    for (var i = 0; i < shape.length; i++){
        Tetris.addStaticBlock(
            Tetris.Block.position.x + shape[i].x,
            Tetris.Block.position.y + shape[i].y,
            Tetris.Block.position.z + shape[i].z
        );

        Tetris.Board.fields[Tetris.Block.position.x + shape[i].x][Tetris.Block.position.y + shape[i].y][Tetris.Block.position.z + shape[i].z] = Tetris.Board.FIELD.PETRIFIED;
    }
};

Tetris.Block.hitBottom = function(){
    Tetris.Block.petrify();
    Tetris.scene.remove(Tetris.Block.mesh);
    Tetris.Block.generate();
};

Tetris.Block.move = function(x,y,z){
    Tetris.Block.mesh.position.x += x*Tetris.blockSize;
    Tetris.Block.position.x += x;

    Tetris.Block.mesh.position.y += y*Tetris.blockSize;
    Tetris.Block.position.y += y;

    Tetris.Block.mesh.position.z += z *Tetris.blockSize;
    Tetris.Block.position.z += z;

    var collision = Tetris.Board.testCollision((z != 0));
    ///*
    if (collision === Tetris.Board.COLLISION.WALL){
        Tetris.Block.move(-x, 0, -z);
    }//*/
    //console.log(window.innerHeight);
    if(collision === Tetris.Board.COLLISION.GROUND){
        Tetris.Block.hitBottom();
        Tetris.Board.checkCompleted();
    }
};

//Tetris.Board.init(boundingBoxConfig.splitX, boundingBoxConfig.splitY, boundingBoxConfig.splitZ);


Tetris.Board.checkCompleted = function() {
    console.log("Checking Completed")
    var x,y,z,x2,y2,z2, fields = Tetris.Board.fields;
    var rebuild = false;

    var sum, expected = fields[0].length*fields.length, bonus = 0;
    
    for(z = 0; z < fields[0][0].length; z++) {
        sum = 0;
        for(y = 0; y < fields[0].length; y++) {
            for(x = 0; x < fields.length; x++) {
                if(fields[x][y][z] === Tetris.Board.FIELD.PETRIFIED) sum++;
            }               
        }

        if(sum == expected) {
            bonus += 1 + bonus; // 1, 3, 7, 15...
            
            for(y2 = 0; y2 < fields[0].length; y2++) {
                for(x2 = 0; x2 < fields.length; x2++) {
                    for(z2 = z; z2 < fields[0][0].length-1; z2++) {
                        Tetris.Board.fields[x2][y2][z2] = fields[x2][y2][z2+1];
                    }
                    Tetris.Board.fields[x2][y2][fields[0][0].length-1] = Tetris.Board.FIELD.EMPTY;
                }               
            }
            rebuild = true;
            z--;
        }
    }
    if(bonus) {
        Tetris.addPoints(1000 * bonus);
    }
    if(rebuild) {
        for(var z = 0; z < fields[0][0].length-1; z++) {
            for(var y = 0; y < fields[0].length; y++) {
                for(var x = 0; x < fields.length; x++) {
                    if(fields[x][y][z] == Tetris.Board.FIELD.PETRIFIED && !Tetris.staticBlocks[x][y][z]) {
                        Tetris.addStaticBlock(x,y,z);
                    }
                    if(fields[x][y][z] == Tetris.Board.FIELD.EMPTY && Tetris.staticBlocks[x][y][z]) {
                        Tetris.scene.remove(Tetris.staticBlocks[x][y][z]);
                        Tetris.staticBlocks[x][y][z] = undefined;
                    }
                }               
            }
        }       
    }
};

Tetris.init = function() {
    // set the scene size
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // create a WebGL renderer, camera
    // and a scene
    Tetris.renderer = new THREE.WebGLRenderer();
    Tetris.camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                    ASPECT,
                                    NEAR,
                                    FAR  );
    Tetris.scene = new THREE.Scene();

    // the camera starts at 0,0,0 so pull it back
    Tetris.camera.position.x = 0;
    Tetris.camera.position.y = -2700;//-1000;
    Tetris.camera.position.z = 55;//2000;
    Tetris.scene.add(Tetris.camera);

    // start the renderer
    Tetris.renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    document.body.appendChild(Tetris.renderer.domElement);
  
    //console.log("setting boundingBoxConfig")
    // configuration object
    Tetris.boundingBoxConfig = boundingBoxConfig;
    Tetris.blockSize = boundingBoxConfig.width/boundingBoxConfig.splitX;

    Tetris.Board.init(boundingBoxConfig.splitX, boundingBoxConfig.splitY, boundingBoxConfig.splitZ);
    
    var boundingBox = new THREE.Mesh(
        new THREE.CubeGeometry(boundingBoxConfig.width, boundingBoxConfig.height, boundingBoxConfig.depth, boundingBoxConfig.splitX, boundingBoxConfig.splitY, boundingBoxConfig.splitZ), 
        new THREE.MeshBasicMaterial( { color: 0xD3D3D3, wireframe: true } )
        );
    Tetris.scene.add(boundingBox);

    Tetris.renderer.render(Tetris.scene, Tetris.camera);


    document.getElementById("play_button").addEventListener('click', function (event) {
        event.preventDefault();
        Tetris.start();
    });
};


//Section for Static Blocks
Tetris.staticBlocks = [];

Tetris.addStaticBlock = function(x, y, z){
    if(Tetris.staticBlocks[x] === undefined) Tetris.staticBlocks[x] = [];
    if(Tetris.staticBlocks[x][y] === undefined) Tetris.staticBlocks[x][y] = [];

    var mesh = THREE.SceneUtils.createMultiMaterialObject(new THREE.CubeGeometry( Tetris.blockSize, Tetris.blockSize, Tetris.blockSize), [
        new THREE.MeshBasicMaterial({color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true}),
        new THREE.MeshBasicMaterial({color: 0xA9A9A9}) 
    ] );
    
    mesh.position.x = (x - Tetris.boundingBoxConfig.splitX/2)*Tetris.blockSize + Tetris.blockSize/2;
    mesh.position.y = (y - Tetris.boundingBoxConfig.splitY/2)*Tetris.blockSize + Tetris.blockSize/2;
    mesh.position.z = (z - Tetris.boundingBoxConfig.splitZ/2)*Tetris.blockSize + Tetris.blockSize/2;
    
    Tetris.scene.add(mesh); 
    Tetris.staticBlocks[x][y][z] = mesh;
}

Tetris.currentPoints = 0;
Tetris.addPoints = function(n) {
  Tetris.currentPoints += n;
  Tetris.pointsDOM.innerHTML = Tetris.currentPoints;
}

Tetris.Board.testCollision = function (ground_check){
    var x,y,z,i;

    //shorthands
    var fields = Tetris.Board.fields;

    var posx = Tetris.Block.position.x,
        posy = Tetris.Block.position.y,
        posz = Tetris.Block.position.z, 
        shape = Tetris.Block.shape;

    for (i =0; i < shape.length; i++){
        //4 walls detection for each shape
        if ((shape[i].x + posx) < 0 ||
            (shape[i].x + posx) >= fields.length){
            console.log("X out of bounds")
            return Tetris.Board.COLLISION.WALL;
        }

        //block on block detection
        if (fields[shape[i].x + posx][shape[i].y + posy][shape[i].z + posz - 1] === Tetris.Board.FIELD.PETRIFIED) {
            console.log("Hits another block")
            return ground_check ? Tetris.Board.COLLISION.GROUND : Tetris.Board.COLLISION.WALL;
        }

        //collision with the ground
        if ((shape[i].z + posz) <= 0){
            return Tetris.Board.COLLISION.GROUND;
        }
    }
}

Tetris.start = function() {
    //test
    //var i = 0, j = 0, k = 0, interval = setInterval(function() {if(i==6) {i=0;j++;} if(j==6) {j=0;k++;} if(k==6) {clearInterval(interval); return;} Tetris..colorticBlock(i,j,k); i++;},600);
    document.getElementById("menu").style.display = "none";
    Tetris.pointsDOM = document.getElementById("points");
    Tetris.pointsDOM.style.display = "block";
    Tetris.Block.generate();
    controls = new THREE.OrbitControls(Tetris.camera, Tetris.renderer.domElement);

    Tetris.animate();
};

Tetris.gameStepTime = 1000;

Tetris.frameTime = 0; // ms
Tetris.cumulatedFrameTime = 0; // ms
Tetris._lastFrameTime = Date.now(); // timestamp

Tetris.gameOver = false;

//keyboard commands
window.addEventListener('keydown', function (event) {
  var key = event.which ? event.which : event.keyCode;
 
  switch(key) {
    case 38: // up (arrow)
        //Tetris.Block.move(0, 1, 0);
        Tetris.Block.rotate(0, 90, 0); 
        
      break;
    case 70:
        Tetris.gameStepTime -= 150;
        break;
    case 83:
        Tetris.gameStepTime += 150;
        break;
    case 40: // down (arrow)
      Tetris.Block.move(0, 0, -1);
      break;
    case 37: // left(arrow)
      Tetris.Block.move(-1, 0, 0);
      break;
    case 39: // right (arrow)
      Tetris.Block.move(1, 0, 0);
      break;    
  }
}, false);

Tetris.animate = function() {
    var time = Date.now();
    Tetris.frameTime = time - Tetris._lastFrameTime;
    Tetris._lastFrameTime = time;
    Tetris.cumulatedFrameTime += Tetris.frameTime;

    while(Tetris.cumulatedFrameTime > Tetris.gameStepTime) {
    // block movement will go here
        Tetris.cumulatedFrameTime -= Tetris.gameStepTime;
        Tetris.Block.move(0,0,-1);
    }
    
    Tetris.renderer.render(Tetris.scene, Tetris.camera);

    controls.update();
    console.log(Tetris.camera.position.x, Tetris.camera.position.y, Tetris.camera.position.z);
    
    if(!Tetris.gameOver) window.requestAnimationFrame(Tetris.animate);
}

window.addEventListener("load", Tetris.init);