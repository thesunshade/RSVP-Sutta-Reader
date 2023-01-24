import buildSutta from "./functions/buildSutta.js";

const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const speedOption = document.getElementById("wpm");
const skinOption = document.getElementById("skin");
const textarea = document.getElementById("textarea");
const output = document.getElementById("output");
const status = document.getElementById("status");
let timer;
let words = [];
let currentWord = 0;
let last_currentWord = 0;
let wpm = 400;
let average_word_length = 6;
let MAJOR_BREAK = /[.!?"“”…]$/;
let MINOR_BREAK = /[,;:]$/;
let ENDS = /[.!?"“”,;:«»]$/;
let STARTS = /^[-–—«»"“”]/;
let running = false;
const PARAGRAPH_BREAK = "PARAGRAPH_BREAK";
const SENTENCE_BREAK = "SENTENCE_BREAK";
const highestSpeed = 800;
const lowestSpeed = 300;
const incrementSpeed = 25;
let skin = "blackoncream";

const form = document.getElementById("get-sutta-form");
const citation = document.getElementById("citation");
citation.focus();

form.addEventListener("submit", e => {
  e.preventDefault();
  if (citation.value) {
    buildSutta(citation.value.replace(/\s/g, ""));
    history.pushState({ page: citation.value.replace(/\s/g, "") }, "", `?q=${citation.value.replace(/\s/g, "")}`);
  }
});

/*
  Data
*/
const saveText = () => {
  localStorage.setItem("text", textarea.value);
  saveSettings();
};
const saveSettings = () => {
  localStorage.setItem("cur", last_currentWord);
  localStorage.setItem("wpm", wpm);
  localStorage.setItem("skin", skin);
  render();
};
const loadSettings = () => {
  textarea.value = localStorage.getItem("text") || "";
  if (localStorage.getItem("cur")) {
    currentWord = parseInt(localStorage.getItem("cur"));
    last_currentWord = currentWord;
    goToLastSentence();
  }
  if (localStorage.getItem("wpm")) {
    wpm = parseInt(localStorage.getItem("wpm"));
  }
  if (localStorage.getItem("skin")) {
    skin = localStorage.getItem("skin");
  }
  loadText();
  render();
};

/*
  Event listeners
*/

startButton.addEventListener("click", e => {
  start();
});

resetButton.addEventListener("click", e => {
  reset();
  start();
});

skinOption.addEventListener("change", e => {
  skin = skinOption.value;
  saveSettings();
});

speedOption.addEventListener("change", e => {
  wpm = parseInt(speedOption.value);
  saveSettings();
});

textarea.addEventListener("input", e => {
  console.log("fired");
  // cur = 0
  loadText();
  render();
});
textarea.addEventListener("keyup", e => {
  // cur = 0
  loadText();
  render();
});
textarea.addEventListener("keydown", e => {
  e.stopPropagation();
});

document.getElementById("noclick").addEventListener("click", e => {
  e.stopPropagation();
});
// document.getElementById('setup').addEventListener('keydown', (e) => {
//   e.stopPropagation();
// })
let mouseTimer;
document.body.addEventListener("mousemove", () => {
  if (running) {
    mouseTimer && clearTimeout(mouseTimer);
    document.body.setAttribute("data-showcursor", "true");
    mouseTimer = setTimeout(() => {
      document.body.removeAttribute("data-showcursor");
    }, 700);
  }
});

document.body.addEventListener("keydown", e => {
  if (e.keyCode === 32) {
    e.preventDefault();
    if (running) {
      stop();
    } else {
      start();
    }
  } else if (e.keyCode === 37) {
    /* Left */
    goToLastSentence();
  } else if (e.keyCode === 39) {
    /* Right */
    for (let i = currentWord + 1; i < words.length; i++) {
      if (words[i] === PARAGRAPH_BREAK || words[i] === SENTENCE_BREAK) {
        currentWord = i + 1;
        next(200);
        break;
      }
    }
  } else if (e.keyCode === 38 && wpm < 1000) {
    /* Up */
    wpm += 25;
    render();
    // wpm = wpm * 1.03 + 5
    // wpm = Math.round(wpm / 5) * 5
  } else if (e.keyCode === 40 && wpm > 25) {
    /* Down */
    wpm -= 25;
    render();
    // wpm = wpm / 1.03 - 5
    // wpm = Math.round(wpm / 5) * 5
  }
});

document.body.addEventListener("click", () => {
  if (running) {
    stop();
  } else {
    start();
  }
});

const goToLastSentence = () => {
  for (let i = Math.max(0, last_currentWord - 2); i >= 0; i--) {
    if (words[i] === PARAGRAPH_BREAK || words[i] === SENTENCE_BREAK || i === 0) {
      if (i === 0) {
        currentWord = i;
      } else {
        currentWord = i + 1;
      }
      next(350);
      break;
    }
  }
};

/*
  Functionality
*/
const render = () => {
  if (words.length > 0) {
    status.style.width = `${(currentWord / words.length) * 100}%`;
    startButton.innerHTML = `Continue (${Math.floor((currentWord / words.length) * 100)}%)`;
  }
  if (currentWord == 0 || currentWord == words.length) {
    startButton.innerHTML = "Start";
  }
  skinOption.value = skin;
  document.body.setAttribute("data-skin", skin);
  let time = words.length / wpm;
  document.getElementById("time").innerHTML = `(${(words.length / wpm).toFixed(1)} minutes)`;

  /* Render WPM dropdown */
  let available_speeds = [];
  for (let i = lowestSpeed; i <= highestSpeed; i += incrementSpeed) {
    available_speeds.push(i);
  }
  if (!available_speeds.includes(wpm)) {
    available_speeds.push(wpm);
    available_speeds = available_speeds.sort((a, b) => a - b);
  }
  speedOption.innerHTML = available_speeds
    .map(j => `<option value="${j}" ${j === wpm ? "selected" : ""}>${j} words per minute</option>`)
    .join("");
};

const reset = () => {
  currentWord = 0;
  last_currentWord = currentWord;
};

const loadText = () => {
  words = textarea.value
    .split(/\n\n+/g)
    .filter(Boolean)
    .join(" " + PARAGRAPH_BREAK + " ")
    .replace(/ ([-–—%]) /g, " $1&nbsp;")
    .replace(/ ([^ ]+) \1 /g, " $1 " + SENTENCE_BREAK + " $1 ") /* Same word twice in a row */
    .replace(/([.…!?"“”]) ([A-ZÁÍÓÚÞÑÖÐÉÜÇ])/g, "$1 " + SENTENCE_BREAK + " $2")
    .replace(/SENTENCE_BREAK PARAGRAPH_BREAK/g, "PARAGRAPH_BREAK")
    .split(/\s+/g)
    .filter(Boolean)
    .map(i => i.replace(/&nbsp;/g, "\u00A0"));
};

const start = () => {
  loadText();
  if (currentWord >= words.length) {
    reset();
  }
  running = true;
  currentWord = last_currentWord; /* Go one back to start on the same word */
  saveText();
  next(150);
};

const stop = () => {
  running = false;
  timer && clearTimeout(timer);
  document.body.removeAttribute("data-running");
};

const timeoutAndNext = (multiplier, add) => {
  let ms = (multiplier || 1) * ((60 * 1) / wpm) * 1000;
  ms += add || 0;
  timer && clearTimeout(timer);
  timer = setTimeout(() => next(), ms);
};

const next = add => {
  document.body.setAttribute("data-running", "true");

  if (!document.hasFocus() || currentWord >= words.length) {
    return stop();
  }
  let word = words[currentWord];
  if (word !== PARAGRAPH_BREAK && word !== SENTENCE_BREAK) {
    for (let i = 1; word.length < 9 && currentWord + i < words.length; i++) {
      let word_to_add = words[currentWord + i];
      if (word_to_add === PARAGRAPH_BREAK || word_to_add === SENTENCE_BREAK) {
        break;
      }
      if (
        word_to_add === undefined ||
        word.length + word_to_add.length > 8 ||
        ENDS.test(word) ||
        STARTS.test(word_to_add)
      ) {
        break;
      }
      if (words[currentWord + i].length <= 3 && words[currentWord + i + 1] && words[currentWord + i + 1].length > 4) {
        break;
      }
      word += " " + word_to_add;
    }
  }
  // console.log(word)
  const minMultiplier = 0.65;
  // const maxMultiplier = 1.5
  // const longestWord = 12
  let multiplier = minMultiplier + (1 - minMultiplier) * (word.length / average_word_length);
  if (multiplier > 1) {
    multiplier = multiplier ** 1.4;
  }
  multiplier = clamp(multiplier, minMultiplier, 1.8);
  // console.log({ word, multiplier })
  last_currentWord = currentWord;
  currentWord = currentWord + word.split(" ").length;
  if (word === PARAGRAPH_BREAK) {
    word = "";
    multiplier = 2;
  } else if (word === SENTENCE_BREAK) {
    word = "";
    multiplier = 2;
    // the two lines below were commented out. Not sure if they work.
  } else if (MAJOR_BREAK.test(word) && words[currentWord + 1] !== PARAGRAPH_BREAK) {
    multiplier = 2;
  } else if (MINOR_BREAK.test(word)) {
    multiplier = 2.4;
  }
  // output.innerHTML = `<div id="spacer"></div>`
  // + `<div id="word">${word}</div>`
  output.innerHTML = `<span id="word" style="opacity:0">${word}</span>`;
  const outputWidth = output.getBoundingClientRect().width;
  const w = document.getElementById("word");
  const wordWidth = w.getBoundingClientRect().width;
  let leftpad = (outputWidth - wordWidth * 0.6) / 2 - 10;
  if (wordWidth >= leftpad / 2) {
    leftpad = Math.min(leftpad, outputWidth - wordWidth);
  }
  w.setAttribute(
    "style",
    `display:block;width:${Math.ceil(wordWidth)}px;margin-left:${Math.floor(Math.max(0, leftpad))}px`
  );
  // console.log({
  //   outputWidth,
  //   wordWidth,
  //   leftpad,
  // });
  timeoutAndNext(multiplier, add);
  saveSettings();
};

const clamp = function (input, min, max) {
  return Math.min(Math.max(input, min), max);
};
loadSettings();
