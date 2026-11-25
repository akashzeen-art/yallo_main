import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { drawTodPrompt, TOD_LEVELS } from "../data/truthOrDare";
import { useI18n } from "../i18n/LanguageContext";

const GOAL = 10;
const SKIPS = 3;
const DARE_SECONDS = 30;
const POINTS = { truth: 1, dare: 2 };

const LEVEL_DESC = {
  fun: "fun and silly (not romantic)",
  flirty: "sweet and flirty",
  bold: "bold and spicy but strictly PG-13 (nothing sexual)",
};
const TOD_NOTE = "(Truth or Dare game step — NOT typed by the user. Reply in the chat language, in character.)";

const askUserNote = (kind, level) =>
  kind === "truth"
    ? `${TOD_NOTE} It's the user's turn and they picked TRUTH. Ask them ONE ${LEVEL_DESC[level]} truth question — ` +
      `personal to what you know about them from this chat if you can, otherwise surprise them. ` +
      `Reply with just the question: one sentence, no intro, no quotes.`
    : `${TOD_NOTE} It's the user's turn and they picked DARE. Give them ONE ${LEVEL_DESC[level]} dare they can do right now ` +
      `(in this chat or wherever they are) in under a minute. PG-13. Reply with just the dare: one sentence, no intro, no quotes.`;

const answerNote = (kind, prompt) =>
  kind === "truth"
    ? `${TOD_NOTE} It's your turn. The user asked you this TRUTH: "${prompt}". Answer honestly and playfully in character, 1–2 short sentences.`
    : `${TOD_NOTE} It's your turn. The user dared you: "${prompt}". Actually do the dare right here in your message, short and fun.`;

const cleanPrompt = (text = "") =>
  String(text).replace(/^\s*(truth|dare|verdad|reto|vérité|action)\s*[:\-–—]\s*/i, "").replace(/^["“«]\s*|\s*["”»]$/g, "").trim();

function freshState() {
  return {
    turn: "user",
    phase: "choose",
    kind: null,
    random: false,
    prompt: "",
    answer: "",
    scores: { user: 0, ai: 0 },
    skips: SKIPS,
    round: 1,
    winner: null,
  };
}

export default function TruthDareGame({ open, character, onClose, onAnnounce, onGameEvent, askCharacter, onUserAnswer }) {
  const { t, lang } = useI18n();
  const [st, setSt] = useState(freshState);
  const [level, setLevel] = useState("flirty");
  const [draft, setDraft] = useState("");
  const [custom, setCustom] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [cardKey, setCardKey] = useState(0);
  const cbRef = useRef({});
  const lastStartRef = useRef(0);
  const name = character?.name || "";

  useLayoutEffect(() => {
    cbRef.current = { onAnnounce, onGameEvent, askCharacter, onUserAnswer, t };
  });

  const announce = (key, actor, vars) => {
    const line = cbRef.current.t(`games.${key}`, { name, goal: GOAL, ...vars });
    cbRef.current.onAnnounce?.(line, { actor });
    return line;
  };

  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    if (now - lastStartRef.current < 1500) return;
    lastStartRef.current = now;
    setSt(freshState());
    const text = announce("todChatStart", null);
    cbRef.current.onGameEvent?.("start", { text });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const daring = open && st.phase === "show" && st.turn === "user" && st.kind === "dare";
  useEffect(() => {
    if (!daring) return undefined;
    setTimeLeft(DARE_SECONDS);
    const iv = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [daring, cardKey]);

  if (!open || !character) return null;

  const patch = (next) => {
    setSt((prev) => ({ ...prev, ...(typeof next === "function" ? next(prev) : next) }));
    setCardKey((k) => k + 1);
  };

  const finish = (scores, forcedWinner) => {
    const winner =
      forcedWinner || (scores.user > scores.ai ? "user" : scores.ai > scores.user ? "ai" : "draw");
    patch({ phase: "over", scores, winner });
    const text = announce(winner === "user" ? "todChatYouWin" : winner === "ai" ? "todChatTheyWin" : "todChatDraw", winner === "draw" ? null : winner, {
      you: scores.user,
      them: scores.ai,
    });
    if (winner !== "draw") cbRef.current.onGameEvent?.("win", { winner, text });
  };

  const award = (who, pts, prev) => {
    const scores = { ...prev.scores, [who]: prev.scores[who] + pts };
    if (scores[who] >= GOAL) {
      finish(scores, who);
      return null;
    }
    return scores;
  };

  const nextTurn = (scores) =>
    patch((prev) => ({
      scores,
      turn: prev.turn === "user" ? "ai" : "user",
      round: prev.turn === "ai" ? prev.round + 1 : prev.round,
      phase: "choose",
      kind: null,
      random: false,
      prompt: "",
      answer: "",
    }));

  const pickKind = (choice) => {
    const random = choice === "random";
    return { kind: random ? (Math.random() < 0.5 ? "truth" : "dare") : choice, random };
  };

  const startUserTurn = async (choice) => {
    const { kind, random } = pickKind(choice);
    setDraft("");
    patch({ phase: "loading", kind, random, prompt: "" });
    let prompt = cleanPrompt((await cbRef.current.askCharacter?.(askUserNote(kind, level))) || "");
    if (!prompt) {
      prompt = drawTodPrompt(kind, level, lang);
      announce(kind === "truth" ? "todFeedTruthForYou" : "todFeedDareForYou", "ai", { prompt });
    }
    patch({ phase: "show", prompt });
  };

  const submitUser = () => {
    const text = draft.trim();
    if (st.kind === "truth" && !text) return;
    if (text) cbRef.current.onUserAnswer?.(text);
    const pts = POINTS[st.kind] + (st.random ? 1 : 0);
    announce(st.kind === "truth" ? "todFeedYouTruth" : "todFeedYouDare", "user", { pts });
    setDraft("");
    const scores = award("user", pts, st);
    if (scores) nextTurn(scores);
  };

  const skipUser = () => {
    if (st.skips <= 0) return;
    announce("todFeedYouSkip", "user", { left: st.skips - 1 });
    setDraft("");
    patch((prev) => ({ skips: prev.skips - 1 }));
    nextTurn(st.scores);
  };

  const startAiTurn = async (choice, ownQuestion = "") => {
    const own = ownQuestion.trim();
    const { kind, random } = own ? { kind: "truth", random: false } : pickKind(choice);
    const prompt = own || drawTodPrompt(kind, level, lang, true);
    setCustom("");
    announce(kind === "truth" ? "todFeedYouAskTruth" : "todFeedYouAskDare", "user", { prompt });
    patch({ phase: "loading", kind, random, prompt, answer: "" });
    const answer = (await cbRef.current.askCharacter?.(answerNote(kind, prompt))) || t("games.todShyAnswer");
    patch({ phase: "answered", answer });
  };

  const rate = (hearts) => {
    announce("todFeedRated", "ai", { pts: hearts, hearts: hearts ? "❤️".repeat(hearts) : "😐" });
    const scores = award("ai", hearts, st);
    if (scores) nextTurn(scores);
  };

  const mine = st.turn === "user";
  const busy = st.phase === "loading";
  const cardTone =
    st.phase === "show" || st.phase === "answered" || busy
      ? st.kind === "truth"
        ? "tod-card-truth"
        : "tod-card-dare"
      : "tod-card-neutral";

  const scorePill = (who, label) => {
    const active = st.phase !== "over" && st.turn === who;
    const pct = Math.min(100, (st.scores[who] / GOAL) * 100);
    return (
      <div
        className={`flex-1 min-w-0 rounded-2xl border px-3 py-2 transition-all ${
          active ? "border-primary bg-primary/10 shadow-sm" : "border-dark/10 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold text-muted">{label}</span>
          <span className="font-display text-lg font-extrabold text-dark">{st.scores[who]}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-dark/8">
          <div
            className={`h-full rounded-full transition-all duration-500 ${who === "user" ? "bg-primary" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const choiceButtons = (onPick) => (
    <div className="flex w-full flex-wrap justify-center gap-2">
      <button type="button" onClick={() => onPick("truth")} className="tod-btn bg-[#1e88e5]">
        🔵 {t("games.todTruth")}
      </button>
      <button type="button" onClick={() => onPick("dare")} className="tod-btn bg-[#e83322]">
        🔴 {t("games.todDare")}
      </button>
      <button type="button" onClick={() => onPick("random")} className="tod-btn bg-dark">
        🎲 {t("games.todRandom")}
        {mine && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">+1</span>}
      </button>
    </div>
  );

  return (
    <aside className="flex flex-col md:h-full landscape:h-full min-h-0 w-full bg-gradient-to-b from-[#FFF5FA] to-white border-r border-primary/10">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark/8 flex-shrink-0 bg-white/80">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-dark text-sm truncate">🎭 {t("games.todTitle")}</h3>
          <p className="text-muted text-[11px] truncate">{t("games.todSub", { name, goal: GOAL })}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-muted hover:text-dark px-2.5 py-1.5 rounded-lg hover:bg-dark/5"
        >
          {t("games.close")}
        </button>
      </div>

      <div className="flex-1 min-h-0 max-h-[52dvh] md:max-h-none landscape:max-h-none overflow-y-auto scrollbar-thin p-3 space-y-3">
        <div className="flex gap-2">
          {scorePill("user", t("games.you"))}
          {scorePill("ai", name)}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-xl border border-dark/10 bg-white p-0.5">
            {TOD_LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                disabled={busy}
                onClick={() => setLevel(lv)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  level === lv ? "bg-primary text-white shadow-sm" : "text-muted hover:text-dark"
                }`}
              >
                {t(`games.todLevel_${lv}`)}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-muted">
            {t("games.round")} {st.round} · ⏭️ {st.skips}
          </span>
        </div>

        <div key={cardKey} className={`tod-card ${cardTone}`}>
          {st.phase === "over" ? (
            <>
              <div className="text-4xl">{st.winner === "user" ? "🏆" : st.winner === "ai" ? "😏" : "🤝"}</div>
              <p className="tod-tag">{t("games.todGameOver")}</p>
              <p className="tod-text">
                {st.winner === "user"
                  ? t("games.todYouWin")
                  : st.winner === "ai"
                    ? t("games.todTheyWin", { name })
                    : t("games.todDraw")}
              </p>
              <p className="tod-answer">
                {t("games.you")} {st.scores.user} — {name} {st.scores.ai}
              </p>
              <button
                type="button"
                onClick={() => {
                  patch(freshState());
                  const text = announce("todChatStart", null);
                  cbRef.current.onGameEvent?.("start", { text });
                }}
                className="tod-btn bg-primary"
              >
                {t("games.playAgain")}
              </button>
            </>
          ) : st.phase === "choose" ? (
            <>
              <p className="tod-tag">{mine ? t("games.todYourTurn") : t("games.todTheirTurn", { name })}</p>
              <p className="tod-text">{mine ? t("games.todPick") : t("games.todPickForThem", { name })}</p>
              {choiceButtons(mine ? startUserTurn : (c) => startAiTurn(c))}
              {mine && <p className="text-[11px] text-muted">{t("games.todRandomHint")}</p>}
              {!mine && (
                <form
                  className="flex w-full gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (custom.trim()) startAiTurn("truth", custom);
                  }}
                >
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    maxLength={160}
                    placeholder={t("games.todAskOwn", { name })}
                    className="min-w-0 flex-1 rounded-xl border border-dark/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button type="submit" disabled={!custom.trim()} className="tod-btn bg-primary px-3 disabled:opacity-40">
                    {t("games.todAsk")}
                  </button>
                </form>
              )}
            </>
          ) : busy ? (
            <>
              <p className="tod-tag">
                {st.kind === "truth" ? `🔵 ${t("games.todTruth")}` : `🔴 ${t("games.todDare")}`}
              </p>
              {st.prompt && <p className="tod-text">{st.prompt}</p>}
              <div className="flex items-center gap-1.5 py-2">
                <span className="tod-dot" />
                <span className="tod-dot [animation-delay:.15s]" />
                <span className="tod-dot [animation-delay:.3s]" />
              </div>
              <p className="text-[12px] text-muted">
                {mine ? t("games.todThinkingQ", { name }) : t("games.todThinkingA", { name })}
              </p>
            </>
          ) : st.phase === "show" ? (
            <>
              <div className="flex items-center gap-2">
                <p className="tod-tag">
                  {st.kind === "truth" ? `🔵 ${t("games.todTruth")}` : `🔴 ${t("games.todDare")}`}
                </p>
                {st.random && <span className="rounded-full bg-dark px-2 py-0.5 text-[10px] font-bold text-white">🎲 +1</span>}
                {st.kind === "dare" && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${timeLeft ? "bg-white text-[#e83322]" : "bg-[#e83322] text-white"}`}>
                    ⏱ {timeLeft ? `${timeLeft}s` : t("games.todTimeUp")}
                  </span>
                )}
              </div>
              <p className="tod-text">{st.prompt}</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                maxLength={400}
                placeholder={st.kind === "truth" ? t("games.todAnswerPh") : t("games.todDarePh", { name })}
                className="w-full resize-none rounded-xl border border-dark/10 bg-white/90 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="flex w-full flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={submitUser}
                  disabled={st.kind === "truth" && !draft.trim()}
                  className="tod-btn bg-[#2e7d32] disabled:opacity-40"
                >
                  {st.kind === "truth" ? t("games.todSendAnswer") : t("games.todDone")} · +{POINTS[st.kind] + (st.random ? 1 : 0)}
                </button>
                <button type="button" onClick={skipUser} disabled={st.skips <= 0} className="tod-btn bg-[#757575] disabled:opacity-40">
                  {t("games.todSkip", { left: st.skips })}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="tod-tag">
                {st.kind === "truth" ? `🔵 ${t("games.todTruth")}` : `🔴 ${t("games.todDare")}`} · {name}
              </p>
              <p className="tod-text">{st.prompt}</p>
              <p className="tod-answer">💬 {st.answer}</p>
              <p className="text-[12px] font-semibold text-dark">{t("games.todRate", { name })}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[0, 1, 2, 3].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => rate(h)}
                    className="rounded-xl border border-dark/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-105"
                  >
                    {h ? "❤️".repeat(h) : "😐"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {st.phase !== "over" && (
          <div className="text-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => finish(st.scores)}
              className="text-[12px] font-semibold text-muted underline-offset-2 hover:underline disabled:opacity-40"
            >
              {t("games.todEnd")}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
