//https://midkar.com/MidiStudio/JPT/index.html
//https://sketchfab.com/feed
//https://threejs.org/examples/misc_controls_pointerlock.html

import * as THREE from "three";
import * as Tone from "tone";
import "./styles.css";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import { PointerLockControls } from "/PointerLockControls.js";

let camera, scene, renderer, controls;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let geometry, material, pianoBox, bassBox, drumsBox;
let floor;
let lightButtonPlanet;
let intensity, light;
let lightParams;
let ambientLight;

let listener, sound, audioLoader;
let sound1, audioLoader1;
let sound2, audioLoader2;
let soundParams;
let lightColourButtonPress = 0;

let clock, delta, interval;
let loader, modelLoaded, piano, bass, drums, furnature;

let slider;

let mouseDown, mouse, intersects;

let startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

let sceneHeight, sceneWidth;
sceneWidth = window.innerWidth;
sceneHeight = window.innerHeight;

function init() {
  //removes button after press
  let overlay = document.getElementById("overlay");
  overlay.remove();

  //clock
  clock = new THREE.Clock();
  delta = 0;
  interval = 1 / 2; //2fps

  //background colour set
  scene = new THREE.Scene();
  scene.background = new THREE.Color("black");
  //const spaceTexture = new THREE.TextureLoader().load("./texture/17520.jpg");
  //scene.background = spaceTexture;

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 40;

  //specify renderer and add to document
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //lighting
  lightParams = { r: 220, g: 20, b: 60 };
  intensity = 0.01;
  light = new THREE.DirectionalLight(lightParams, intensity);
  light.position.set(-10, 10, 10);
  scene.add(light);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  //mouse
  mouse = new THREE.Vector2();

  //window.addEventListener("pointermove", move, false); //If want to move
  window.addEventListener("pointerdown", triggerAttack, false);
  window.addEventListener("pointerup", triggerRelease, false);

  //GUI
  const gui = new GUI();

  //objetcs
  geometry = new THREE.BoxGeometry();
  material = new THREE.MeshNormalMaterial();
  pianoBox = new THREE.Mesh(geometry, material);
  bassBox = new THREE.Mesh(geometry, material);
  drumsBox = new THREE.Mesh(geometry, material);
  pianoBox.position.set(-4, 0.9, -6);
  bassBox.position.set(0, 0.9, -14);
  drumsBox.position.set(5, 0.9, -7);
  scene.add(pianoBox, bassBox, drumsBox);

  //Interaction objects
  let lightButtongeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
  let lightButtonMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    wireframe: false
  });
  lightButtonPlanet = new THREE.Mesh(lightButtongeometry, lightButtonMaterial);
  lightButtonPlanet.position.set(-20, 4, 0);
  slider = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 0.5),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false
    })
  );
  slider.position.z = 20;
  slider.position.y = 3;
  scene.add(lightButtonPlanet);

  //models
  modelLoaded = false;
  loadModels();

  //floor
  let textureLoader = new THREE.TextureLoader();
  let textureResult = textureLoader.load(
    "./texture/wood.jpeg",
    function (tex) {
      //console.log(tex);
    },
    function (evt) {
      console.log("progress ", evt);
    },
    function (evt) {
      console.log("err", evt);
    }
  );
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(75, 75),
    new THREE.MeshStandardMaterial({
      map: textureResult
    })
  );
  scene.add(floor);
  floor.rotateX(-Math.PI / 2);
  floor.position.y = -0.5;
  floor.position.z = 5;

  //text
  let textureLoader1 = new THREE.TextureLoader();
  let textureResult1 = textureLoader.load(
    "./texture/button_change.png",
    function (tex) {
      //console.log(tex);
    },
    function (evt) {
      console.log("progress ", evt);
    },
    function (evt) {
      console.log("err", evt);
    }
  );
  let lightButtonSign = new THREE.Mesh( //left left wall band
    new THREE.PlaneGeometry(5, 1),
    new THREE.MeshStandardMaterial({
      map: textureResult1
    })
  );

  let textureLoader2 = new THREE.TextureLoader();
  let textureResult2 = textureLoader.load(
    "./texture/EASY_INN.jpeg",
    function (tex) {
      //console.log(tex);
    },
    function (evt) {
      console.log("progress ", evt);
    },
    function (evt) {
      console.log("err", evt);
    }
  );
  let EasyInn = new THREE.Mesh( //left left wall band
    new THREE.PlaneGeometry(15, 5),
    new THREE.MeshStandardMaterial({
      map: textureResult2
    })
  );
  EasyInn.position.y = 10;
  EasyInn.position.z = 5;
  lightButtonSign.rotateY(Math.PI / 2);
  lightButtonSign.position.y = 2.5;
  lightButtonSign.position.x = -19.9;
  scene.add(lightButtonSign, EasyInn);

  //Walls
  let textureLoader0 = new THREE.TextureLoader();
  let textureResult0 = textureLoader.load(
    "./texture/Wall.jpeg",
    function (tex) {
      //console.log(tex);
    },
    function (evt) {
      console.log("progress ", evt);
    },
    function (evt) {
      console.log("err", evt);
    }
  );
  let wall0 = new THREE.Mesh( //left left wall band
    new THREE.PlaneGeometry(30, 10),
    new THREE.MeshStandardMaterial({
      map: textureResult0
    })
  );
  let wall1 = new THREE.Mesh( //left wall band
    new THREE.PlaneGeometry(30, 10),
    new THREE.MeshStandardMaterial({
      map: textureResult0
    })
  );
  let wall2 = new THREE.Mesh( //back wall band
    new THREE.PlaneGeometry(70, 10),
    new THREE.MeshStandardMaterial({
      map: textureResult0
    })
  );
  let wall3 = new THREE.Mesh( //left wall
    new THREE.PlaneGeometry(50, 10),
    new THREE.MeshStandardMaterial({
      map: textureResult0
    })
  );
  let wall4 = new THREE.Mesh( //right wall
    new THREE.PlaneGeometry(75, 10),
    new THREE.MeshStandardMaterial({
      map: textureResult0
    })
  );
  let wall5 = new THREE.Mesh( //left wall
    new THREE.PlaneGeometry(75, 10),
    new THREE.MeshStandardMaterial({
      map: textureResult0
    })
  );
  //wall0.rotateY(Math.PI / 2);
  wall0.position.y = 3;
  wall0.position.x = -35;
  wall0.position.z = 5;
  wall1.rotateY(Math.PI / 2);
  wall1.position.y = 3;
  wall1.position.x = -20;
  wall1.position.z = -10;
  wall2.position.y = 3;
  wall2.position.z = -25;
  wall3.rotateY(Math.PI / 2); //left wall
  wall3.position.y = 3;
  wall3.position.x = -35;
  wall3.position.z = 20;
  wall4.rotateY(-Math.PI / 2); //right wall
  wall4.position.y = 3;
  wall4.position.x = 35;
  wall4.position.z = 5;
  wall5.rotateY(-Math.PI);
  wall5.position.y = 3; //back wall
  wall5.position.x = 0;
  wall5.position.z = 42;
  scene.add(wall0, wall1, wall2, wall3, wall4, wall5);

  //stage
  let stageG = new THREE.CylinderGeometry(10, 10, 3, 10);
  let stage = new THREE.Mesh(
    stageG,
    new THREE.MeshBasicMaterial({
      map: textureResult
    })
  );
  stage.position.z = -10;
  scene.add(stage);

  //sound
  listener = new THREE.AudioListener();
  camera.add(listener);

  //piano
  sound = new THREE.PositionalAudio(listener);
  audioLoader = new THREE.AudioLoader();
  audioLoader.load("sounds/Piano.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setRefDistance(5);
    sound.setVolume(1.0);
    sound.play();
  });
  pianoBox.add(sound);

  //bass
  sound1 = new THREE.PositionalAudio(listener);
  audioLoader1 = new THREE.AudioLoader();
  audioLoader1.load("sounds/DB.mp3", function (buffer) {
    sound1.setBuffer(buffer);
    sound1.setRefDistance(5);
    sound1.setVolume(0.4);
    sound1.play();
  });
  bassBox.add(sound1);

  //drums
  sound2 = new THREE.PositionalAudio(listener);
  audioLoader2 = new THREE.AudioLoader();
  audioLoader2.load("sounds/Drums.mp3", function (buffer) {
    sound2.setBuffer(buffer);
    sound2.setRefDistance(5);
    sound2.setVolume(0.5);
    sound2.play();
  });
  drumsBox.add(sound2);

  soundParams = { p: 1.0, b: 0.4, d: 0.5 };
  gui.add(soundParams, "p", 0.0, 1.0).name("Piano volume");
  gui.add(soundParams, "b", 0.0, 1.0).name("Bass volume");
  gui.add(soundParams, "d", 0.0, 1.0).name("Drums volume");

  window.addEventListener("resize", onWindowResize, false);

  //controls
  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("workpls");
  const instructions = document.getElementById("underlay");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
      default:
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
      default:
    }
  };

  window.addEventListener("pointermove", move, false);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(camera),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  //helpers
  const helper = new THREE.DirectionalLightHelper(light, 5);
  //scene.add(helper);
  play();
}
//animation functions
function play() {
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

function stop() {
  renderer.setAnimationLoop(null);
}

function update() {
  sound.setVolume(soundParams.p);
  sound1.setVolume(soundParams.b);
  sound2.setVolume(soundParams.d);

  const time = performance.now();

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects, false);

    const onObject = intersections.length > 0;

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 15.0 * delta;
    velocity.z -= velocity.z * 15.0 * delta;

    velocity.y -= 20.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 3.5) {
      velocity.y = 0;
      controls.getObject().position.y = 3.5;

      canJump = true;
    }
  }

  prevTime = time;
}

function render() {
  renderer.render(scene, camera);
}

function onWindowResize() {
  //resize and align
  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}

function loadModels() {
  loader = new GLTFLoader();

  const onLoadStatic = function (gltf, position) {
    piano = gltf.scene.children[0];
    piano.scale.multiplyScalar(1.125);
    piano.position.copy(position);
    modelLoaded = true;
    piano.rotateZ(-Math.PI / 1.5);
    scene.add(piano);
  };
  const inLoadStatic = function (gltf, position) {
    bass = gltf.scene.children[0];
    bass.scale.multiplyScalar(3.5);
    bass.position.copy(position);
    modelLoaded = true;
    bass.rotateZ(-Math.PI / 6);
    scene.add(bass);
  };
  const enLoadStatic = function (gltf, position) {
    drums = gltf.scene.children[0];
    drums.scale.multiplyScalar(1.125);
    drums.position.copy(position);
    modelLoaded = true;
    drums.rotateZ(-Math.PI / 3.0);
    scene.add(drums);
  };
  const unLoadStatic = function (gltf, position) {
    furnature = gltf.scene.children[0];
    console.log(furnature);
    furnature.scale.multiplyScalar(0.1);
    furnature.position.copy(position);
    modelLoaded = true;
    furnature.rotateZ(-Math.PI);
    scene.add(furnature);
  };

  const onProgress = function () {
    console.log("progress");
  };

  const onError = function (errorMessage) {
    console.log(errorMessage);
  };

  const pianoPosition = new THREE.Vector3(-6, 1.5, -5);
  loader.load(
    "models/piano_3d/scene.gltf",
    function (gltf) {
      onLoadStatic(gltf, pianoPosition);
    },
    onProgress,
    onError
  );
  const doubleBassPosition = new THREE.Vector3(0, 4.5, -14);
  loader.load(
    "models/bass_base_violin/scene.gltf",
    function (gltf) {
      inLoadStatic(gltf, doubleBassPosition);
    },
    onProgress,
    onError
  );
  const drumsPosition = new THREE.Vector3(2, 1.5, -5.5);
  loader.load(
    "models/drum_set/scene.gltf",
    function (gltf) {
      enLoadStatic(gltf, drumsPosition);
    },
    onProgress,
    onError
  );
  // const furnaturePosition = new THREE.Vector3(29, -0.5, -10);
  // loader.load(
  //   "models/table_set/scene.gltf",
  //   function (gltf) {
  //     unLoadStatic(gltf, furnaturePosition);
  //   },
  //   onProgress,
  //   onError
  // );
  // const furnaturePosition1 = new THREE.Vector3(29, -0.5, 10);

  // loader.load(
  //   "models/table_set/scene.gltf",
  //   function (gltf) {
  //     unLoadStatic(gltf, furnaturePosition1);
  //   },
  //   onProgress,
  //   onError
  // );

  // const furnaturePosition2 = new THREE.Vector3(29, -0.5, 30);
  // loader.load(
  //   "models/table_set/scene.gltf",
  //   function (gltf) {
  //     unLoadStatic(gltf, furnaturePosition2);
  //   },
  //   onProgress,
  //   onError
  // );
}

function triggerAttack(event) {
  console.log("down");

  raycaster.setFromCamera(mouse, camera); //creates ray
  intersects = raycaster.intersectObject(lightButtonPlanet);
  if (intersects === raycaster.intersectObject(lightButtonPlanet)) {
    console.log("LIGHT");
  } else {
    console.log("NADA");
  }
  //intersects = raycaster.intersectObject(slider);
  if (intersects.length > 0) {
    //if anything in array
    mouseDown = true;
  }

  if (mouseDown) {
    slider.material.color.setHex(0xff00ff);

    lightColourButtonPress++;
    switch (lightColourButtonPress) {
      case 1:
        lightButtonPlanet.material.color.setHex(0xff00ff); //purple
        light.color = new THREE.Color(255, 0, 255);
        break;
      case 2:
        lightButtonPlanet.material.color.setHex(0x59c856); //green
        light.color = new THREE.Color(8, 150, 0);
        break;
      case 3:
        lightButtonPlanet.material.color.setHex(0x0000ff); //blue
        light.color = new THREE.Color(0, 0, 255);
        break;
      case 4:
        lightButtonPlanet.material.color.setHex(0xffa500); //orange
        light.color = new THREE.Color(150, 70, 0);
        break;
      case 5:
        lightButtonPlanet.material.color.setHex(0xff0000); //red
        light.color = new THREE.Color(175, 7, 7);
        break;
      default:
    }
    if (lightColourButtonPress === 6) {
      lightColourButtonPress = 0;
    }
  }
}

function triggerRelease(event) {
  console.log("up");

  mouseDown = false;
  console.log("up");
  lightButtonPlanet.material.color.setHex(0x000000);
  slider.material.color.setHex(0x000000);
}

function move(event) {
  mouse.x = (event.clientX / sceneWidth) * 2 - 1;
  mouse.y = -(event.clientY / sceneHeight) * 2 + 1;

  if (mouseDown) {
    // Make the sphere follow the mouse
    let vector = new THREE.Vector3(mouse.x, mouse.y, 0.5); // create a new 3D vector using our mouse position
    vector.unproject(camera); // project mouse vector into world space using camera's normalised device coordinate space
    let dir = vector.sub(camera.position).normalize(); // Create a direction vector based on subtracting our camera's position from our mouse position
    //let distance = -camera.position.z / dir.z; // derive distance from the negative z position of the camera divided by our direction's z position
    let pos = camera.position.clone().add(dir.multiplyScalar(5)); //create a new position based on adding the direction vector scaled by the distance vector, to the camera's position vector
    slider.position.copy(pos); // copy our new position into the planet's position vector
  }
}
