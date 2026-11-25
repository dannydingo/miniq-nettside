const scenes = [...document.querySelectorAll('.scene')];
const sceneImages = scenes.map(scene => scene.querySelector('img'));
const score = document.querySelector('#difference-score');
const dots = [...document.querySelectorAll('.progress-dots i')];
const message = document.querySelector('#game-message');
const hint = document.querySelector('#hint');
const restart = document.querySelector('#restart');
const picker = document.querySelector('#challenge-options');
const challengeProgress = document.querySelector('#challenge-progress');
const challengeTitle = document.querySelector('#challenge-title');
const victory = document.querySelector('#victory');
const victoryTitle = document.querySelector('#victory-title');
const victoryMessage = document.querySelector('#victory-message');
const nextChallenge = document.querySelector('#next-challenge');

const rounds = challenges.map(() => ({ found: new Set(), completed: false }));
const challengeButtons = challenges.map((challenge, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'game-button challenge-option';
  button.textContent = challenge.title;
  button.addEventListener('click', () => openChallenge(index));
  return button;
});
picker.replaceChildren(...challengeButtons);

let currentIndex = 0;
let currentDifferences = [];
let currentSpots = [];
let highlighted = -1;
let nextIndex = -1;
let revision = 0;
let imagesReady = true;

function updateSpots(index) {
  const found = rounds[currentIndex].found.has(index);
  const { name, location } = currentDifferences[index];
  for (const spot of currentSpots[index]) {
    spot.classList.toggle('found', found);
    spot.classList.toggle('hint', index === highlighted && !found);
    spot.setAttribute('aria-disabled', String(found));
    spot.setAttribute('aria-label', found ? `${name}, funnet` : `Undersøk området ${location}`);
  }
}

function updateProgress() {
  const count = rounds[currentIndex].found.size;
  const total = currentDifferences.length;
  const complete = count === total;
  const solved = rounds.filter(round => round.completed).length;

  score.textContent = `${count} av ${total} funnet`;
  dots.forEach((dot, index) => dot.classList.toggle('filled', index < count));
  hint.disabled = complete || !imagesReady;
  challengeProgress.textContent = `${solved} av ${challenges.length} oppgaver løst`;
  challengeButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === currentIndex));
    button.toggleAttribute('data-complete', rounds[index].completed);
    button.setAttribute('aria-label', `${challenges[index].title}${rounds[index].completed ? ', løst' : ''}`);
  });

  message.classList.toggle('visually-hidden', complete);
  victory.hidden = !complete;
  if (complete) {
    nextIndex = -1;
    for (let offset = 1; offset < rounds.length; offset += 1) {
      const candidate = (currentIndex + offset) % rounds.length;
      if (!rounds[candidate].completed) {
        nextIndex = candidate;
        break;
      }
    }
    const allSolved = nextIndex === -1;
    victory.classList.toggle('victory-finale', allSolved);
    victoryTitle.textContent = allSolved ? 'Hurra! Du klarte alle seks oppgavene!' : 'Hurra! Du fant alle fem forskjellene!';
    victoryMessage.textContent = allSolved ? 'Du fant 30 forskjeller sammen med Jo og GG!' : 'Jo og GG heier på deg!';
    nextChallenge.hidden = nextIndex === -1;
  }
}

function markDifference(index, spot) {
  const round = rounds[currentIndex];
  if (!imagesReady || round.found.has(index)) return;

  const wasCompleted = round.completed;
  round.found.add(index);
  if (highlighted === index) highlighted = -1;
  updateSpots(index);
  const complete = round.found.size === currentDifferences.length;
  if (complete) round.completed = true;
  updateProgress();
  if (complete) {
    message.textContent = `${victoryTitle.textContent} ${victoryMessage.textContent}`;
    MiniQCelebration.win({ finale: !wasCompleted && nextIndex === -1 });
  } else {
    message.textContent = `Du fant en forskjell! ${currentDifferences[index].name}.`;
    MiniQCelebration.sparkle(spot);
  }
}

function createSpot(difference, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hotspot';
  ['--x', '--y', '--w', '--h'].forEach((property, coordinate) => {
    button.style.setProperty(property, `${difference.area[coordinate]}%`);
  });
  const tick = document.createElement('span');
  tick.setAttribute('aria-hidden', 'true');
  tick.textContent = '✓';
  button.append(tick);
  button.addEventListener('click', () => markDifference(index, button));
  return button;
}

function openChallenge(index, focusTitle = false) {
  MiniQCelebration.clear();
  const render = ++revision;
  currentIndex = index;
  highlighted = -1;
  const challenge = challenges[index];
  currentDifferences = challenge.differences;
  currentSpots = currentDifferences.map((difference, spotIndex) =>
    scenes.map(() => createSpot(difference, spotIndex)));

  for (const [side, scene] of scenes.entries()) {
    const image = sceneImages[side];
    image.src = `finn-5-feil/${challenge.image}-${side === 0 ? 'a' : 'b'}.webp`;
    image.alt = side === 0 ? challenge.description : 'Samme motiv med fem forskjeller.';
    scene.replaceChildren(image, ...currentSpots.map(spots => spots[side]));
  }
  imagesReady = sceneImages.every(image => image.complete && image.naturalWidth > 0);
  scenes.forEach(scene => scene.toggleAttribute('data-loading', !imagesReady));
  if (!imagesReady) {
    Promise.all(sceneImages.map(image => image.decode())).then(() => {
      if (render !== revision) return;
      imagesReady = true;
      scenes.forEach(scene => scene.removeAttribute('data-loading'));
      updateProgress();
    }, () => {
      if (render === revision) message.textContent = 'Bildene kunne ikke lastes. Trykk «Spill igjen» for å prøve på nytt.';
    });
  }
  currentDifferences.forEach((_, spotIndex) => updateSpots(spotIndex));
  challengeTitle.textContent = challenge.title;
  message.textContent = '';
  updateProgress();
  if (focusTitle) challengeTitle.focus();
}

for (const [side, scene] of scenes.entries()) {
  scene.addEventListener('click', event => {
    if (imagesReady && event.target === sceneImages[side] &&
        rounds[currentIndex].found.size < currentDifferences.length) {
      message.textContent = 'Se litt til. Du klarer det!';
    }
  });
}

hint.addEventListener('click', () => {
  const previous = highlighted;
  const found = rounds[currentIndex].found;
  const remaining = currentDifferences.map((_, index) => index).filter(index => !found.has(index));
  if (!remaining.length) return;

  highlighted = remaining[(remaining.indexOf(previous) + 1) % remaining.length];
  if (previous !== -1) updateSpots(previous);
  updateSpots(highlighted);
  message.textContent = `Se ${currentDifferences[highlighted].location}!`;
});

restart.addEventListener('click', () => {
  rounds[currentIndex].found.clear();
  openChallenge(currentIndex);
  message.textContent = 'Prøv en gang til!';
});

nextChallenge.addEventListener('click', () => {
  if (nextIndex !== -1) openChallenge(nextIndex, true);
});

openChallenge(0);
