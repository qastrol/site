const fileInput = document.getElementById("fileInput");
const widthRange = document.getElementById("widthRange");
const widthValue = document.getElementById("widthValue");
const invertCheckbox = document.getElementById("invertCheckbox");
const transparentSelect = document.getElementById("transparentSelect");
const contrastRange = document.getElementById("contrastRange");
const contrastValue = document.getElementById("contrastValue");
const asciiOutput = document.getElementById("asciiOutput");
const thresholdRange = document.getElementById("thresholdRange");
const thresholdValue = document.getElementById("thresholdValue");


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Alle 256 braille characters van U+2800 tot U+28FF
const chars = (() => {
  let s = "";
  for (let i = 0x2800; i <= 0x28FF; i++) {
    s += String.fromCharCode(i);
  }
  return s;
})();



let image = new Image();

widthRange.oninput = () => {
  widthValue.textContent = widthRange.value;
  if (image.src) generateASCII();
};

contrastRange.oninput = () => {
  contrastValue.textContent = contrastRange.value;
  if (image.src) generateASCII();
};

thresholdRange.oninput = () => {
  thresholdValue.textContent = thresholdRange.value;
  if (image.src) generateASCII();
};


invertCheckbox.onchange = generateASCII;
transparentSelect.onchange = generateASCII;

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    image.onload = generateASCII;
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function generateASCII() {
  const asciiWidthChars = Math.max(1, parseInt(widthRange.value)); // sliderbreedte in karakters
  const contrast = parseFloat(contrastRange.value);
  const threshold = parseInt(thresholdRange.value);
  const invert = invertCheckbox.checked;
  const transparentMode = transparentSelect.value;

  // 1 braille-char = 2 pixels breed × 4 pixels hoog
  const pixelWidth = asciiWidthChars * 2;
  const pixelHeight = Math.round(pixelWidth * (image.height / image.width)); // behoud aspect ratio
  const asciiHeightChars = Math.max(1, Math.floor(pixelHeight / 4));

  canvas.width = pixelWidth;
  canvas.height = asciiHeightChars * 4;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let ascii = "";

  for (let yChar = 0; yChar < asciiHeightChars; yChar++) {
    for (let xChar = 0; xChar < asciiWidthChars; xChar++) {
      let brailleDots = 0;

      // Loop over 2x4 pixels per braille-char
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 2; px++) {
          const x = xChar * 2 + px;
          const y = yChar * 4 + py;
          const i = (y * canvas.width + x) * 4;
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          let brightness;

          if (a === 0 && transparentMode === "transparent") {
            brightness = 0; // maakt het braillepunt uit
          } else if (a === 0) {
            brightness = transparentMode === "white" ? 255 : 0;
          } else {
            brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          }

          brightness = ((brightness - 128) * contrast) + 128;
          brightness = Math.max(0, Math.min(255, brightness));
          if (invert) brightness = 255 - brightness;

          // Bepaal of dot aan of uit moet zijn (threshold)
          if (brightness > threshold) {
            // braille dots index: px + py*2 ? Braille dot mapping aanpassen
            const dotMap = [0x01,0x08,0x02,0x10,0x04,0x20,0x40,0x80]; // standaard mapping
            brailleDots |= dotMap[py * 2 + px];
          }
        }
      }

      ascii += String.fromCharCode(0x2800 + brailleDots);
    }
    ascii += "\n";
  }

  asciiOutput.textContent = ascii;
}


window.onload = () => {
  fileInput.value = "";
  widthRange.value = 30;
  widthValue.textContent = "30";

  contrastRange.value = 1;
  contrastValue.textContent = "1";

  thresholdRange.value = 128;
  thresholdValue.textContent = "128";

  invertCheckbox.checked = false;
  transparentSelect.value = "transparent";

  asciiOutput.textContent = "";
  image.src = "";
};
