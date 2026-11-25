/* Snake & Ladder (human vs character AI) rendered as SVG into a host element.
   mountSnakeLadder(el, { aiName, text(key, vars), onMessage(text), onEvent(type, data), onEnd(winner) })
   winner is "user" or "ai". Returns { restart, destroy }. */

const NS = "http://www.w3.org/2000/svg";
const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
const COL = { user: "#e83322", ai: "#f5cd45" };
const FACES = "⚀⚁⚂⚃⚄⚅";

export const SNAKE_LADDER_COLORS = COL;

function center(n) {
  const i = n - 1;
  const row = Math.floor(i / 10);
  const c = i % 10;
  const col = row % 2 === 0 ? c : 9 - c;
  return [col * 10 + 5, (9 - row) * 10 + 5];
}

export function mountSnakeLadder(el, opts) {
  const o = { aiName: "AI", text: (k) => k, onMessage() {}, onEvent() {}, onEnd() {}, ...opts };
  const T = (k, vars) => o.text(k, { name: o.aiName, ...vars });
  const timers = new Set();
  let dead = false;
  let st;

  const sleep = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!dead) resolve();
      }, ms);
      timers.add(id);
    });

  el.innerHTML =
    '<svg class="sl-board" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"></svg>' +
    '<div class="game-bar"><div class="game-dice">⚀</div><div class="game-info"></div><button type="button" class="game-btn"></button></div>';
  const svg = el.querySelector("svg");
  const diceEl = el.querySelector(".game-dice");
  const info = el.querySelector(".game-info");
  const btn = el.querySelector(".game-btn");

  const mk = (tag, a, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in a) n.setAttribute(k, a[k]);
    (parent || svg).appendChild(n);
    return n;
  };

  for (let n = 1; n <= 100; n++) {
    const [x, y] = center(n);
    mk("rect", {
      x: x - 5, y: y - 5, width: 10, height: 10,
      fill: n === 100 ? "#a5d6a7" : (n + Math.floor((n - 1) / 10)) % 2 ? "#fff4cc" : "#d8efff",
      stroke: "#bbb", "stroke-width": 0.2,
    });
    mk("text", { x: x - 4.5, y: y - 2.6, "font-size": 2.6, fill: "#666" }).textContent = n;
  }

  for (const a in LADDERS) {
    const [x1, y1] = center(+a);
    const [x2, y2] = center(LADDERS[a]);
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L, px = -uy * 1.3, py = ux * 1.3;
    for (const s of [-1, 1])
      mk("line", { x1: x1 + s * px, y1: y1 + s * py, x2: x2 + s * px, y2: y2 + s * py, stroke: "#8d5524", "stroke-width": 0.8, "stroke-linecap": "round" });
    for (let d = 3; d < L - 1; d += 4)
      mk("line", { x1: x1 + ux * d - px, y1: y1 + uy * d - py, x2: x1 + ux * d + px, y2: y1 + uy * d + py, stroke: "#b9783f", "stroke-width": 0.7 });
  }

  const snakeCols = ["#2e7d32", "#6a1b9a", "#c62828", "#00838f", "#ef6c00"];
  let si = 0;
  for (const a in SNAKES) {
    const [x1, y1] = center(+a);
    const [x2, y2] = center(SNAKES[a]);
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    const nx = -dy / L, ny = dx / L, col = snakeCols[si++ % 5];
    let d = "";
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const w = Math.sin(t * Math.PI * 4) * 2.4 * (1 - t * 0.5);
      d += (i ? "L" : "M") + (x1 + dx * t + nx * w).toFixed(2) + " " + (y1 + dy * t + ny * w).toFixed(2);
    }
    mk("path", { d, fill: "none", stroke: col, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.9 });
    mk("circle", { cx: x1, cy: y1, r: 2, fill: col });
    mk("circle", { cx: x1 - 0.7, cy: y1 - 0.5, r: 0.45, fill: "#fff" });
    mk("circle", { cx: x1 + 0.7, cy: y1 - 0.5, r: 0.45, fill: "#fff" });
  }

  const toks = {};
  ["user", "ai"].forEach((p) => {
    const g = mk("g", { class: "sl-tok" });
    mk("circle", { r: 2.3, fill: COL[p] }, g);
    toks[p] = g;
  });

  const key = (p, userKey, aiKey) => (p === "user" ? userKey : aiKey);

  const say = (msg) => {
    info.textContent = "";
    const dot = document.createElement("span");
    dot.className = "game-dot";
    dot.style.background = COL[st.turn];
    info.appendChild(dot);
    info.appendChild(document.createTextNode(msg));
    o.onMessage(msg);
  };

  function place(p) {
    const n = st.pos[p];
    let [x, y] = n === 0 ? [p === "user" ? 3 : 8, 97] : center(n);
    if (n > 0 && st.pos.user === st.pos.ai) x += p === "user" ? -2 : 2;
    toks[p].style.transform = `translate(${x}px,${y}px)`;
  }

  function render() {
    place("user");
    place("ai");
    diceEl.textContent = st.dice ? FACES[st.dice - 1] : FACES[0];
    diceEl.style.borderColor = COL[st.turn];
    btn.disabled = st.over ? false : !(st.turn === "user" && !st.busy);
    btn.textContent = st.over ? T("playAgain") : T("ludoRoll");
  }

  function newGame() {
    st = { pos: { user: 0, ai: 0 }, turn: "user", dice: 0, busy: false, over: false };
    diceEl.classList.remove("roll");
    say(T("ludoYourTurn"));
    render();
    o.onEvent("start", {});
  }

  async function roll() {
    if (st.busy || st.over) return;
    st.busy = true;
    diceEl.classList.add("roll");
    render();
    for (let i = 0; i < 7; i++) {
      diceEl.textContent = FACES[Math.floor(Math.random() * 6)];
      await sleep(70);
    }
    diceEl.classList.remove("roll");
    const p = st.turn;
    const d = (st.dice = 1 + Math.floor(Math.random() * 6));
    render();
    const stuck = st.pos[p] + d > 100;
    let special = false;
    if (stuck) {
      say(T(key(p, "slYouExact", "slAiExact"), { value: d }));
      await sleep(1000);
    } else {
      say(T(key(p, "slYouRolled", "slAiRolled"), { value: d }));
      for (let i = 0; i < d; i++) {
        st.pos[p]++;
        render();
        await sleep(170);
      }
      const n = st.pos[p];
      if (SNAKES[n]) {
        special = true;
        say(T(key(p, "slYouSnake", "slAiSnake"), { to: SNAKES[n] }));
        o.onEvent("snake", { by: p, from: n, to: SNAKES[n] });
        await sleep(500);
        st.pos[p] = SNAKES[n];
        render();
        await sleep(700);
      } else if (LADDERS[n]) {
        special = true;
        say(T(key(p, "slYouLadder", "slAiLadder"), { to: LADDERS[n] }));
        o.onEvent("ladder", { by: p, from: n, to: LADDERS[n] });
        await sleep(500);
        st.pos[p] = LADDERS[n];
        render();
        await sleep(700);
      }
      if (st.pos[p] === 100) {
        st.over = true;
        st.busy = false;
        say(T(p === "user" ? "ludoYouWon" : "ludoAiWon"));
        render();
        o.onEvent("win", { winner: p });
        o.onEnd(p);
        return;
      }
    }
    if (!special) o.onEvent("turn", { by: p, value: d, to: st.pos[p], stuck });
    if (d === 6) say(T(key(p, "slYouSix", "slAiSix")));
    else st.turn = p === "user" ? "ai" : "user";
    st.busy = false;
    if (d !== 6) say(st.turn === "ai" ? T("ludoThinking") : T("ludoYourTurn"));
    render();
    if (st.turn === "ai") {
      await sleep(900);
      roll();
    }
  }

  btn.addEventListener("click", () => (st.over ? newGame() : st.turn === "user" && roll()));
  newGame();

  return {
    restart: newGame,
    destroy() {
      dead = true;
      timers.forEach(clearTimeout);
      timers.clear();
      el.innerHTML = "";
    },
  };
}
