const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

if (!Array.isArray(games) || games.length === 0) {
    alert("Geen games geladen.");
}

// Voeg deze regel toe:
document.getElementById("gameCount").textContent = `Totaal aantal games op het rad: ${games.length}`;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 10;

let rotation = 0;
let spinning = false;
let spinSpeed = 0;

const wheelCanvas = document.createElement("canvas");
wheelCanvas.width = canvas.width;
wheelCanvas.height = canvas.height;
const wheelCtx = wheelCanvas.getContext("2d");

// Hulpfunctie: HSV → RGB (voor canvas fillStyle)
function hsvToRgb(h, s, v) {
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `rgb(${r},${g},${b})`;
}

function getCurrentSegment() {
    const sliceAngle = (2 * Math.PI) / games.length;

    // Normeer rotatie: 0 = boven de pijl
    const normalizedRotation = (2 * Math.PI - (rotation % (2 * Math.PI))) % (2 * Math.PI);

    const index = Math.floor(normalizedRotation / sliceAngle);
    return games[index];
}


// Voorbeeld in buildWheel()
function buildWheel() {
    const sliceAngle = (2 * Math.PI) / games.length;

    for (let i = 0; i < games.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        // Bereken unieke kleur: hue verdeeld over 360 graden
        const hue = (i * 360 / games.length) % 360;
        const color = hsvToRgb(hue, 0.7, 0.9); // S=70%, V=90%

        wheelCtx.beginPath();
        wheelCtx.moveTo(centerX, centerY);
        wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        wheelCtx.fillStyle = color;
        wheelCtx.fill();
        wheelCtx.stroke();

        // Tekst
        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(startAngle + sliceAngle / 2);
        wheelCtx.textAlign = "right";
        wheelCtx.fillStyle = "white";
        wheelCtx.font = "10px Arial";
        wheelCtx.fillText(games[i].name, radius - 10, 5);
        wheelCtx.restore();
    }
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.drawImage(wheelCanvas, -centerX, -centerY);
    ctx.restore();

    // Pijl
    ctx.beginPath();
    ctx.moveTo(centerX - 10, 10);
    ctx.lineTo(centerX + 10, 10);
    ctx.lineTo(centerX, 30);
    ctx.fillStyle = "yellow";
    ctx.fill();
}


function spin() {
    if (!spinning) return;

    rotation += spinSpeed;
    spinSpeed *= 0.999; // vertraging

    drawWheel();

    // Realtime tekst bijwerken
    const currentGame = getCurrentSegment();
    if (currentGame) {
        document.getElementById("currentSegment").textContent =
            "Huidige game: " + currentGame.name;
    }

    if (spinSpeed < 0.002) {
        spinning = false;

        // Eindresultaat tonen in result div
        const finalGame = getCurrentSegment();
        document.getElementById("result").textContent =
            "Gekozen: " + finalGame.name;
    } else {
        requestAnimationFrame(spin);
    }
}


function determineResult() {
    const sliceAngle = (2 * Math.PI) / games.length;
    const normalizedRotation = (2 * Math.PI - (rotation % (2 * Math.PI))) % (2 * Math.PI);
    const index = Math.floor(normalizedRotation / sliceAngle);
    const selectedGame = games[index];

    document.getElementById("result").textContent =
        "Geselecteerde game: " + selectedGame.name;
}

document.getElementById("spinButton").addEventListener("click", () => {
    if (spinning) return;

    spinSpeed = Math.random() * 0.3 + 0.25;
    spinning = true;
    spin();
});

buildWheel();
drawWheel();
