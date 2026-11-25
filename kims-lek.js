const rounds = [
  { name: 'På piknik', size: 3, objects: [['🍎', 'Eple'], ['🍌', 'Banan'], ['🍐', 'Pære'], ['🍇', 'Druer'], ['🍓', 'Jordbær']] },
  { name: 'I lekerommet', size: 3, objects: [['🧸', 'Bamse'], ['🚗', 'Bil'], ['⚽', 'Ball'], ['🧩', 'Puslespill'], ['🎈', 'Ballong']] },
  { name: 'På stranden', size: 4, objects: [['🪣', 'Bøtte'], ['🐚', 'Skjell'], ['🕶️', 'Solbriller'], ['🍦', 'Is'], ['🩴', 'Sandal']] },
  { name: 'På kjøkkenet', size: 4, objects: [['🥄', 'Skje'], ['🥣', 'Skål'], ['🫖', 'Tekanne'], ['🍞', 'Brød'], ['🧀', 'Ost']] },
  { name: 'I hobbyverkstedet', size: 5, objects: [['✂️', 'Saks'], ['🎨', 'Palett'], ['✏️', 'Blyant'], ['🧶', 'Garn'], ['📏', 'Linjal']] },
];

const game = document.querySelector('#kim-game');
const play = document.querySelector('#kim-play');
const progress = document.querySelector('#kim-round');
const stars = document.querySelector('#kim-stars');
const prompt = document.querySelector('#kim-prompt');
const tray = document.querySelector('#kim-tray');
const choices = document.querySelector('#kim-choices');
const feedback = document.querySelector('#kim-feedback');
const action = document.querySelector('#kim-action');
const victory = document.querySelector('#kim-victory');
const winTitle = document.querySelector('#kim-win-title');

let roundIndex = 0;
let phase;
let objects;
let missing;

function shuffled(objects) {
  const copy = [...objects];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function updateStars(earned) {
  const icons = rounds.map((_, index) => {
    const icon = document.createElement('span');
    const filled = index < earned;
    icon.textContent = filled ? '★' : '☆';
    icon.classList.toggle('earned', filled);
    return icon;
  });
  stars.replaceChildren(...icons);
}

function renderTray() {
  const tiles = objects.map((object) => {
    const tile = document.createElement('li');
    const hidden = object === missing && phase === 'guess';
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = hidden ? '?' : object[0];
    const label = document.createElement('span');
    label.className = 'kim-object-label';
    label.textContent = hidden ? 'Tingen som ble borte' : object[1];
    tile.className = 'kim-tile';
    tile.classList.toggle('missing', hidden);
    tile.classList.toggle('found', object === missing && phase === 'solved');
    tile.append(icon, label);
    return tile;
  });
  tray.replaceChildren(...tiles);
}

function startRound(focus = true) {
  MiniQCelebration.clear();
  phase = 'study';
  const round = rounds[roundIndex];
  objects = shuffled(round.objects).slice(0, round.size);
  missing = objects[Math.floor(Math.random() * objects.length)];
  play.hidden = false;
  victory.hidden = true;
  progress.textContent = `Runde ${roundIndex + 1} av ${rounds.length} · ${round.name}`;
  updateStars(roundIndex);
  prompt.textContent = 'Se godt på alle tingene!';
  feedback.textContent = '';
  choices.hidden = true;
  choices.replaceChildren();
  action.textContent = 'Jeg er klar';
  action.hidden = false;
  renderTray();
  if (focus) prompt.focus();
}

function askQuestion() {
  phase = 'guess';
  prompt.textContent = 'Hva ble borte?';
  action.hidden = true;
  renderTray();
  const buttons = shuffled(objects).map((object) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'game-button kim-choice';
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = object[0];
    const label = document.createElement('span');
    label.textContent = object[1];
    button.append(icon, label);
    button.addEventListener('click', () => choose(object, button));
    return button;
  });
  choices.replaceChildren(...buttons);
  choices.hidden = false;
  prompt.focus();
}

function choose(object, button) {
  if (phase !== 'guess' || button.getAttribute('aria-disabled') === 'true') return;
  if (object !== missing) {
    button.classList.add('missed');
    button.setAttribute('aria-disabled', 'true');
    feedback.textContent = `${object[1]} ligger fortsatt på brettet. Prøv en annen!`;
    return;
  }

  phase = 'solved';
  updateStars(roundIndex + 1);
  action.hidden = false;

  if (roundIndex === rounds.length - 1) {
    play.hidden = true;
    victory.hidden = false;
    progress.textContent = `${rounds.length} av ${rounds.length} runder løst`;
    feedback.textContent = `Riktig! ${missing[1]} var borte.`;
    action.textContent = 'Spill igjen';
    winTitle.focus();
    MiniQCelebration.win({ finale: true });
    return;
  }

  renderTray();
  for (const option of choices.children) option.setAttribute('aria-disabled', 'true');
  button.classList.add('selected');
  feedback.textContent = `Riktig! ${missing[1]} var borte. Du fikk en stjerne!`;
  action.textContent = 'Neste runde';
  MiniQCelebration.sparkle(button);
  action.focus();
}

action.addEventListener('click', () => {
  if (phase === 'study') {
    askQuestion();
    return;
  }
  if (phase === 'solved') {
    roundIndex = (roundIndex + 1) % rounds.length;
    startRound();
  }
});

game.hidden = false;
startRound(false);
