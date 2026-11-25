import { useEffect, useLayoutEffect, useRef } from "react";
import { mountSnakeLadder, SNAKE_LADDER_COLORS } from "../data/snakeLadderEngine";
import { useI18n } from "../i18n/LanguageContext";

export default function SnakesLaddersGame({ open, character, onClose, onAnnounce, onStatus, onGameEvent }) {
  const { t } = useI18n();
  const hostRef = useRef(null);
  const tRef = useRef(t);
  const announceRef = useRef(onAnnounce);
  const statusRef = useRef(onStatus);
  const eventRef = useRef(onGameEvent);
  const lastStartRef = useRef(0);

  useLayoutEffect(() => {
    tRef.current = t;
    announceRef.current = onAnnounce;
    statusRef.current = onStatus;
    eventRef.current = onGameEvent;
  });

  const name = character?.name || "";

  useEffect(() => {
    if (!open || !hostRef.current) return undefined;
    const say = (key, actor, vars) => {
      const line = tRef.current(key, { name, ...vars });
      announceRef.current?.(line, { actor });
      return line;
    };

    const game = mountSnakeLadder(hostRef.current, {
      aiName: name,
      text: (key, vars) => tRef.current(`games.${key}`, vars),
      onMessage: (msg) => statusRef.current?.(msg),
      onEvent: (type, data) => {
        const you = (data.winner || data.by) === "user";
        const actor = type === "start" ? null : you ? "user" : "ai";
        let text;
        if (type === "start") {
          const now = Date.now();
          if (now - lastStartRef.current < 1500) return;
          lastStartRef.current = now;
          text = say("games.slChatStart", actor);
        } else if (type === "snake") {
          text = say(you ? "games.slChatYouSnake" : "games.slChatTheySnake", actor, { to: data.to });
        } else if (type === "ladder") {
          text = say(you ? "games.slChatYouLadder" : "games.slChatTheyLadder", actor, { to: data.to });
        } else if (type === "win") {
          text = say(you ? "games.slChatYouWin" : "games.slChatTheyWin", actor);
        } else if (type === "turn") {
          const key = data.stuck
            ? you ? "feedYouNoMove" : "feedAiNoMove"
            : you ? "feedYouRollTo" : "feedAiRollTo";
          text = say(`games.${key}`, actor, { value: data.value, to: data.to });
        } else {
          return;
        }
        eventRef.current?.(type, { ...data, text });
      },
    });
    return () => {
      game.destroy();
      statusRef.current?.("");
    };
  }, [open, name]);

  if (!open || !character) return null;

  return (
    <aside className="flex flex-col md:h-full landscape:h-full min-h-0 w-full bg-gradient-to-b from-[#F3FBFA] to-white border-r border-primary/10">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark/8 flex-shrink-0 bg-white/80">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-dark text-sm truncate">{t("games.snakesTitle")}</h3>
          <p className="text-muted text-[11px] truncate">{t("games.ludoSub", { name })}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-muted hover:text-dark px-2.5 py-1.5 rounded-lg hover:bg-dark/5"
        >
          {t("games.close")}
        </button>
      </div>

      <div className="hidden md:flex items-center justify-center gap-4 px-3 pt-2 text-[11px] font-semibold text-dark flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="game-dot" style={{ background: SNAKE_LADDER_COLORS.user }} />
          {t("games.you")}
        </span>
        <span className="text-muted">{t("games.vsLabel")}</span>
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="game-dot" style={{ background: SNAKE_LADDER_COLORS.ai }} />
          <span className="truncate max-w-[9rem]">{name}</span>
        </span>
      </div>

      <div ref={hostRef} className="board-game md:flex-1 landscape:flex-1 min-h-0" />
    </aside>
  );
}
