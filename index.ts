import './style.css';

const columns = 10;
const rows = 20;
const board = [];
let lose = false;
let interval = 0;
let intervalRender = 0;
let current: Array<Array<number>>;
let currentX = 0;
let currentY = 0;
let frozen = false;
const shapes = [
  [1, 1, 1, 1],
  [1, 1, 1, 0, 1],
  [1, 1, 1, 0, 0, 0, 1],
  [1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 1, 1],
  [0, 1, 1, 0, 1, 1],
  [0, 1, 0, 0, 1, 1, 1],
];
const colors = ['cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple'];
const canvas = document.getElementById('canvas') as any;
const clearSound = document.getElementById('clearSound') as any;
const playButton = document.getElementById('playButton');
playButton.onclick = () => playButtonClicked();

function newShape() {
  const id = Math.floor(Math.random() * shapes.length);
  const shape = shapes[id];

  current = [];
  for (let y = 0; y < 4; ++y) {
    current[y] = [];
    for (let x = 0; x < 4; ++x) {
      const i = 4 * y + x;
      if (typeof shape[i] != 'undefined' && shape[i]) {
        current[y][x] = id + 1;
      } else {
        current[y][x] = 0;
      }
    }
  }

  frozen = false;
  currentX = 5;
  currentY = 0;
}

function init() {
  for (let y = 0; y < rows; ++y) {
    board[y] = [];
    for (let x = 0; x < columns; ++x) {
      board[y][x] = 0;
    }
  }
}

function tick(): boolean {
  if (valid(0, 1)) {
    ++currentY;
  } else {
    freeze();
    valid(0, 1);
    clearLines();
    if (lose) {
      clearAllIntervals();
      return false;
    }
    newShape();
  }
}

function freeze() {
  for (let y = 0; y < 4; ++y) {
    for (let x = 0; x < 4; ++x) {
      if (current[y][x]) {
        board[y + currentY][x + currentX] = current[y][x];
      }
    }
  }
  frozen = true;
}

function rotate(current: Array<Array<number>>): Array<Array<number>> {
  const newCurrent = [];
  for (let y = 0; y < 4; ++y) {
    newCurrent[y] = [];
    for (let x = 0; x < 4; ++x) {
      newCurrent[y][x] = current[3 - x][y];
    }
  }
  return newCurrent;
}

function clearLines() {
  for (let y = rows - 1; y >= 0; --y) {
    let rowFilled = true;
    for (let x = 0; x < columns; ++x) {
      if (board[y][x] == 0) {
        rowFilled = false;
        break;
      }
    }
    if (rowFilled) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(clearSound);
      source.connect(audioContext.destination);
      clearSound.play();
      for (let yy = y; yy > 0; --yy) {
        for (let x = 0; x < columns; ++x) {
          board[yy][x] = board[yy - 1][x];
        }
      }
      ++y;
    }
  }
}

function keyPress(key: string) {
  switch (key) {
    case 'ArrowLeft':
      if (valid(-1)) {
        --currentX;
      }
      break;
    case 'ArrowRight':
      if (valid(1)) {
        ++currentX;
      }
      break;
    case 'ArrowDown':
      if (valid(0, 1)) {
        ++currentY;
      }
      break;
    case 'ArrowUp':
      const rotated = rotate(current);
      if (valid(0, 0, rotated)) {
        current = rotated;
      }
      break;
    case ' ':
      while (valid(0, 1)) {
        ++currentY;
      }
      tick();
      break;
  }
}

function valid(
  offsetX: number,
  offsetY?: number,
  newCurrent?: Array<Array<number>>
): boolean {
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  offsetX = currentX + offsetX;
  offsetY = currentY + offsetY;
  newCurrent = newCurrent || current;

  for (let y = 0; y < 4; ++y) {
    for (let x = 0; x < 4; ++x) {
      if (newCurrent[y][x]) {
        if (
          typeof board[y + offsetY] == 'undefined' ||
          typeof board[y + offsetY][x + offsetX] == 'undefined' ||
          board[y + offsetY][x + offsetX] ||
          x + offsetX < 0 ||
          y + offsetY >= rows ||
          x + offsetX >= columns
        ) {
          if (offsetY === 1 && frozen) {
            lose = true;
            playButton.setAttribute('disabled', 'false');
          }
          return false;
        }
      }
    }
  }
  return true;
}

function playButtonClicked() {
  newGame();
  playButton.setAttribute('disabled', 'true');
}

function newGame() {
  clearAllIntervals();
  intervalRender = setInterval(render, 30);
  init();
  newShape();
  lose = false;
  interval = setInterval(tick, 400);
}

function clearAllIntervals() {
  clearInterval(interval);
  clearInterval(intervalRender);
}

const ctx = canvas.getContext('2d');
const width = 300;
const height = 600;
const blockWidth = width / columns;
const blockHeight = height / rows;

function drawBlock(x: number, y: number) {
  ctx.fillRect(
    blockWidth * x,
    blockHeight * y,
    blockWidth - 1,
    blockHeight - 1
  );
  ctx.strokeRect(
    blockWidth * x,
    blockHeight * y,
    blockWidth - 1,
    blockHeight - 1
  );
}

function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'black';
  for (let x = 0; x < columns; ++x) {
    for (let y = 0; y < rows; ++y) {
      if (board[y][x]) {
        ctx.fillStyle = colors[board[y][x] - 1];
        drawBlock(x, y);
      }
    }
  }

  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'black';
  for (let y = 0; y < 4; ++y) {
    for (let x = 0; x < 4; ++x) {
      if (current[y][x]) {
        ctx.fillStyle = colors[current[y][x] - 1];
        drawBlock(currentX + x, currentY + y);
      }
    }
  }
}

document.body.onkeydown = (e) => {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '];
  if (keys.indexOf(e.key) > -1) {
    keyPress(e.key);
    render();
  }
};
