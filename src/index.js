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
let floor, bar0, bar1;
let lightButton;
let intensity, light;
let lightParams;
let ambientLight;

let listener, pSound, pAudioLoader;
let bSound, bAudioLoader;
let dSound, dAudioLoader;
let jSound, jAudioLoader;
let soundParams;

let lightColourButtonPress = 0;

let clock, delta, interval;
let loader, modelLoaded, piano, bass, drums, furnature;

let floorProperties;

let stoneTextureResult, woodTextureResult, woodMaterial;

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
  intensity = 0.005;
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
  let JuanBox = new THREE.Mesh(geometry, material);
  pianoBox.position.set(-4, 0.9, -6);
  bassBox.position.set(0, 0.9, -14);
  drumsBox.position.set(5, 0.9, -7);
  JuanBox.position.set(-23, -0.9, 15);
  scene.add(pianoBox, bassBox, drumsBox, JuanBox);

  //Interaction objects
  let lightButtongeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
  let lightButtonMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    wireframe: false
  });
  lightButton = new THREE.Mesh(lightButtongeometry, lightButtonMaterial);
  lightButton.position.set(-20, 4, 0);
  scene.add(lightButton);

  //models
  modelLoaded = false;
  loadModels();

  //floor
  let woodTextureLoader = new THREE.TextureLoader();
  woodTextureResult = woodTextureLoader.load("./texture/wood.jpeg");
  // let stoneTextureLoader = new THREE.TextureLoader();
  // stoneTextureResult = stoneTextureLoader.load("./texture/stone_floor.jpeg");
  woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTextureResult
  });

  floor = new THREE.Mesh(new THREE.PlaneGeometry(75, 75), woodMaterial);
  scene.add(floor);
  floor.rotateX(-Math.PI / 2);
  floor.position.set(0, -0.5, 5);

  //bar
  bar0 = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 1), woodMaterial);
  bar1 = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 1), woodMaterial);
  bar0.rotateY(-Math.PI / 2);
  bar0.position.set(-22, 0.5, 15);
  bar1.position.set(-31.5, 0.5, 25.5);
  scene.add(bar0, bar1);

  //Signs and pictures
  let buttonSignTextureLoader = new THREE.TextureLoader();
  let buttonTextureResult = buttonSignTextureLoader.load(
    "./texture/button_change.png"
  );
  let lightButtonSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1),
    new THREE.MeshStandardMaterial({
      map: buttonTextureResult
    })
  );

  let NWInnTextureLoader = new THREE.TextureLoader();
  let NWInnTextureResult = NWInnTextureLoader.load("./texture/NWInn.jpg");
  let NWInn = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 5),
    new THREE.MeshStandardMaterial({
      map: NWInnTextureResult
    })
  );

  let barSignTextureLoader = new THREE.TextureLoader();
  let barSignTextureResult = barSignTextureLoader.load(
    "./texture/bar_sign.jpg"
  );
  let bar_sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 7),
    new THREE.MeshStandardMaterial({
      map: barSignTextureResult
    })
  );

  let outSignTextureLoader = new THREE.TextureLoader();
  let outSignTextureResult = outSignTextureLoader.load("./texture/NWOut.png");
  let outSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 11),
    new THREE.MeshStandardMaterial({
      map: outSignTextureResult
    })
  );

  outSign.rotateY(-Math.PI);
  outSign.position.z = 41.9;
  bar_sign.rotateY(Math.PI / 2);
  bar_sign.position.set(-34.9, 4, 15);
  NWInn.position.set(0, 10, 5);
  lightButtonSign.rotateY(Math.PI / 2);
  lightButtonSign.position.set(-19.9, 2.5, 0);
  scene.add(lightButtonSign, NWInn, outSign, bar_sign);

  //Walls
  let wallTextureLoader = new THREE.TextureLoader();
  let wallTextureResult = wallTextureLoader.load("./texture/Wall.jpeg");
  let wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTextureResult
  });

  let wall0 = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial); //left left wall band
  let wall1 = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMaterial); //left wall band
  let wall2 = new THREE.Mesh(new THREE.PlaneGeometry(70, 10), wallMaterial); //back wall band
  let wall3 = new THREE.Mesh(new THREE.PlaneGeometry(50, 10), wallMaterial); //left wall
  let wall4 = new THREE.Mesh(new THREE.PlaneGeometry(75, 10), wallMaterial); //right wall
  let wall5 = new THREE.Mesh(new THREE.PlaneGeometry(75, 10), wallMaterial); //left wall

  wall0.position.set(-35, 3, 5);
  wall1.rotateY(Math.PI / 2);
  wall1.position.set(-20, 3, -10);
  wall2.position.set(0, 3, -25);
  wall3.rotateY(Math.PI / 2);
  wall3.position.set(-35, 3, 20);
  wall4.rotateY(-Math.PI / 2);
  wall4.position.set(35, 3, 5);
  wall5.rotateY(-Math.PI);
  wall5.position.set(0, 3, 42);

  scene.add(wall0, wall1, wall2, wall3, wall4, wall5);

  //stage
  let stageG = new THREE.CylinderGeometry(10, 10, 3, 10);
  let stage = new THREE.Mesh(stageG, woodMaterial);
  stage.position.z = -10;
  scene.add(stage);

  //sound
  listener = new THREE.AudioListener();
  camera.add(listener);

  //piano
  pSound = new THREE.PositionalAudio(listener);
  pAudioLoader = new THREE.AudioLoader();
  pAudioLoader.load("sounds/Piano.mp3", function (buffer) {
    pSound.setBuffer(buffer);
    pSound.setRefDistance(5);
    pSound.setVolume(1.0);
    pSound.play();
  });
  pianoBox.add(pSound);

  //bass
  bSound = new THREE.PositionalAudio(listener);
  bAudioLoader = new THREE.AudioLoader();
  bAudioLoader.load("sounds/DB.mp3", function (buffer) {
    bSound.setBuffer(buffer);
    bSound.setRefDistance(5);
    bSound.setVolume(0.4);
    bSound.play();
  });
  bassBox.add(bSound);

  //drums
  dSound = new THREE.PositionalAudio(listener);
  dAudioLoader = new THREE.AudioLoader();
  dAudioLoader.load("sounds/Drums.mp3", function (buffer) {
    dSound.setBuffer(buffer);
    dSound.setRefDistance(5);
    dSound.setVolume(0.5);
    dSound.play();
  });
  drumsBox.add(dSound);

  //Juan
  jSound = new THREE.PositionalAudio(listener);
  jAudioLoader = new THREE.AudioLoader();
  jAudioLoader.load("sounds/recording.mp3", function (buffer) {
    jSound.setBuffer(buffer);
    jSound.setRefDistance(5);
    jSound.setVolume(0.5);
    jSound.play(5);
  });
  JuanBox.add(jSound);
  // const distortion = new Tone.Distortion(0.5).toDestination();
  // Tone.context = jSound.context;
  // jSound.connect(distortion);

  let ambience = new Tone.Player(
    "./sounds/backgroundNoise.mp3"
  ).toDestination();
  ambience.loop = true;
  ambience.autostart = true;

  soundParams = { p: 1.0, b: 0.4, d: 0.5 };
  gui.add(soundParams, "p", 0.0, 1.0).name("Piano volume");
  gui.add(soundParams, "b", 0.0, 1.0).name("Bass volume");
  gui.add(soundParams, "d", 0.0, 1.0).name("Drums volume");

  // floorProperties = { Floor: "wood" };
  // gui.add(floorProperties, "Floor", {
  //   Wood: "woodTextureResult",
  //   Stone: "stoneTextureResult",
  //   Disco: "disco"
  // });

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

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(camera),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

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
  pSound.setVolume(soundParams.p);
  bSound.setVolume(soundParams.b);
  dSound.setVolume(soundParams.d);

  // woodMaterial.map(floorProperties.Wood);
  // woodMaterial.map(floorProperties.Stone);

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

  const onLoadPiano = function (gltf, position) {
    piano = gltf.scene.children[0];
    piano.scale.multiplyScalar(1.125);
    piano.position.copy(position);
    modelLoaded = true;
    piano.rotateZ(-Math.PI / 1.5);
    scene.add(piano);
  };
  const onLoadBass = function (gltf, position) {
    bass = gltf.scene.children[0];
    bass.scale.multiplyScalar(3.5);
    bass.position.copy(position);
    modelLoaded = true;
    bass.rotateZ(-Math.PI / 6);
    scene.add(bass);
  };
  const onLoadDrums = function (gltf, position) {
    drums = gltf.scene.children[0];
    drums.scale.multiplyScalar(1.125);
    drums.position.copy(position);
    modelLoaded = true;
    drums.rotateZ(-Math.PI / 3.0);
    scene.add(drums);
  };
  const onLoadFurnature = function (gltf, position) {
    furnature = gltf.scene.children[0];
    console.log(furnature);
    furnature.scale.multiplyScalar(0.1);
    furnature.position.copy(position);
    modelLoaded = true;
    furnature.rotateZ(-Math.PI);
    scene.add(furnature);
  };
  const onLoadJuan = function (gltf, position) {
    let Juan = gltf.scene.children[0];
    console.log(Juan);
    Juan.scale.multiplyScalar(0.03);
    Juan.position.copy(position);
    modelLoaded = true;
    Juan.rotateZ(Math.PI / 2);
    scene.add(Juan);
  };

  const onProgress = function () {
    console.log("progress");
  };

  const onError = function (errorMessage) {
    console.log(errorMessage);
  };
  const manPosition = new THREE.Vector3(-23.5, -0.6, 15);
  loader.load(
    "models/man_in_suit/scene.gltf",
    function (gltf) {
      onLoadJuan(gltf, manPosition);
    },
    onProgress,
    onError
  );
  const pianoPosition = new THREE.Vector3(-6, 1.5, -5);
  loader.load(
    "models/piano_3d/scene.gltf",
    function (gltf) {
      onLoadPiano(gltf, pianoPosition);
    },
    onProgress,
    onError
  );
  const doubleBassPosition = new THREE.Vector3(0, 4.5, -14);
  loader.load(
    "models/bass_base_violin/scene.gltf",
    function (gltf) {
      onLoadBass(gltf, doubleBassPosition);
    },
    onProgress,
    onError
  );
  const drumsPosition = new THREE.Vector3(2, 1.5, -5.5);
  loader.load(
    "models/drum_set/scene.gltf",
    function (gltf) {
      onLoadDrums(gltf, drumsPosition);
    },
    onProgress,
    onError
  );
  const furnaturePosition = new THREE.Vector3(29, -0.5, -10);
  loader.load(
    "models/table_set/scene.gltf",
    function (gltf) {
      onLoadFurnature(gltf, furnaturePosition);
    },
    onProgress,
    onError
  );
  const furnaturePosition1 = new THREE.Vector3(29, -0.5, 10);

  loader.load(
    "models/table_set/scene.gltf",
    function (gltf) {
      onLoadFurnature(gltf, furnaturePosition1);
    },
    onProgress,
    onError
  );

  // const furnaturePosition2 = new THREE.Vector3(29, -0.5, 30);
  // loader.load(
  //   "models/table_set/scene.gltf",
  //   function (gltf) {
  //     onLoadFurnature(gltf, furnaturePosition2);
  //   },
  //   onProgress,
  //   onError
  // );
}

function triggerAttack(event) {
  console.log("down");

  raycaster.setFromCamera(mouse, camera);
  intersects = raycaster.intersectObject(lightButton);
  if (intersects === raycaster.intersectObject(lightButton)) {
    console.log("LIGHT");
  } else {
    console.log("NADA");
  }

  if (intersects.length > 0) {
    mouseDown = true;
  }

  if (mouseDown) {
    lightColourButtonPress++;
    switch (lightColourButtonPress) {
      case 1:
        lightButton.material.color.setHex(0xff00ff); //purple
        light.color = new THREE.Color(255, 0, 255);
        break;
      case 2:
        lightButton.material.color.setHex(0x59c856); //green
        light.color = new THREE.Color(8, 150, 0);
        break;
      case 3:
        lightButton.material.color.setHex(0x0000ff); //blue
        light.color = new THREE.Color(0, 0, 255);
        break;
      case 4:
        lightButton.material.color.setHex(0xffa500); //orange
        light.color = new THREE.Color(150, 70, 0);
        break;
      case 5:
        lightButton.material.color.setHex(0xff0000); //red
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
  mouseDown = false;
  console.log("up");
  lightButton.material.color.setHex(0x000000);
}
