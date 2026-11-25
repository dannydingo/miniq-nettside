const levels = [
  {
    name: 'På piknik',
    task: 'Hjelp Jo fram til piknikkurven.',
    hero: 'Jo',
    portrait: 'memory-assets/jo.webp',
    goal: '🧺',
    done: 'Jo fant fram til pikniken!',
    map: [
      '#######',
      '#S...##',
      '###.#.#',
      '#...#.#',
      '#.###.#',
      '#....G#',
      '#######',
    ],
  },
  {
    name: 'Bærjakten',
    task: 'Plukk alle jordbærene før GG går til kurven.',
    hero: 'GG',
    portrait: 'memory-assets/gg.webp',
    goal: '🧺',
    done: 'Alle jordbærene kom i kurven!',
    map: [
      '#########',
      '#S..#..B#',
      '#B#.#.#.#',
      '#...#.#.#',
      '#.###.#.#',
      '#.......#',
      '#.#####.#',
      '#B....#G#',
      '#########',
    ],
  },
  {
    name: 'Den låste porten',
    task: 'Finn nøkkelen som åpner porten til hytta.',
    hero: 'Jo',
    portrait: 'memory-assets/jo.webp',
    goal: '🏡',
    done: 'Jo åpnet porten og kom fram til hytta!',
    map: [
      '#########',
      '#S..#..K#',
      '#.#.#.#.#',
      '#.#.....#',
      '#.#####.#',
      '#....#..#',
      '###..#D##',
      '#....#.G#',
      '#########',
    ],
  },
];

const directions = {
  up: { dx: 0, dy: -1, label: 'opp' },
  left: { dx: -1, dy: 0, label: 'venstre' },
  down: { dx: 0, dy: 1, label: 'ned' },
  right: { dx: 1, dy: 0, label: 'høyre' },
};
const keys = { ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right' };
const game = document.querySelector('#maze-game');
const board = document.querySelector('#maze-board');
const picker = document.querySelector('#maze-levels');
const total = document.querySelector('#maze-total');
const title = document.querySelector('#maze-title');
const task = document.querySelector('#maze-task');
const items = document.querySelector('#maze-items');
const feedback = document.querySelector('#maze-feedback');
const positionHelp = document.querySelector('#maze-position');
const pad = document.querySelector('#maze-pad');
const reset = document.querySelector('#maze-reset');
const victory = document.querySelector('#maze-victory');
const winTitle = document.querySelector('#maze-win-title');
const winCopy = document.querySelector('#maze-win-copy');
const next = document.querySelector('#maze-next');

const completed = new Set();
const levelButtons = levels.map((level, index) => {
  const button = document.createElement('button');
  button.className = 'game-button';
  button.type = 'button';
  button.textContent = level.name;
  button.addEventListener('click', () => {
    if (index !== levelIndex) openLevel(index, true);
  });
  return button;
});
picker.replaceChildren(...levelButtons);

const avatar = document.createElement('img');
avatar.className = 'maze-avatar';
avatar.alt = '';
avatar.draggable = false;

let levelIndex;
let level;
let cells;
let position;
let berryCount;
let collected;
let trail;
let hasKey;
let finished;
let nextIndex;

function updateProgress() {
  total.textContent = `${completed.size} av ${levels.length} oppgaver løst`;
  levelButtons.forEach((button, index) => {
    const solved = completed.has(index);
    button.setAttribute('aria-pressed', String(index === levelIndex));
    button.setAttribute('aria-label', solved ? `${levels[index].name}, løst` : levels[index].name);
    button.toggleAttribute('data-complete', solved);
  });

  items.hidden = berryCount === 0 && !level.map.some(row => row.includes('K'));
  items.textContent = berryCount ? `🍓 ${collected.size} av ${berryCount} jordbær` : hasKey ? '🔑 Nøkkelen er funnet!' : '🔑 Finn nøkkelen';
}

function tileAt(x, y) {
  return level.map[y]?.[x] ?? '#';
}

function cellIndex(x, y) {
  return y * level.map[0].length + x;
}

function updatePosition() {
  const open = Object.values(directions)
    .filter(({ dx, dy }) => {
      const tile = tileAt(position.x + dx, position.y + dy);
      return tile !== '#' && (tile !== 'D' || hasKey);
    })
    .map(({ label }) => label);
  positionHelp.textContent = `Rad ${position.y + 1}, kolonne ${position.x + 1}. Åpne retninger: ${open.join(', ')}.`;
}

function renderCell(cell, tile, index) {
  const removedItem = collected.has(index) || (tile === 'K' && hasKey);
  const icon = { B: '🍓', K: '🔑', D: hasKey ? '' : '🔒', G: level.goal, S: '✿' };
  cell.classList.toggle('gate', tile === 'D' && !hasKey);
  cell.classList.toggle('trail', trail.has(index) && (tile === '.' || removedItem));
  cell.firstChild.textContent = removedItem ? '' : (icon[tile] ?? '');
}

function openLevel(index, focus = false) {
  MiniQCelebration.clear();
  levelIndex = index;
  level = levels[index];
  berryCount = 0;
  collected = new Set();
  trail = new Set();
  hasKey = false;
  finished = false;
  victory.hidden = true;
  feedback.textContent = '';
  title.textContent = level.name;
  task.textContent = level.task;
  avatar.src = level.portrait;
  board.style.setProperty('--columns', level.map[0].length);
  cells = level.map.flatMap((row, y) => [...row].map((tile, x) => {
    const cell = document.createElement('div');
    cell.className = tile === '#' ? 'maze-cell wall' : 'maze-cell street';
    const symbol = document.createElement('span');
    symbol.className = 'maze-symbol';
    cell.append(symbol);
    if (tile === 'S') {
      position = { x, y };
      cell.classList.add('start');
      cell.append(avatar);
    }
    if (tile === 'G') cell.classList.add('goal');
    if (tile === 'B') berryCount += 1;
    if (tile !== '#') cell.addEventListener('click', () => move(x - position.x, y - position.y));
    renderCell(cell, tile, cellIndex(x, y));
    return cell;
  }));
  board.replaceChildren(...cells);
  updateProgress();
  updatePosition();
  if (focus) title.focus();
}

function finish() {
  finished = true;
  const wasComplete = completed.has(levelIndex);
  completed.add(levelIndex);
  updateProgress();
  nextIndex = -1;
  for (let offset = 1; offset < levels.length; offset += 1) {
    const index = (levelIndex + offset) % levels.length;
    if (!completed.has(index)) {
      nextIndex = index;
      break;
    }
  }

  const finale = nextIndex === -1;
  victory.classList.toggle('victory-finale', finale);
  victory.hidden = false;
  winTitle.textContent = finale ? 'Hurra! Du klarte alle tre labyrintene!' : 'Hurra! Du fant veien!';
  winCopy.textContent = level.done;
  next.textContent = finale ? 'Spill alle på nytt' : 'Neste labyrint';
  feedback.textContent = `${winTitle.textContent} ${level.done}`;
  MiniQCelebration.win({ finale: finale && !wasComplete });
  next.focus({ preventScroll: true });
  next.scrollIntoView({ block: 'nearest' });
}

function move(dx, dy) {
  if (finished || Math.abs(dx) + Math.abs(dy) !== 1) return;
  const x = position.x + dx;
  const y = position.y + dy;
  const tile = tileAt(x, y);
  if (tile === '#') {
    feedback.textContent = 'Her er det en hekk. Prøv en annen vei!';
    return;
  }
  if (tile === 'D' && !hasKey) {
    feedback.textContent = 'Porten er låst. Finn nøkkelen først!';
    return;
  }
  if (tile === 'G' && collected.size < berryCount) {
    const remaining = berryCount - collected.size;
    feedback.textContent = remaining === 1 ? 'Finn det siste jordbæret før du går i mål!' : `Finn ${remaining} jordbær til før du går i mål!`;
    return;
  }

  const oldIndex = cellIndex(position.x, position.y);
  const index = cellIndex(x, y);
  trail.add(oldIndex);
  renderCell(cells[oldIndex], tileAt(position.x, position.y), oldIndex);
  position = { x, y };
  const cell = cells[index];
  cell.append(avatar);
  feedback.textContent = '';

  if (tile === 'B' && !collected.has(index)) {
    collected.add(index);
    feedback.textContent = collected.size === berryCount ? 'Alle jordbærene er plukket! Finn kurven.' : 'Du fant et jordbær!';
    updateProgress();
    MiniQCelebration.sparkle(cell);
  }
  if (tile === 'K' && !hasKey) {
    hasKey = true;
    feedback.textContent = 'Du fant nøkkelen! Nå kan du åpne porten.';
    level.map.forEach((row, gateY) => {
      const gateX = row.indexOf('D');
      if (gateX !== -1) renderCell(cells[cellIndex(gateX, gateY)], 'D', cellIndex(gateX, gateY));
    });
    updateProgress();
    MiniQCelebration.sparkle(cell);
  }

  renderCell(cell, tile, index);
  updatePosition();
  if (tile === 'G') finish();
}

pad.querySelectorAll('button').forEach(button => {
  const { dx, dy } = directions[button.dataset.direction];
  button.addEventListener('click', () => move(dx, dy));
});
document.addEventListener('keydown', event => {
  const direction = keys[event.key];
  if (!direction || finished || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  const { dx, dy } = directions[direction];
  move(dx, dy);
});
reset.addEventListener('click', () => openLevel(levelIndex, true));
next.addEventListener('click', () => {
  if (nextIndex === -1) completed.clear();
  openLevel(nextIndex === -1 ? 0 : nextIndex, true);
});

game.hidden = false;
total.hidden = false;
openLevel(0);
