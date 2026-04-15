const DEFAULT_MINUTES = 15;
const MIN_MINUTES = 1;
const MAX_MINUTES = 120;
const STORAGE_KEY_TOMATO_COUNT = "pomodoro_tomato_count";
const STORAGE_KEY_TOTAL_MINUTES = "pomodoro_total_minutes";
const MAX_DISPLAY_TOMATOES = 10;

let workDurationSeconds = DEFAULT_MINUTES * 60;
let remainingSeconds = workDurationSeconds;
let timerId = null;
let isRunning = false;
let tomatoCount = 0;
let totalMinutes = 0;

const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const minutesInput = document.getElementById("minutesInput");
const presetButtons = document.querySelectorAll(".preset-btn");
const tomatoContainer = document.getElementById("tomatoContainer");
const tomatoCountEl = document.getElementById("tomatoCount");
const totalTimeCountEl = document.getElementById("totalTimeCount");
const totalTimeUnitEl = document.getElementById("totalTimeUnit");

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatTotalTime(minutes) {
  if (minutes < 60) {
    return { value: minutes, unit: "分钟" };
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return { value: hours, unit: "小时" };
  }
  return { value: `${hours}.${remainingMins}`, unit: "小时" };
}

function updateDisplay() {
  timeEl.textContent = formatTime(remainingSeconds);
}

function updateTotalTimeDisplay() {
  const { value, unit } = formatTotalTime(totalMinutes);
  totalTimeCountEl.textContent = value;
  totalTimeUnitEl.textContent = unit;
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  isRunning = false;
}

function createTomatoElement() {
  const tomato = document.createElement("div");
  tomato.className = "tomato";
  return tomato;
}

function updateTomatoDisplay() {
  tomatoCountEl.textContent = tomatoCount;
  tomatoContainer.innerHTML = "";

  const displayCount = Math.min(tomatoCount, MAX_DISPLAY_TOMATOES);
  for (let i = 0; i < displayCount; i++) {
    tomatoContainer.appendChild(createTomatoElement());
  }

  if (tomatoCount > MAX_DISPLAY_TOMATOES) {
    const moreIndicator = document.createElement("span");
    moreIndicator.style.fontSize = "12px";
    moreIndicator.style.color = "#666";
    moreIndicator.textContent = "+";
    tomatoContainer.appendChild(moreIndicator);
  }
}

async function loadTomatoCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY_TOMATO_COUNT], (result) => {
      const count = result[STORAGE_KEY_TOMATO_COUNT] || 0;
      resolve(count);
    });
  });
}

async function saveTomatoCount(count) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [STORAGE_KEY_TOMATO_COUNT]: count },
      resolve
    );
  });
}

async function loadTotalMinutes() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY_TOTAL_MINUTES], (result) => {
      const minutes = result[STORAGE_KEY_TOTAL_MINUTES] || 0;
      resolve(minutes);
    });
  });
}

async function saveTotalMinutes(minutes) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [STORAGE_KEY_TOTAL_MINUTES]: minutes },
      resolve
    );
  });
}

async function addCompletedSession(sessionMinutes) {
  tomatoCount += 1;
  totalMinutes += sessionMinutes;
  await Promise.all([
    saveTomatoCount(tomatoCount),
    saveTotalMinutes(totalMinutes),
  ]);
  updateTomatoDisplay();
  updateTotalTimeDisplay();
}

async function tick() {
  if (remainingSeconds <= 0) {
    stopTimer();
    const minutes = Math.floor(workDurationSeconds / 60);
    await addCompletedSession(minutes);
    alert(
      `${minutes}分钟结束，休息一下吧！\n\n已完成 ${tomatoCount} 个番茄，累计专注 ${formatTotalTime(totalMinutes).value} ${formatTotalTime(totalMinutes).unit}`
    );
    enableTimeInput();
    return;
  }

  remainingSeconds -= 1;
  updateDisplay();
}

function setTimeInputEnabled(enabled) {
  minutesInput.disabled = !enabled;
  presetButtons.forEach((btn) => {
    btn.disabled = !enabled;
  });
}

function enableTimeInput() {
  setTimeInputEnabled(true);
}

function disableTimeInput() {
  setTimeInputEnabled(false);
}

function updatePresetButtons(minutes) {
  presetButtons.forEach((btn) => {
    const btnMinutes = parseInt(btn.dataset.minutes, 10);
    btn.classList.toggle("active", btnMinutes === minutes);
  });
}

function setMinutes(minutes) {
  const clampedMinutes = Math.max(
    MIN_MINUTES,
    Math.min(MAX_MINUTES, minutes)
  );
  minutesInput.value = clampedMinutes;
  workDurationSeconds = clampedMinutes * 60;
  remainingSeconds = workDurationSeconds;
  updateDisplay();
  updatePresetButtons(clampedMinutes);
}

function validateAndSetMinutes() {
  let value = parseInt(minutesInput.value, 10);
  if (isNaN(value) || value < MIN_MINUTES) {
    value = MIN_MINUTES;
  } else if (value > MAX_MINUTES) {
    value = MAX_MINUTES;
  }
  setMinutes(value);
}

startBtn.addEventListener("click", () => {
  if (isRunning) {
    return;
  }
  validateAndSetMinutes();
  disableTimeInput();
  isRunning = true;
  timerId = setInterval(tick, 1000);
});

pauseBtn.addEventListener("click", () => {
  stopTimer();
});

resetBtn.addEventListener("click", () => {
  stopTimer();
  validateAndSetMinutes();
  enableTimeInput();
});

minutesInput.addEventListener("change", validateAndSetMinutes);

minutesInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    validateAndSetMinutes();
  }
});

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const minutes = parseInt(btn.dataset.minutes, 10);
    setMinutes(minutes);
  });
});

async function init() {
  [tomatoCount, totalMinutes] = await Promise.all([
    loadTomatoCount(),
    loadTotalMinutes(),
  ]);
  updateTomatoDisplay();
  updateTotalTimeDisplay();
  updateDisplay();
}

init();
