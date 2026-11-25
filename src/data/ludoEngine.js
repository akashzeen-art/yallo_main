/* Ludo (human vs character AI) rendered as SVG into a host element.
   mountLudo(el, { human, ai, aiName, text(key, vars), onMessage(text), onEvent(type, data), onEnd(winner) })
   winner is "user" or "ai". Returns { restart, destroy }. */

const COL = { red: "#e83322", green: "#3f9a2b", yellow: "#f5cd45", blue: "#82c8fb" };
const START = { red: 0, green: 13, yellow: 26, blue: 39 };
const YARD = { red: [0, 0], green: [9, 0], yellow: [9, 9], blue: [0, 9] };
const FIN = { red: [6.7, 7.5], green: [7.5, 6.7], yellow: [8.3, 7.5], blue: [7.5, 8.3] };
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const PATH = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
const HOME = {
  red: [[7,1],[7,2],[7,3],[7,4],[7,5]], green: [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]], blue: [[13,7],[12,7],[11,7],[10,7],[9,7]],
};
const FACES = "⚀⚁⚂⚃⚄⚅";
const NS = "http://www.w3.org/2000/svg";
const abs = (c, r) => (START[c] + r) % 52;

export const LUDO_COLORS = COL;

export function mountLudo(el, opts) {
  const o = {
    human: "red",
    ai: "yellow",
    aiName: "AI",
    text: (k) => k,
    onMessage() {},
    onEvent() {},
    onEnd() {},
    ...opts,
  };
  const players = [o.human, o.ai];
  const T = (k, vars) => o.text(k, { name: o.aiName, ...vars });
  const timers = new Set();
  let dead = false;
  let st;

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!dead) fn();
    }, ms);
    timers.add(id);
  };

  el.innerHTML =
    '<svg viewBox="-0.1 -0.1 15.2 15.2" preserveAspectRatio="xMidYMid meet"></svg>' +
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
  const cell = (r, c, fill) =>
    mk("rect", { x: c, y: r, width: 1, height: 1, fill: fill || "#fff", stroke: "#222", "stroke-width": 0.05 });

  mk("rect", { x: 0, y: 0, width: 15, height: 15, fill: "#fff" });
  for (const c of Object.keys(COL)) {
    const [x, y] = YARD[c];
    const used = players.includes(c);
    mk("rect", { x, y, width: 6, height: 6, fill: COL[c], opacity: used ? 1 : 0.4, stroke: "#222", "stroke-width": 0.05 });
    mk("rect", { x: x + 1, y: y + 1, width: 4, height: 4, fill: "#fff" });
    for (const [dx, dy] of [[2, 2], [4, 2], [2, 4], [4, 4]])
      mk("circle", { cx: x + dx, cy: y + dy, r: 0.5, fill: COL[c], opacity: used ? 1 : 0.4, stroke: "#111", "stroke-width": 0.05 });
  }
  PATH.forEach(([r, c], i) => {
    const sc = Object.keys(START).find((k) => START[k] === i);
    cell(r, c, sc ? COL[sc] : "#fff");
    if (SAFE.has(i) && !sc)
      mk("text", { x: c + 0.5, y: r + 0.74, "text-anchor": "middle", "font-size": 0.7, fill: "#999" }).textContent = "★";
  });
  for (const c in HOME) HOME[c].forEach(([r, cc]) => cell(r, cc, COL[c]));
  const tri = { red: "6,6 6,9 7.5,7.5", green: "6,6 9,6 7.5,7.5", yellow: "9,6 9,9 7.5,7.5", blue: "6,9 9,9 7.5,7.5" };
  for (const c in tri) mk("polygon", { points: tri[c], fill: COL[c], stroke: "#222", "stroke-width": 0.05 });
  mk("rect", { x: 0, y: 0, width: 15, height: 15, fill: "none", stroke: "#111", "stroke-width": 0.12 });

  const toks = {};
  players.forEach((c) => {
    toks[c] = [0, 1, 2, 3].map((i) => {
      const g = mk("g", { class: "ludo-tok" });
      mk("circle", { r: 0.38, fill: COL[c] }, g);
      mk("circle", { r: 0.14, fill: "#fff", opacity: 0.55, stroke: "none" }, g);
      g.addEventListener("click", () => humanPick(c, i));
      return g;
    });
  });

  const cur = () => players[st.t];
  const isAI = () => cur() === o.ai;
  const target = (r, d) => (r === -1 ? 0 : r + d);
  const movable = (c, d) =>
    st.P[c].map((r, i) => ((r === -1 ? d === 6 : r + d <= 56) ? i : -1)).filter((i) => i >= 0);

  const say = (msg) => {
    info.textContent = "";
    const dot = document.createElement("span");
    dot.className = "game-dot";
    dot.style.background = COL[players[st.t]];
    info.appendChild(dot);
    info.appendChild(document.createTextNode(msg));
    o.onMessage(msg);
  };

  function victims(c, nr) {
    if (nr > 50 || SAFE.has(abs(c, nr))) return [];
    const a = abs(c, nr);
    const v = [];
    players
      .filter((p) => p !== c)
      .forEach((p) =>
        st.P[p].forEach((r, i) => {
          if (r >= 0 && r <= 50 && abs(p, r) === a) v.push([p, i]);
        })
      );
    return v;
  }

  function threatened(c, r) {
    if (r < 0 || r > 50 || SAFE.has(abs(c, r))) return false;
    const a = abs(c, r);
    return players
      .filter((p) => p !== c)
      .some((p) =>
        st.P[p].some((r2) => r2 >= 0 && r2 <= 50 && [1, 2, 3, 4, 5, 6].some((k) => (abs(p, r2) + k) % 52 === a))
      );
  }

  function pos(c, i) {
    const r = st.P[c][i];
    if (r === -1) return [YARD[c][0] + 2 + (i % 2) * 2, YARD[c][1] + 2 + (i >> 1) * 2];
    if (r <= 50) {
      const [row, col] = PATH[abs(c, r)];
      return [col + 0.5, row + 0.5];
    }
    if (r <= 55) {
      const [row, col] = HOME[c][r - 51];
      return [col + 0.5, row + 0.5];
    }
    const [fx, fy] = FIN[c];
    const vert = c === "red" || c === "yellow";
    const k = (i - 1.5) * 0.17;
    return vert ? [fx, fy + k] : [fx + k, fy];
  }

  function render() {
    const groups = {};
    players.forEach((c) =>
      st.P[c].forEach((r, i) => {
        const p = pos(c, i);
        (groups[p.join()] = groups[p.join()] || []).push([c, i, p]);
      })
    );
    const can = !st.busy && st.phase === "move" && !isAI() ? movable(cur(), st.dice) : [];
    for (const key in groups) {
      const arr = groups[key];
      const inYard = st.P[arr[0][0]][arr[0][1]] === -1;
      arr.forEach(([c, i, p], k) => {
        const single = inYard || arr.length === 1;
        const dx = single ? 0 : (k - (arr.length - 1) / 2) * 0.3;
        const s = single ? 1 : 0.75;
        const g = toks[c][i];
        g.style.transform = `translate(${p[0] + dx}px,${p[1]}px) scale(${s})`;
        g.classList.toggle("can", c === cur() && can.includes(i));
      });
    }
    diceEl.textContent = st.dice ? FACES[st.dice - 1] : FACES[0];
    diceEl.style.borderColor = COL[cur()];
    btn.disabled = st.over ? false : !(st.phase === "roll" && !isAI() && !st.busy);
    btn.textContent = st.over ? T("playAgain") : T("ludoRoll");
  }

  function newGame() {
    timers.forEach(clearTimeout);
    timers.clear();
    st = { P: {}, t: 0, dice: 0, phase: "roll", busy: false, over: false };
    players.forEach((c) => (st.P[c] = [-1, -1, -1, -1]));
    diceEl.classList.remove("roll");
    say(T("ludoYourTurn"));
    render();
    o.onEvent("start", {});
  }

  function roll() {
    if (st.over || st.phase !== "roll" || st.busy) return;
    st.busy = true;
    diceEl.classList.add("roll");
    render();
    let n = 0;
    const iv = setInterval(() => {
      if (dead) return clearInterval(iv);
      diceEl.textContent = FACES[Math.floor(Math.random() * 6)];
      if (++n < 7) return;
      clearInterval(iv);
      diceEl.classList.remove("roll");
      st.dice = 1 + Math.floor(Math.random() * 6);
      const list = movable(cur(), st.dice);
      if (!list.length) {
        say(T(isAI() ? "ludoAiNoMove" : "ludoYouNoMove", { value: st.dice }));
        o.onEvent("turn", { by: isAI() ? "ai" : "user", value: st.dice, moved: false });
        render();
        return later(() => endTurn(false), 1000);
      }
      st.phase = "move";
      if (isAI()) {
        say(T("ludoAiRolled", { value: st.dice }));
        render();
        return later(() => move(cur(), aiPick(list)), 800);
      }
      if (list.length === 1) {
        say(T("ludoYouRolled", { value: st.dice }));
        render();
        return later(() => move(cur(), list[0]), 450);
      }
      st.busy = false;
      say(T("ludoTapPiece", { value: st.dice }));
      render();
    }, 70);
    timers.add(iv);
  }

  function humanPick(c, i) {
    if (st.over || st.busy || st.phase !== "move" || isAI() || c !== cur()) return;
    if (movable(c, st.dice).includes(i)) move(c, i);
  }

  function move(c, i) {
    st.busy = true;
    const d = st.dice;
    const nr = target(st.P[c][i], d);
    st.P[c][i] = nr;
    const v = victims(c, nr);
    v.forEach(([p, j]) => (st.P[p][j] = -1));
    render();
    const who = c === o.human ? "user" : "ai";
    if (st.P[c].every((r) => r === 56)) {
      st.over = true;
      say(T(who === "user" ? "ludoYouWon" : "ludoAiWon"));
      render();
      o.onEvent("win", { winner: who });
      o.onEnd(who);
      return;
    }
    if (v.length) {
      say(T(who === "user" ? "ludoYouCaptured" : "ludoAiCaptured"));
      o.onEvent("capture", { by: who, count: v.length });
    } else {
      o.onEvent("turn", { by: who, value: d, moved: true, home: nr === 56 });
    }
    const extra = d === 6 || v.length > 0 || nr === 56;
    later(() => endTurn(extra), 700);
  }

  function endTurn(extra) {
    if (!extra) st.t = (st.t + 1) % players.length;
    st.phase = "roll";
    st.busy = false;
    say(isAI() ? T("ludoThinking") : T(extra ? "ludoExtraTurn" : "ludoYourTurn"));
    render();
    if (isAI()) later(roll, 800);
  }

  function aiPick(list) {
    const c = cur();
    const d = st.dice;
    let best = list[0];
    let bs = -1e9;
    list.forEach((i) => {
      const r = st.P[c][i];
      const nr = target(r, d);
      let s = nr / 10;
      if (nr === 56) s += 100;
      s += victims(c, nr).length * 80;
      if (r === -1) s += 50;
      if (r <= 50 && nr > 50) s += 30;
      if (nr <= 50 && SAFE.has(abs(c, nr))) s += 15;
      if (threatened(c, r)) s += 25;
      if (nr <= 50 && threatened(c, nr)) s -= 20;
      s += Math.random();
      if (s > bs) {
        bs = s;
        best = i;
      }
    });
    return best;
  }

  btn.addEventListener("click", () => (st.over ? newGame() : roll()));
  newGame();

  return {
    restart: newGame,
    destroy() {
      dead = true;
      timers.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      timers.clear();
      el.innerHTML = "";
    },
  };
}
