const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const W = 1024;
const H = 1024;
const outDir = path.join(__dirname, '../public/ar-assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function saveCanvas(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, filename), buffer);
  console.log('Saved ' + filename);
}

// 1. Blush (Má hồng)
const blushCanvas = createCanvas(W, H);
const ctx1 = blushCanvas.getContext('2d');
// Tọa độ gò má xấp xỉ trên UV map FaceMesh: trái ~ (U:0.25, V:0.55), phải ~ (U:0.75, V:0.55)
// Má trái
let grad1 = ctx1.createRadialGradient(0.2*W, 0.55*H, 0, 0.2*W, 0.55*H, 0.15*W);
grad1.addColorStop(0, 'rgba(255, 105, 180, 0.6)'); // Mỏng nhẹ màu hồng
grad1.addColorStop(1, 'rgba(255, 105, 180, 0)');
ctx1.fillStyle = grad1;
ctx1.fillRect(0, 0, W, H);

// Má phải
let grad2 = ctx1.createRadialGradient(0.8*W, 0.55*H, 0, 0.8*W, 0.55*H, 0.15*W);
grad2.addColorStop(0, 'rgba(255, 105, 180, 0.6)');
grad2.addColorStop(1, 'rgba(255, 105, 180, 0)');
ctx1.fillStyle = grad2;
ctx1.fillRect(0, 0, W, H);
saveCanvas(blushCanvas, 'makeup-blush.png');

// 2. Tàn nhang (Freckles)
const frecklesCanvas = createCanvas(W, H);
const ctx2 = frecklesCanvas.getContext('2d');
ctx2.fillStyle = 'rgba(120, 70, 40, 0.8)'; // Nâu đỏ
for (let i = 0; i < 300; i++) {
  // Điểm tàn nhang rải rác từ U=0.25 đến U=0.75 ngang mũi và má
  const x = (0.25 + Math.random() * 0.5) * W;
  const y = (0.5 + Math.random() * 0.12) * H;
  
  // Nâng cao ở khu vực giữa mũi (X = 0.5)
  const distFromCenter = Math.abs(x - 0.5 * W) / W;
  const adjY = y - (0.05 - distFromCenter * 0.2) * H;
  
  ctx2.beginPath();
  // Kích thước hạt từ 1-3px
  ctx2.arc(x, adjY, 1 + Math.random() * 2, 0, Math.PI * 2);
  ctx2.fill();
}
saveCanvas(frecklesCanvas, 'makeup-freckles.png');

// 3. Lip Tint (Son môi)
const lipsCanvas = createCanvas(W, H);
const ctx3 = lipsCanvas.getContext('2d');
// Môi xấp xỉ ở (0.5, 0.75)
ctx3.fillStyle = 'rgba(220, 20, 60, 0.4)'; // Đỏ tươi trong suốt
ctx3.beginPath();
ctx3.ellipse(0.5 * W, 0.74 * H, 0.12 * W, 0.035 * H, 0, 0, Math.PI * 2);
ctx3.fill();

// Đổ Gradient mềm từ giữa ra xung quanh để làm mờ viền
ctx3.globalCompositeOperation = 'destination-in';
const lipGrad = ctx3.createRadialGradient(0.5*W, 0.74*H, 0, 0.5*W, 0.74*H, 0.15*W);
lipGrad.addColorStop(0, 'rgba(0,0,0,1)');
lipGrad.addColorStop(1, 'rgba(0,0,0,0)');
ctx3.fillStyle = lipGrad;
ctx3.fillRect(0, 0, W, H);
ctx3.globalCompositeOperation = 'source-over';
saveCanvas(lipsCanvas, 'makeup-lip-tint.png');

// 4. Eyeliner (Dấu mi mắt)
const eyelinerCanvas = createCanvas(W, H);
const ctx4 = eyelinerCanvas.getContext('2d');
ctx4.strokeStyle = 'rgba(0, 0, 0, 0.8)';
ctx4.lineWidth = 12;
ctx4.lineCap = 'round';
// Mắt trái: (~0.3, 0.45)
ctx4.beginPath();
ctx4.moveTo(0.2*W, 0.46*H);
ctx4.quadraticCurveTo(0.3*W, 0.42*H, 0.4*W, 0.47*H);
ctx4.stroke();
// Mắt phải: (~0.7, 0.45)
ctx4.beginPath();
ctx4.moveTo(0.8*W, 0.46*H);
ctx4.quadraticCurveTo(0.7*W, 0.42*H, 0.6*W, 0.47*H);
ctx4.stroke();
saveCanvas(eyelinerCanvas, 'makeup-eyeliner.png');

console.log('Makeup generation complete!');
