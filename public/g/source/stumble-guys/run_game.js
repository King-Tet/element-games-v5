// stumble-guys/run_game.js

// Find the div where the game will be rendered.
const gameContainer = document.querySelector("#player");

// Configuration for the Unity game.
const buildUrl = "Build";
const loaderUrl = buildUrl + "/WebGL.loader.js";
const config = {
  dataUrl: buildUrl + "/WebGL.data.unityweb",
  frameworkUrl: buildUrl + "/WebGL.framework.js.unityweb",
  codeUrl: buildUrl + "/WebGL.wasm.unityweb",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "Scopely",
  productName: "Stumble Guys",
  productVersion: "0.90.6",
};

// Create a script element to load the Unity loader.
const script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
  createUnityInstance(gameContainer, config, (progress) => {
    // You can add a progress bar here if you want.
  }).then((unityInstance) => {
    // Game started.
  }).catch((message) => {
    alert(message);
  });
};

// Add the script to the document to start loading the game.
document.body.appendChild(script);