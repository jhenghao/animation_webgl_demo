var canvas;
var gl;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;

var last_update_time = 0.0;
var total_time = 0.0;

var cubeImage;
var cubeTexture;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexNormalAttribute;
var textureCoordAttribute;
var perspectiveMatrix;


var wasp_world_positions = [];
var wasp_world_normals = [];
var wasp_vertex_indices = [];

//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {
  canvas = document.getElementById("glcanvas");

  initWebGL(canvas);      // Initialize the GL context
  
  // Only continue if WebGL is available and working
  
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    initAnimationData();
    
    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    
    initShaders();
    
    // Here's where we call the routine that builds all the objects
    // we'll be drawing.
    
    initBuffers();
    
    // Next, load and set up the textures we'll be using.
    
	// TODO#2 Start
    cubeTexture = createCubeTexture("Hello World!");
    // TODO#2 End
	
    // Set up to draw the scene periodically.
    
    setInterval(drawScene, 15);
  }
}

function initAnimationData () {
    ReadData();
    CalcModelMatrix(0, Matrix.I(4));

    for (var idx = 0; idx < g_skin_vertices.length; ++idx)
    {
        var world_position = CalcWorldPosition(idx);
        wasp_world_positions.push(world_position.e(1));
        wasp_world_positions.push(world_position.e(2));
        wasp_world_positions.push(world_position.e(3));

        var world_normal = CalcWorldNormal(idx);
        wasp_world_normals.push(world_normal.e(1));
        wasp_world_normals.push(world_normal.e(2));
        wasp_world_normals.push(world_normal.e(3));
    }

    PrecomputeKeyframeCoefficients();
/*
    var num_of_channels = g_anim_channels.length;
    for (var idx = 41; idx < 42; ++idx)
    {
        console.log("##### idx: " + idx);
        var t = 0.0;
        while (t < 4)
        {
                console.log(ChannelEvaluate(t, idx));
                t += 0.1;
        }
    }
*/
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;
  
  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }
  
  // If we don't have a GL context, give up now
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initBuffers() {
  
  // Create a buffer for the cube's vertices.
  
  cubeVerticesBuffer = gl.createBuffer();
  
  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  
  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wasp_world_positions), gl.DYNAMIC_DRAW);

  // Set up the normals for the vertices, so that we can compute lighting.
  
  cubeVerticesNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wasp_world_normals), gl.DYNAMIC_DRAW);
  

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  
  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  
  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var num_of_triangles = g_skin_triangle_list.length;
  for (var triangle_idx = 0; triangle_idx < num_of_triangles; ++triangle_idx)
  {
        wasp_vertex_indices.push(g_skin_triangle_list[triangle_idx][0]);
        wasp_vertex_indices.push(g_skin_triangle_list[triangle_idx][1]);
        wasp_vertex_indices.push(g_skin_triangle_list[triangle_idx][2]);
  }
  
  // Now send the element array to GL
  
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(wasp_vertex_indices), gl.STATIC_DRAW);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
// TODO#1 Start
function createCubeTexture(text) {
				
	// create a hidden canvas to draw the texture 
	var canvas = document.createElement('canvas');
	canvas.id     = "hiddenCanvas";
	canvas.width  = 512;
	canvas.height = 512;
	canvas.style.display   = "none";
	var body = document.getElementsByTagName("body")[0];
	body.appendChild(canvas);		

	// draw texture
	var cubeImage = document.getElementById('hiddenCanvas');
	var ctx = cubeImage.getContext('2d');
	ctx.beginPath();
	ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);			
	ctx.fillStyle = 'white';
	ctx.fill();
	ctx.fillStyle = 'black';
	ctx.font = "65px Arial";
	ctx.textAlign = 'center';			
	ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
	ctx.restore();		

	// create new texture
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	handleTextureLoaded(cubeImage, texture) 
	
	return texture;
}
// TODO#1 End
 
function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {

        var current_time = (new Date).getTime();
        if (last_update_time) 
        {
                var delta = current_time - last_update_time;
                total_time += delta / 1000;
                UpdateAnimation(total_time);
        }
  
        last_update_time = current_time;

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  
  perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
  
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  
  loadIdentity();
  
  // Now move the drawing position a bit to where we want to start
  // drawing the cube.
  
  mvTranslate([0.0, 0.0, -10.0]);
  
  // Save the current matrix, then rotate before we draw.
  
  mvPushMatrix();
  mvRotate(90, [0, 1, 0]);
  
  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wasp_world_positions), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  
  //gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  //gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
  
  // Bind the normals buffer to the shader attribute.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wasp_world_normals), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
  
  // Specify the texture to map onto the faces.
  
  //gl.activeTexture(gl.TEXTURE0);
  //gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  //gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  
  // Draw the cube.
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  setMatrixUniforms();
  //gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.TRIANGLES, wasp_vertex_indices.length, gl.UNSIGNED_SHORT, 0);
  
  // Restore the original matrix
  
  mvPopMatrix();
  
  // Update the rotation for the next draw, if it's time to do so.
  
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  //textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  //gl.enableVertexAttribArray(textureCoordAttribute);
  
  vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(vertexNormalAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  
  // Didn't find an element with the specified ID; abort.
  
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  
  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  
  var shader;
  
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }
  
  // Send the source to the shader object
  
  gl.shaderSource(shader, theSource);
  
  // Compile the shader program
  
  gl.compileShader(shader);
  
  // See if it compiled successfully
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
  
  var normalMatrix = mvMatrix.inverse();
  normalMatrix = normalMatrix.transpose();
  var nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }
  
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;
  
  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}
