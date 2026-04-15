const WORK_DURATION_SECONDS = 15 * 60;

let remainingSeconds = WORK_DURATION_SECONDS;
let timerId = null;

const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateDisplay() {
  timeEl.textContent = formatTime(remainingSeconds);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function tick() {
  if (remainingSeconds <= 0) {
    stopTimer();
    alert("15分钟结束，休息一下吧！");
    return;
  }

  remainingSeconds -= 1;
  updateDisplay();
}

startBtn.addEventListener("click", () => {
  if (timerId !== null) {
    return;
  }
  timerId = setInterval(tick, 1000);
});

pauseBtn.addEventListener("click", () => {
  stopTimer();
});

resetBtn.addEventListener("click", () => {
  stopTimer();
  remainingSeconds = WORK_DURATION_SECONDS;
  updateDisplay();
});

updateDisplay();
