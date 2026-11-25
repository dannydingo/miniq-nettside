const motifs = [
  { name: 'Jo', image: 'memory-assets/jo.webp', color: '#e1f1f6' },
  { name: 'GG', image: 'memory-assets/gg.webp', color: '#e1f1dc' },
  { name: 'Oransje sirkel', shape: 'circle', color: '#fff2d9' },
  { name: 'Grønn trekant', shape: 'triangle', color: '#e1f1dc' },
  { name: 'Blå stjerne', shape: 'star', color: '#e1f1f6' },
  { name: 'Lilla kvadrat', shape: 'square', color: '#f2e8fc' },
];

const board = document.querySelector('#memory-board');
const score = document.querySelector('#memory-score');
const message = document.querySelector('#memory-message');
const size = document.querySelector('#deck-size');
const restart = document.querySelector('#restart');
const victory = document.querySelector('#victory');
const victoryTitle = document.querySelector('#victory-title');

let firstCard = null;
let closeTimer = null;
let matches = 0;
let pairCount = 0;

function setCardState(card, state) {
  const open = state !== 'down';
  const matched = state === 'matched';
  card.button.classList.toggle('is-open', open);
  card.button.classList.toggle('is-match', matched);
  card.button.setAttribute('aria-disabled', String(open));
  card.button.setAttribute('aria-label', [
    `Kort ${card.position}`,
    open ? card.motif.name : 'med baksiden opp',
    matched ? 'par funnet' : '',
  ].filter(Boolean).join(', '));
}

function turnCard(card) {
  if (closeTimer !== null || card.button.getAttribute('aria-disabled') === 'true') return;

  setCardState(card, 'open');
  if (!firstCard) {
    firstCard = card;
    message.textContent = `${card.motif.name}! Velg ett kort til.`;
    return;
  }

  const previousCard = firstCard;
  firstCard = null;

  if (previousCard.motif === card.motif) {
    setCardState(previousCard, 'matched');
    setCardState(card, 'matched');
    matches += 1;
    score.textContent = `${matches} av ${pairCount} par`;
    if (matches === pairCount) {
      const title = `Hurra! Du fant alle ${pairCount} parene!`;
      victoryTitle.textContent = title;
      victory.hidden = false;
      message.textContent = title;
      message.classList.add('memory-message-complete');
      MiniQCelebration.win();
    } else {
      message.textContent = 'Bra! Du fant et par!';
      MiniQCelebration.sparkle(card.button);
    }
    return;
  }

  message.textContent = `${previousCard.motif.name} og ${card.motif.name}. Prøv igjen!`;
  closeTimer = window.setTimeout(() => {
    setCardState(previousCard, 'down');
    setCardState(card, 'down');
    closeTimer = null;
    message.textContent = 'Velg et kort!';
  }, 1150);
}

function createCard(motif, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'card';
  button.style.setProperty('--face', motif.color);

  const back = document.createElement('span');
  back.className = 'card-back';
  back.setAttribute('aria-hidden', 'true');
  const lens = document.createElement('span');
  lens.className = 'shape lens';
  back.append(lens);

  const front = document.createElement('span');
  front.className = 'card-front';
  front.setAttribute('aria-hidden', 'true');
  if (motif.image) {
    const portrait = document.createElement('img');
    portrait.src = motif.image;
    portrait.alt = '';
    portrait.draggable = false;
    front.append(portrait);
  } else {
    const shape = document.createElement('span');
    shape.className = `shape ${motif.shape}`;
    front.append(shape);
  }
  button.append(back, front);

  const card = { button, motif, position: index + 1 };
  setCardState(card, 'down');
  button.addEventListener('click', () => turnCard(card));
  return button;
}

function startRound(announce = false) {
  MiniQCelebration.clear();
  victory.hidden = true;
  message.classList.remove('memory-message-complete');
  window.clearTimeout(closeTimer);
  closeTimer = null;
  firstCard = null;
  matches = 0;
  pairCount = Number(size.value);

  const selected = motifs.slice(0, pairCount);
  const deck = [...selected, ...selected];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }

  board.replaceChildren(...deck.map(createCard));
  score.textContent = `0 av ${pairCount} par`;
  message.textContent = announce ? 'Ny runde! Velg et kort.' : 'Velg et kort!';
}

restart.addEventListener('click', () => startRound(true));
size.addEventListener('change', () => startRound(true));
startRound();
