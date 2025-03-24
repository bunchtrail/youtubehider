const fs = require('fs');
const { createCanvas } = require('canvas');

// Функция для создания иконки заданного размера
function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Фон
    ctx.fillStyle = '#4285F4';
    ctx.fillRect(0, 0, size, size);

    // Внутренний круг
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
    ctx.fill();

    // Символ "S" для "Stream"
    ctx.fillStyle = '#4285F4';
    ctx.font = `bold ${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', size/2, size/2);

    return canvas;
}

// Создаем директорию для иконок, если её нет
if (!fs.existsSync('icons')) {
    fs.mkdirSync('icons');
}

// Генерируем иконки разных размеров
[16, 48, 128].forEach(size => {
    const canvas = generateIcon(size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icons/icon${size}.png`, buffer);
    console.log(`Создана иконка размером ${size}x${size} пикселей`);
}); 