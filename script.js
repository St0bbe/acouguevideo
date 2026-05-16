const canvas = document.getElementById("frameCanvas");
const context = canvas.getContext("2d", { alpha: false });
const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loaderBar");
const loaderText = document.getElementById("loaderText");
const cinema = document.getElementById("cinema");
const scenes = [...document.querySelectorAll(".scene")];

// Altere aqui se adicionar/remover frames. Os arquivos atuais da pasta images vao de 001 a 240.
const totalFrames = 240;

// Os frames reais deste projeto estao em .png. Troque para "jpg" se exportar nessa extensao.
const frameExtension = "png";
const imageBasePath = "images";
const framePath = (index) => `${imageBasePath}/ezgif-frame-${String(index).padStart(3, "0")}.${frameExtension}`;

const frames = [];
const loadedFrames = new Set();
let loadedCount = 0;
let currentFrame = 0;
let targetFrame = 0;
let progress = 0;
let animationStarted = false;
let canvasWidth = 0;
let canvasHeight = 0;

document.body.classList.add("is-loading");

function setCanvasSize() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.floor(canvasWidth * pixelRatio);
  canvas.height = Math.floor(canvasHeight * pixelRatio);
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawFrame(Math.round(currentFrame));
}

function drawFrame(frameIndex) {
  const image = frames[frameIndex];
  if (!image || !image.complete || !image.naturalWidth) {
    return;
  }

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function getScrollProgress() {
  const rect = cinema.getBoundingClientRect();
  const scrollable = cinema.offsetHeight - window.innerHeight;
  return Math.min(Math.max(-rect.top / scrollable, 0), 1);
}

function updateScenes() {
  const cinemaRect = cinema.getBoundingClientRect();
  const isCinemaVisible = cinemaRect.bottom > 0 && cinemaRect.top <= 0;

  scenes.forEach((scene) => {
    const start = Number(scene.dataset.start);
    const end = Number(scene.dataset.end);
    const isActive = isCinemaVisible && progress >= start && progress <= end;
    scene.classList.toggle("is-active", isActive);
  });
}

function updateTargetFrame() {
  progress = getScrollProgress();
  targetFrame = progress * (totalFrames - 1);
  updateScenes();
}

function animate() {
  const distance = targetFrame - currentFrame;
  currentFrame += distance * 0.16;

  if (Math.abs(distance) < 0.02) {
    currentFrame = targetFrame;
  }

  const roundedFrame = Math.min(totalFrames - 1, Math.max(0, Math.round(currentFrame)));
  drawFrame(roundedFrame);
  requestAnimationFrame(animate);
}

function revealSite() {
  setCanvasSize();
  updateTargetFrame();
  drawFrame(0);
  document.body.classList.remove("is-loading");
  loader.classList.add("is-hidden");

  if (!animationStarted) {
    animationStarted = true;
    animate();
  }
}

function updateLoader() {
  const percent = Math.round((loadedCount / totalFrames) * 100);
  loaderBar.style.width = `${percent}%`;
  loaderText.textContent = `Carregando experiência ${percent}%`;
}

function preloadFrames() {
  for (let frameNumber = 1; frameNumber <= totalFrames; frameNumber += 1) {
    const image = new Image();
    const frameIndex = frameNumber - 1;

    image.onload = () => {
      if (!loadedFrames.has(frameIndex)) {
        loadedFrames.add(frameIndex);
        loadedCount += 1;
        updateLoader();
      }

      if (frameIndex === 0) {
        drawFrame(0);
      }

      if (loadedCount === totalFrames) {
        revealSite();
      }
    };

    image.onerror = () => {
      if (!loadedFrames.has(frameIndex)) {
        loadedFrames.add(frameIndex);
        loadedCount += 1;
        updateLoader();
      }

      if (loadedCount === totalFrames) {
        revealSite();
      }
    };

    image.src = framePath(frameNumber);
    frames[frameIndex] = image;
  }
}

window.addEventListener("scroll", updateTargetFrame, { passive: true });
window.addEventListener("resize", setCanvasSize);
window.addEventListener("orientationchange", () => {
  setTimeout(setCanvasSize, 250);
});

setCanvasSize();
preloadFrames();
