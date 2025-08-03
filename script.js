const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
ctx.scale(20, 20); // Escalamos para que cada bloque sea 20x20 px

const music = document.getElementById('music');

const arenaWidth = 12;
const arenaHeight = 20;

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  switch(type) {
    case 'T':
      return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
    case 'O':
      return [
        [2, 2],
        [2, 2],
      ];
    case 'L':
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
      ];
    case 'J':
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
      ];
    case 'I':
      return [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
      ];
    case 'S':
      return [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
      ];
    case 'Z':
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
  }
}

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const arena = createMatrix(arenaWidth, arenaHeight);

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for(let y=0; y<m.length; ++y) {
    for(let x=0; x<m[y].length; ++x) {
      if (m[y][x] !== 0 &&
         (arena[y + o.y] &&
          arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for(let y=0; y < matrix.length; ++y) {
    for(let x=0; x < y; ++x) {
      [
        matrix[x][y],
        matrix[y][x],
      ] = [
        matrix[y][x],
        matrix[x][y],
      ];
    }
  }
  if(dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while(collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if(offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function arenaSweep() {
  let rowCount = 1;
  outer: for(let y = arena.length -1; y >= 0; --y) {
    for(let x = 0; x < arena[y].length; ++x) {
      if(arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    y++;
    score += rowCount * 10;
    rowCount *= 2;
    linesCleared++;
    if(linesCleared >= level * 10) {
      level++;
      dropInterval = Math.max(100, dropInterval - 50);
    }
    updateScore();
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x,
                     y + offset.y,
                     1, 1);
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, {x:0, y:0});
  drawMatrix(player.matrix, player.pos);
}

function drop() {
  player.pos.y++;
  if(collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    resetPlayer();
    arenaSweep();
  }
  dropCounter = 0;
}

function resetPlayer() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arenaWidth / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if(collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    updateScore();
  }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

let score = 0;
let level = 1;
let linesCleared = 0;

const player = {
  pos: {x:0, y:0},
  matrix: null,
}

function updateScore() {
  document.getElementById('score').innerText = score;
  document.getElementById('level').innerText = level;
}

function update(time = 0) {
  if(paused) {
    lastTime = time;
    requestAnimationFrame(update);
    return;
  }
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if(dropCounter > dropInterval) {
    drop();
  }
  draw();
  requestAnimationFrame(update);
}

let paused = false;

document.addEventListener('keydown', event => {
  if(event.key === 'ArrowLeft') {
    player.pos.x--;
    if(collide(arena, player)) {
      player.pos.x++;
    }
  } else if(event.key === 'ArrowRight') {
    player.pos.x++;
    if(collide(arena, player)) {
      player.pos.x--;
    }
  } else if(event.key === 'ArrowDown') {
    drop();
  } else if(event.key === ' ') {
    // Caída rápida con barra espaciadora
    while(!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    resetPlayer();
    arenaSweep();
    dropCounter = 0;
  } else if(event.key.toLowerCase() === 'p') {
    paused = !paused;
    if(paused) {
      music.pause();
    } else {
      music.play();
    }
  } else if(event.key === 'ArrowUp') {
    playerRotate(1);
  }
});

resetPlayer();
updateScore();
update();
