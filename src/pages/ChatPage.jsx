import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import SuggestionPopup from "../components/SuggestionPopup";
import SnakesLaddersGame from "../components/SnakesLaddersGame";
import LudoGame from "../components/LudoGame";
import TruthDareGame from "../components/TruthDareGame";
import { getCharacterById, photoShareCount, nextPhotoShare, isPhotoFollowUpAsk, countPhotoAsksSinceLastImage, isPhotoRequest, isPhotoShareNudge, hasPendingPhotoContext, PHOTO_TEASE_BEFORE_SHARE } from "../data/characters";
import { generateCharacterPhoto } from "../services/characterPhoto";
import { getMood } from "../data/moods";
import { isFavorite, toggleFavorite } from "../data/favorites";
import { loadChat, saveChat, clearChat } from "../data/chatHistory";
import {
  getUserProfile,
  setUserProfile,
  getDisplayName,
  extractProfileHints,
  buildIntroGreeting,
} from "../data/userProfile";
import { getActiveUserId } from "../data/accounts";
import {
  sendChatMessage,
  fetchConversationSuggestions,
  createSpeechRecognition,
  stopSpeaking,
  speakText,
} from "../services/api";
import { getCharacterVoiceOpts } from "../data/voiceTone";
import { getMyHuman } from "../services/roomSync";
import { playSendSound, playReceiveSound, playTypingSound } from "../utils/sounds";
import { pickIdleGameNudge, IDLE_NUDGE_MS } from "../data/idleNudges";
import {
  BORING_STREAK_FOR_GAMES,
  countBoringUserStreak,
  recentlyOfferedGames,
  isGamePlayIntent,
  isGamesInviteAccept,
} from "../data/gameOffer";
import { useVisibleIdleTimer } from "../hooks/useVisibleIdleTimer";
import { useVisualViewportHeight } from "../hooks/useVisualViewportHeight";
import { useI18n } from "../i18n/LanguageContext";
import { stopAllPreviewVideos } from "../utils/previewMedia";
import { localizeCharacter } from "../i18n/localeHelpers";
import { getPhotoReactPrompt } from "../data/chatLanguage";
import { humanReplyDelayMs, waitHumanReplyPace } from "../utils/chatPace";
import { canStartChat } from "../data/companionStatus";
import { isBlockedReply } from "../data/contentModeration";

const GAME_LABEL = { ludo: "Ludo", snakes: "Snakes & Ladders", tod: "Truth or Dare" };
const BANTER_PRIORITY = { chat: 0, turn: 1, start: 2, special: 3, win: 4 };
const BANTER_GAP_MS = { chat: 0, turn: 6000, start: 0, special: 2500, win: 0 };
const GAME_CHATTER_IDLE_MS = 20000;
const GAME_NOTE =
  "(Game update — NOT typed by the user. Reply in character with one or two short, natural chat sentences in the chat language. " +
  "No rules, no narration, no stage directions, no quotes. Never repeat something you already said. " +
  "This is a friendly board game — nothing about it is violence, so never refuse or mention safety, guns or violence.)";
const KEEP_TALKING =
  "Then keep the conversation flowing like a real chat: answer what the user last said if they said something, " +
  "otherwise ask them a light, flirty or personal question.";
const GAME_EVENT_HINTS = {
  start: "You and the user just started a new game together. Kick it off with a flirty challenge.",
  userTurn: "The user just played their turn. Comment briefly on it (lucky, unlucky, slow, who's ahead) in your own style.",
  aiTurn: "You just played your turn. Comment briefly on your own move in your own style.",
  userCapture: "The user just captured one of your pieces and sent it home. Pout and promise playful revenge.",
  aiCapture: "You just captured one of the user's pieces and sent it home. Tease them.",
  userSnake: "A snake just bit the user and they slid down. Tease them playfully.",
  aiSnake: "A snake just bit you and you slid down. Pout about it.",
  userLadder: "The user just climbed a ladder. Be impressed but competitive.",
  aiLadder: "You just climbed a ladder. Brag cheekily.",
  userWin: "The user just won the game. Congratulate them sweetly, a little salty, and ask for a rematch.",
  aiWin: "You just won the game. Celebrate cheekily and offer a rematch.",
  chat: "The board has been quiet for a bit. Don't only talk about the game — bring up something fun or personal.",
};

function banterKind(type) {
  if (type === "chat" || type === "turn" || type === "start" || type === "win") return type;
  return "special";
}

function buildGamePrompt(game, type, data = {}) {
  const actor = type === "win" ? data.winner : data.by;
  const key =
    type === "start" || type === "chat" ? type : `${actor === "user" ? "user" : "ai"}${type[0].toUpperCase()}${type.slice(1)}`;
  const hint = GAME_EVENT_HINTS[key];
  if (!hint) return null;
  const latest = data.text ? ` Latest on the board: "${data.text}".` : "";
  const tail = type === "win" ? "" : ` ${KEEP_TALKING}`;
  return `${GAME_NOTE} Game: ${GAME_LABEL[game] || game}.${latest} ${hint}${tail}`;
}

export default function ChatPage() {
  const { setLanguage, lang, t } = useI18n();
  useVisualViewportHeight(true);
  const { characterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const rawCharacter = getCharacterById(characterId);
  const character = useMemo(
    () => (rawCharacter ? localizeCharacter(rawCharacter, lang, t) : null),
    [rawCharacter, lang, t]
  );

  useEffect(() => {
    if (!rawCharacter) return;
    if (!canStartChat(rawCharacter)) {
      navigate("/pick", { replace: true, state: { busy: true } });
    }
  }, [rawCharacter, navigate]);

  const mood = getMood();
  const myId = getActiveUserId();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fav, setFav] = useState(() => (character ? isFavorite(character.id) : false));
  const [todOpen, setTodOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSuggestions, setPopupSuggestions] = useState([]);
  const [resumed, setResumed] = useState(false);
  const [askResume, setAskResume] = useState(false);
  const [resumePreview, setResumePreview] = useState(null);
  const [snakesOpen, setSnakesOpen] = useState(false);
  const [ludoOpen, setLudoOpen] = useState(false);
  const [userProfile, setUserProfileState] = useState(() => getUserProfile());

  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const hasGreetedRef = useRef(false);
  const chunkTimersRef = useRef([]);
  const typingSoundRef = useRef(null);
  const photosSharedRef = useRef(0);
  const photoAsksSinceShareRef = useRef(0);
  const readyToSaveRef = useRef(false);
  const messagesRef = useRef(messages);
  const busyRef = useRef(false);
  const pendingQueueRef = useRef([]);
  const pendingSavedRef = useRef(null);
  const lastRepliedUserMsgIdRef = useRef("");
  const runAssistantTurnRef = useRef(null);
  const idleNudgedForRef = useRef(null);
  const liveRef = useRef(true);
  const askResumeRef = useRef(false);
  const snakesOpenRef = useRef(false);
  const ludoOpenRef = useRef(false);
  askResumeRef.current = askResume;
  snakesOpenRef.current = snakesOpen;
  const todOpenRef = useRef(false);
  todOpenRef.current = todOpen;
  ludoOpenRef.current = ludoOpen;
  const gameStatusRef = useRef("");
  const lastGameReactRef = useRef(0);
  const lastChatAtRef = useRef(0);
  const pendingBanterRef = useRef(null);
  const banterTimerRef = useRef(null);
  const pumpBanterRef = useRef(null);

  const voiceOpts = useMemo(
    () => getCharacterVoiceOpts(character, lang),
    [character, lang]
  );
  const { arm: armIdleNudge, disarm: disarmIdleNudge } = useVisibleIdleTimer();

  const handleBack = () => {
    liveRef.current = false;
    disarmIdleNudge();
    stopSpeaking();
    recognitionRef.current?.abort();
    if (location.key !== "default") navigate(-1);
    else navigate("/pick");
  };

  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
      disarmIdleNudge();
      stopSpeaking();
      clearInterval(typingSoundRef.current);
      chunkTimersRef.current.forEach(clearTimeout);
      chunkTimersRef.current = [];
      recognitionRef.current?.abort();
    };
  }, [disarmIdleNudge]);

  useEffect(() => {
    stopAllPreviewVideos();
  }, []);

  useEffect(() => {
    const onSpeechStop = () => {
      setIsSpeaking(false);
      chunkTimersRef.current.forEach(clearTimeout);
      chunkTimersRef.current = [];
    };
    window.addEventListener("yallo:speech-stop", onSpeechStop);
    return () => window.removeEventListener("yallo:speech-stop", onSpeechStop);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!character) { navigate("/pick"); return; }

    readyToSaveRef.current = false;
    hasGreetedRef.current = false;
    setError(null);
    stopSpeaking();
    setIsSpeaking(false);
    setFav(isFavorite(character.id));
    setTodOpen(false);
    setPopupOpen(false);

    const saved = loadChat(character.id);

    if (saved?.messages?.length) {
      pendingSavedRef.current = saved;
      const last = [...saved.messages].reverse().find((m) => String(m.content || "").trim());
      setResumePreview({
        text: String(last?.content || "Photo").replace(/\s+/g, " ").trim().slice(0, 90),
        count: saved.messages.length,
        updatedAt: saved.updatedAt || "",
      });
      setAskResume(true);
      setMessages([]);
      setResumed(false);
      hasGreetedRef.current = true;
      setIsTyping(false);
      readyToSaveRef.current = false;
      return () => {
        stopSpeaking();
        setIsSpeaking(false);
        chunkTimersRef.current.forEach(clearTimeout);
        chunkTimersRef.current = [];
        recognitionRef.current?.abort();
      };
    }

    pendingSavedRef.current = null;
    setAskResume(false);
    setResumePreview(null);
    setResumed(false);
    photosSharedRef.current = 0;
    photoAsksSinceShareRef.current = 0;
    setMessages([]);
    setIsTyping(true);
    typingSoundRef.current = setInterval(playTypingSound, 280);

    // Human-like delay: 2.5–4.5s before first message
    const greetDelay = 2500 + Math.random() * 2000;
    const greetingTimer = setTimeout(() => {
      if (hasGreetedRef.current) return;
      hasGreetedRef.current = true;

      const greetingText = buildIntroGreeting(character, getUserProfile());
      const greeting = {
        id: Date.now(),
        role: "assistant",
        content: greetingText,
        timestamp: new Date().toISOString(),
      };
      readyToSaveRef.current = true;
      busyRef.current = true;

      speakText(
        greetingText,
        () => {
          setIsSpeaking(false);
          busyRef.current = false;
          const rest = pendingQueueRef.current.splice(0);
          if (rest.length) {
            const combined = rest
              .map((q) => (q.speakerName ? `${q.speakerName} said: ${q.text}` : q.text))
              .join("\n");
            const who = rest[rest.length - 1]?.speakerName || "";
            runAssistantTurnRef.current?.(combined, messagesRef.current, who);
          }
        },
        voiceOpts,
        {
          onStart: () => {
            clearInterval(typingSoundRef.current);
            setIsTyping(false);
            setMessages((prev) => {
              if (prev.some((m) => m.id === greeting.id)) return prev;
              return [...prev, greeting];
            });
            playReceiveSound();
            setIsSpeaking(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          },
        }
      );
    }, greetDelay);

    return () => {
      clearTimeout(greetingTimer);
      clearInterval(typingSoundRef.current);
      stopSpeaking();
      setIsSpeaking(false);
      chunkTimersRef.current.forEach(clearTimeout);
      chunkTimersRef.current = [];
      recognitionRef.current?.abort();
    };
  }, [characterId]);

  useEffect(() => {
    if (!character || !readyToSaveRef.current || !messages.length) return;
    saveChat(character.id, messages, photosSharedRef.current);
  }, [messages, character]);

  const loadPopupSuggestions = async (history) => {
    setPopupLoading(true);
    setPopupOpen(true);
    try {
      const list = await fetchConversationSuggestions(character.name, history, mood, lang);
      setPopupSuggestions(list);
    } catch {
      setPopupSuggestions([
        t("chat.tellMore"),
        t("chat.cuteKeep"),
        t("chat.yourTurn"),
      ]);
    } finally {
      setPopupLoading(false);
    }
  };

  const speakSynced = (fullText, opts, { onReveal } = {}) =>
    new Promise((resolve) => {
      if (!fullText?.trim()) {
        onReveal?.();
        resolve();
        return;
      }
      chunkTimersRef.current.forEach(clearTimeout);
      chunkTimersRef.current = [];
      let revealed = false;
      let settled = false;
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        onReveal?.();
        setIsSpeaking(true);
      };
      const finish = () => {
        if (settled) return;
        settled = true;
        setIsSpeaking(false);
        reveal();
        resolve();
      };
      speakText(
        fullText,
        finish,
        opts || voiceOpts,
        { onStart: reveal }
      );
      const safetyReveal = setTimeout(reveal, 10000);
      const hangMs = Math.min(120000, Math.max(60000, String(fullText).length * 100));
      const hang = setTimeout(finish, hangMs);
      chunkTimersRef.current.push(safetyReveal, hang);
    });

  const deliverIdleGameNudge = async () => {
    if (!liveRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (!character) return;
    if (busyRef.current || askResumeRef.current) return;
    if (snakesOpenRef.current || ludoOpenRef.current || todOpenRef.current) return;

    const msgs = messagesRef.current;
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "assistant") return;
    if (idleNudgedForRef.current === last.id) return;
    idleNudgedForRef.current = last.id;

    const text = pickIdleGameNudge(lang);
    const aiMsg = {
      id: Date.now(),
      role: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
    };

    busyRef.current = true;
    setIsTyping(true);
    typingSoundRef.current = setInterval(playTypingSound, 320);
    try {
      await speakSynced(text, voiceOpts, {
        onReveal: () => {
          if (!liveRef.current) return;
          clearInterval(typingSoundRef.current);
          setIsTyping(false);
          setMessages((prev) => [...prev, aiMsg]);
          playReceiveSound();
        },
      });
    } catch {
      if (!liveRef.current) return;
      clearInterval(typingSoundRef.current);
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      clearInterval(typingSoundRef.current);
      if (liveRef.current) setIsTyping(false);
      busyRef.current = false;
    }
  };

  const deliverGamesOffer = async (kind = "bored") => {
    const text =
      kind === "request" ? t("chat.gamesOptionsIntro") : t("chat.gamesBoredOffer");
    const aiMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: text,
      gamesOffer: true,
      timestamp: new Date().toISOString(),
    };
    await speakSynced(text, voiceOpts, {
      onReveal: () => {
        clearInterval(typingSoundRef.current);
        setIsTyping(false);
        setMessages((prev) => {
          const next = [...prev, aiMsg];
          messagesRef.current = next;
          return next;
        });
        playReceiveSound();
      },
    });
  };

  useEffect(() => {
    disarmIdleNudge();
    if (!liveRef.current || askResume || !character) return disarmIdleNudge;
    if (snakesOpen || ludoOpen || todOpen) return disarmIdleNudge;
    if (busyRef.current || isTyping || isSpeaking) return disarmIdleNudge;

    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") {
      idleNudgedForRef.current = null;
      return disarmIdleNudge;
    }
    if (idleNudgedForRef.current === last.id) return disarmIdleNudge;

    armIdleNudge(IDLE_NUDGE_MS, deliverIdleGameNudge);
    return disarmIdleNudge;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTyping, isSpeaking, askResume, snakesOpen, ludoOpen, todOpen, character]);

  const appendMessage = (msg) => {
    if (msg.role !== "system") lastChatAtRef.current = Date.now();
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      messagesRef.current = next;
      return next;
    });
  };

  const toApiHistory = (list, me = getMyHuman()) => {
    const recent = list.slice(-40).filter((m) => m.content);
    const keepGame = new Set(
      recent.map((m, i) => (m.role === "system" ? i : -1)).filter((i) => i >= 0).slice(-3)
    );
    return recent
      .filter((m, i) => m.role !== "system" || keepGame.has(i))
      .slice(-12)
      .map((m) => {
        if (m.role === "system") return { role: "user", content: `(Game update, not typed by anyone: ${m.content})` };
        if (m.role !== "user") return { role: m.role, content: m.content };
        const body = m.image && !m.content ? "[shared a photo]" : m.image ? `${m.content} [also shared a photo]` : m.content;
        return { role: "user", content: `[${m.senderName || me.name || "Someone"}]: ${body}` };
      });
  };

  const chatOptions = () => ({
    mood,
    truthOrDare: todOpenRef.current,
    activeGame: ludoOpenRef.current
      ? { id: "ludo", status: gameStatusRef.current }
      : snakesOpenRef.current
        ? { id: "snakes", status: gameStatusRef.current }
        : null,
    userProfile: getUserProfile(),
    chatLanguage: lang,
  });

  const appendAssistantReply = async (userText, nextHistory, { imageNote = false, speakerName = "" } = {}) => {
    const paceStarted = Date.now();
    const paceMs = humanReplyDelayMs();

    if (character && isPhotoRequest(userText, nextHistory) && !imageNote) {
      await waitHumanReplyPace(paceStarted, paceMs);

      const fromHistory = Math.max(0, countPhotoAsksSinceLastImage(nextHistory) - 1);
      let askIndex = Math.max(photoAsksSinceShareRef.current, fromHistory);
      // After first photo ask + tease, any share/send/dekhna nudge → share now
      if (isPhotoShareNudge(userText) && hasPendingPhotoContext(nextHistory)) {
        askIndex = Math.max(askIndex, PHOTO_TEASE_BEFORE_SHARE);
      }
      const share = nextPhotoShare(
        character,
        photosSharedRef.current,
        photoShareCount(userText),
        lang,
        askIndex,
        {
          followUp:
            isPhotoFollowUpAsk(userText) ||
            (isPhotoShareNudge(userText) && photosSharedRef.current > 0),
        }
      );
      photoAsksSinceShareRef.current = askIndex + 1;

      // Second ask (and later): generate a new face-locked selfie from ChatGPT
      let finalShare = share;
      if (!share.tease && (character.image || character.avatar)) {
        try {
          setIsTyping(true);
          const generated = await generateCharacterPhoto(character, userText, lang);
          if (generated?.moderated) {
            finalShare = {
              content: generated.content,
              image: null,
              images: [],
              speak: generated.speak || generated.content,
            };
          } else if (generated?.image) {
            finalShare = generated;
          }
        } catch (err) {
          console.warn("[photo-gen] fallback to gallery:", err?.message || err);
          // Keep gallery image, but make the caption honest when AI gen is down
          if (err?.quota && share?.image) {
            finalShare = {
              ...share,
              content:
                lang === "fr"
                  ? "Ma caméra AI est un peu fatiguée… tiens, celle-ci pour toi 😘"
                  : lang === "es"
                    ? "Mi cámara AI está un poco cansada… toma esta por ahora 😘"
                    : "My AI camera's a little tired… here's one for you for now 😘",
            };
          }
        }
      }

      const attached = finalShare.images?.length || (finalShare.image ? 1 : 0);
      if (attached) {
        photosSharedRef.current += attached;
        photoAsksSinceShareRef.current = 0;
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: finalShare.content,
        image: finalShare.image || undefined,
        images: finalShare.images?.length ? finalShare.images : undefined,
        timestamp: new Date().toISOString(),
      };
      await speakSynced(finalShare.speak || finalShare.content, voiceOpts, {
        onReveal: () => {
          clearInterval(typingSoundRef.current);
          setIsTyping(false);
          appendMessage(aiMsg);
          playReceiveSound();
        },
      });
      return;
    }

    // User asks to play / accepts games invite → always show options
    if (
      !imageNote &&
      !snakesOpenRef.current &&
      !ludoOpenRef.current &&
      !todOpenRef.current &&
      (isGamesInviteAccept(userText, nextHistory) || isGamePlayIntent(userText))
    ) {
      await waitHumanReplyPace(paceStarted, paceMs);
      await deliverGamesOffer("request");
      return;
    }

    // 5+ boring short replies in a row → offer games with options
    if (
      !imageNote &&
      !snakesOpenRef.current &&
      !ludoOpenRef.current &&
      !todOpenRef.current &&
      countBoringUserStreak(nextHistory) >= BORING_STREAK_FOR_GAMES &&
      !recentlyOfferedGames(nextHistory)
    ) {
      await waitHumanReplyPace(paceStarted, paceMs);
      await deliverGamesOffer("bored");
      return;
    }

    const me = getMyHuman();
    const people = [me];

    const history = toApiHistory(nextHistory, me);

    const prompt = imageNote
      ? userText || getPhotoReactPrompt(lang)
      : userText;

    const data = await sendChatMessage(prompt, characterId, history.slice(0, -1), {
      ...chatOptions(),
      people,
      speakerName: speakerName || me.name,
    });
    await waitHumanReplyPace(paceStarted, paceMs);
    const claimedPhoto = /\[image attached\]|image attached|here's (a |my )?(pic|photo|selfie)|sending (you )?(a )?(pic|photo)|check this (pic|photo)|aqu[ií] (est[aá]|va) (mi |una )?(foto|imagen)|te mando (una )?(foto|imagen)|mira esta foto|voici (ma |une )?(photo|image)|je t['']envoie (une )?(photo|image)/i.test(data.reply || "");
    let attached;
    if (claimedPhoto && character) {
      const fromHistory = Math.max(0, countPhotoAsksSinceLastImage(nextHistory) - (isPhotoRequest(userText, nextHistory) ? 1 : 0));
      const askIndex = Math.max(photoAsksSinceShareRef.current, fromHistory);
      attached = nextPhotoShare(
        character,
        photosSharedRef.current,
        1,
        lang,
        askIndex,
        {
          followUp:
            isPhotoFollowUpAsk(userText) ||
            (isPhotoShareNudge(userText) && photosSharedRef.current > 0),
        }
      );
      photoAsksSinceShareRef.current = askIndex + 1;
      if (attached.image) {
        photosSharedRef.current += attached.images?.length || 1;
        photoAsksSinceShareRef.current = 0;
      }
      if (attached.tease && !attached.image) {
        data.reply = attached.content;
      } else if (attached?.image) {
        data.reply = attached.content;
      }
    }
    const aiMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: data.reply,
      image: attached?.image || undefined,
      images: attached?.images?.length ? attached.images : undefined,
      timestamp: new Date().toISOString(),
    };
    await speakSynced(data.reply, voiceOpts, {
      onReveal: () => {
        clearInterval(typingSoundRef.current);
        setIsTyping(false);
        appendMessage(aiMsg);
        playReceiveSound();
      },
    });
  };

  const applyProfileHints = (text) => {
    const hints = extractProfileHints(text);
    if (!hints.name && !hints.nickname && !hints.place) return;
    const next = setUserProfile(hints);
    setUserProfileState(next);
  };

  const handleNicknameSave = (nickname) => {
    const next = setUserProfile({ nickname: String(nickname || "").trim() });
    setUserProfileState(next);
  };

  const handleLanguageChange = (nextLang) => {
    setLanguage(nextLang);
    setUserProfileState(getUserProfile());
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    idleNudgedForRef.current = null;
    disarmIdleNudge();
    setError(null);
    setPopupOpen(false);
    setResumed(false);
    playSendSound();
    applyProfileHints(msg);

    const me = getMyHuman();
    const userMsg = {
      id: Date.now() + Math.random(),
      role: "user",
      content: msg,
      senderId: me.id,
      senderName: me.name,
      senderAvatar: me.avatar,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messagesRef.current, userMsg];
    messagesRef.current = nextHistory;
    lastChatAtRef.current = Date.now();
    setMessages(nextHistory);
    setInput("");
    lastRepliedUserMsgIdRef.current = userMsg.id;

    if (busyRef.current) {
      pendingQueueRef.current.push({ text: msg, speakerName: me.name });
      return;
    }

    await runAssistantTurn(msg, nextHistory, me.name);
  };

  const runAssistantTurn = async (msg, history, speakerName = "") => {
    busyRef.current = true;
    setIsTyping(true);
    typingSoundRef.current = setInterval(playTypingSound, 300 + Math.random() * 200);
    try {
      await appendAssistantReply(msg, history, { speakerName });
    } catch (err) {
      setError(err.message || t("chat.checkKey"));
    } finally {
      await finishTurn();
    }
  };
  runAssistantTurnRef.current = runAssistantTurn;

  const finishTurn = async () => {
    clearInterval(typingSoundRef.current);
    setIsTyping(false);
    busyRef.current = false;
    lastGameReactRef.current = Date.now();
    const rest = pendingQueueRef.current.splice(0);
    if (rest.length) {
      const combined = rest
        .map((q) => (q.speakerName ? `${q.speakerName} said: ${q.text}` : q.text))
        .join("\n");
      const who = rest[rest.length - 1]?.speakerName || "";
      await runAssistantTurn(combined, messagesRef.current, who);
    } else {
      setTimeout(() => inputRef.current?.focus(), 80);
      if (pendingBanterRef.current) {
        clearTimeout(banterTimerRef.current);
        banterTimerRef.current = setTimeout(() => pumpBanterRef.current?.(), 1200);
      }
    }
  };

  const reactToGame = (game, type, data = {}) => {
    const kind = banterKind(type);
    const cur = pendingBanterRef.current;
    if (cur && BANTER_PRIORITY[cur.kind] > BANTER_PRIORITY[kind]) return;
    pendingBanterRef.current = { game, type, data, kind };
    pumpBanter();
  };

  const pumpBanter = () => {
    clearTimeout(banterTimerRef.current);
    const ev = pendingBanterRef.current;
    if (!ev || !liveRef.current || !character) return;
    if (busyRef.current) return;
    const composing = Boolean(inputRef.current?.value?.trim());
    const wait = composing && ev.kind !== "win"
      ? 2500
      : lastGameReactRef.current + BANTER_GAP_MS[ev.kind] - Date.now();
    if (wait > 0) {
      banterTimerRef.current = setTimeout(() => pumpBanterRef.current?.(), wait);
      return;
    }
    pendingBanterRef.current = null;
    runGameBanter(ev);
  };
  pumpBanterRef.current = pumpBanter;

  const runGameBanter = async ({ game, type, data }) => {
    const note = buildGamePrompt(game, type, data);
    if (!note) return;
    busyRef.current = true;
    setIsTyping(true);
    typingSoundRef.current = setInterval(playTypingSound, 320);
    try {
      const res = await sendChatMessage(note, characterId, toApiHistory(messagesRef.current), chatOptions());
      if (!res?.reply || res.moderated || res.fallback || isBlockedReply(res.reply) || !liveRef.current) return;
      const aiMsg = {
        id: Date.now() + Math.random(),
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toISOString(),
      };
      await speakSynced(res.reply, voiceOpts, {
        onReveal: () => {
          clearInterval(typingSoundRef.current);
          setIsTyping(false);
          appendMessage(aiMsg);
          playReceiveSound();
        },
      });
    } catch (err) {
      console.warn("[game-banter]", err?.message || err);
    } finally {
      await finishTurn();
    }
  };

  const handleSendImage = async (imageDataUrl, caption = "") => {
    if (!imageDataUrl) return;
    idleNudgedForRef.current = null;
    disarmIdleNudge();
    setError(null);
    setPopupOpen(false);
    setResumed(false);
    playSendSound();

    const me = getMyHuman();
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: caption.trim(),
      image: imageDataUrl,
      senderId: me.id,
      senderName: me.name,
      senderAvatar: me.avatar,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    setIsTyping(true);
    typingSoundRef.current = setInterval(playTypingSound, 300 + Math.random() * 200);

    try {
      const note = getPhotoReactPrompt(lang, { caption });
      await appendAssistantReply(note, nextHistory, { imageNote: true });
    } catch (err) {
      setError(err.message || t("chat.checkKey"));
    } finally {
      clearInterval(typingSoundRef.current);
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = createSpeechRecognition(getUserProfile(), lang);
    if (!recognition) {
      setError(t("chat.speechUnsupported"));
      return;
    }
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => handleSend(transcript), 300);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const loadPreviousChat = () => {
    const saved = pendingSavedRef.current;
    setAskResume(false);
    setResumePreview(null);
    if (!saved?.messages?.length || !character) return;
    photosSharedRef.current = saved.photosShared || 0;
    photoAsksSinceShareRef.current = 0;
    setMessages(saved.messages);
    setResumed(true);
    hasGreetedRef.current = true;
    setIsTyping(false);
    readyToSaveRef.current = true;
    const lastUser = [...saved.messages].reverse().find((m) => m.role === "user");
    if (lastUser?.id) lastRepliedUserMsgIdRef.current = lastUser.id;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClear = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setPopupOpen(false);
    setResumed(false);
    setAskResume(false);
    idleNudgedForRef.current = null;
    disarmIdleNudge();
    photosSharedRef.current = 0;
    photoAsksSinceShareRef.current = 0;
    hasGreetedRef.current = true;
    readyToSaveRef.current = true;
    clearChat(character.id);
    const greetingText = buildIntroGreeting(character, getUserProfile());
    const greeting = {
      id: Date.now(),
      role: "assistant",
      content: greetingText,
      timestamp: new Date().toISOString(),
    };
    setIsTyping(true);
    setError(null);
    speakText(
      greetingText,
      () => {
        setIsSpeaking(false);
        setIsTyping(false);
      },
      voiceOpts,
      {
        onStart: () => {
          setIsTyping(false);
          setMessages([greeting]);
          playReceiveSound();
          setIsSpeaking(true);
        },
      }
    );
  };

  const startFreshFromChoice = () => {
    pendingSavedRef.current = null;
    setAskResume(false);
    setResumePreview(null);
    handleClear();
  };

  const speakInChunks = (fullText, opts) => {
    speakSynced(fullText, opts);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    chunkTimersRef.current.forEach(clearTimeout);
    chunkTimersRef.current = [];
    setIsSpeaking(false);
  };

  const toggleFav = () => {
    const next = toggleFavorite(character.id);
    setFav(next.includes(character.id));
  };

  const askCharacter = (note) =>
    new Promise((resolve) => {
      (async () => {
        for (let i = 0; i < 60 && busyRef.current && liveRef.current; i++) {
          await new Promise((r) => setTimeout(r, 500));
        }
        if (!liveRef.current || busyRef.current) return resolve(null);
        busyRef.current = true;
        setIsTyping(true);
        typingSoundRef.current = setInterval(playTypingSound, 320);
        try {
          const res = await sendChatMessage(note, characterId, toApiHistory(messagesRef.current), chatOptions());
          const text = String(res?.reply || "").trim();
          if (!text || res.moderated || res.fallback || isBlockedReply(text) || !liveRef.current) return resolve(null);
          const aiMsg = { id: Date.now() + Math.random(), role: "assistant", content: text, timestamp: new Date().toISOString() };
          await speakSynced(text, voiceOpts, {
            onReveal: () => {
              clearInterval(typingSoundRef.current);
              setIsTyping(false);
              appendMessage(aiMsg);
              playReceiveSound();
              resolve(text);
            },
          });
          resolve(text);
        } catch (err) {
          console.warn("[tod]", err?.message || err);
          resolve(null);
        } finally {
          await finishTurn();
        }
      })();
    });

  const openIdeas = () => {
    if (messages.length < 1) return;
    loadPopupSuggestions(messages.map((m) => ({ role: m.role, content: m.content || "[photo]" })));
  };

  const addSystemLine = (content, { speak = false, actor = null, game = false } = {}) => {
    const msg = {
      id: Date.now() + Math.random(),
      role: "system",
      content,
      actor,
      game,
      timestamp: new Date().toISOString(),
    };
    appendMessage(msg);
    if (speak) speakInChunks(content.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim(), voiceOpts);
  };

  const openSnakes = () => {
    setLudoOpen(false);
    setTodOpen(false);
    setSnakesOpen(true);
  };

  const openLudo = () => {
    setSnakesOpen(false);
    setTodOpen(false);
    setLudoOpen(true);
  };

  const openTod = () => {
    setSnakesOpen(false);
    setLudoOpen(false);
    setTodOpen(true);
  };

  const handlePickGame = (id) => {
    if (id === "tod") openTod();
    else if (id === "snakes") openSnakes();
    else if (id === "ludo" || id === "dice") openLudo();
  };

  const gameOpen = snakesOpen || ludoOpen || todOpen;

  useEffect(() => {
    if (!gameOpen) return undefined;
    lastChatAtRef.current = Date.now();
    const iv = setInterval(() => {
      if (busyRef.current) return;
      if (pendingBanterRef.current) {
        pumpBanterRef.current?.();
        return;
      }
      if (!ludoOpenRef.current && !snakesOpenRef.current) return;
      const quietFor = Date.now() - Math.max(lastChatAtRef.current, lastGameReactRef.current);
      if (quietFor < GAME_CHATTER_IDLE_MS) return;
      pendingBanterRef.current = {
        game: ludoOpenRef.current ? "ludo" : "snakes",
        type: "chat",
        data: { text: gameStatusRef.current },
        kind: "chat",
      };
      pumpBanterRef.current?.();
    }, 4000);
    return () => {
      clearInterval(iv);
      clearTimeout(banterTimerRef.current);
      pendingBanterRef.current = null;
    };
  }, [gameOpen]);

  if (!character || !canStartChat(rawCharacter)) return null;

  return (
    <div
      className="chat-vv-shell flex flex-col overflow-hidden hero-bg"
      style={{
        height: "var(--vv-height, 100dvh)",
        maxHeight: "var(--vv-height, 100dvh)",
        top: "var(--vv-offset-top, 0px)",
      }}
    >
      <div
        className={`flex-1 min-h-0 w-full mx-auto flex ${
          gameOpen
            ? "max-w-6xl flex-col md:flex-row landscape:flex-row"
            : "max-w-3xl flex-col"
        }`}
      >
        {gameOpen && (
          <div className="w-full md:w-[48%] landscape:w-[48%] xl:w-[42%] md:h-full landscape:h-full min-h-0 flex-shrink-0 border-b md:border-b-0 landscape:border-b-0 border-primary/10">
            {snakesOpen && (
              <SnakesLaddersGame
                open={snakesOpen}
                character={character}
                onClose={() => setSnakesOpen(false)}
                onStatus={(text) => (gameStatusRef.current = text)}
                onAnnounce={(line, meta) => addSystemLine(line, { ...meta, game: true })}
                onGameEvent={(type, data) => reactToGame("snakes", type, data)}
              />
            )}
            {todOpen && (
              <TruthDareGame
                open={todOpen}
                character={character}
                onClose={() => setTodOpen(false)}
                onAnnounce={(line, meta) => addSystemLine(line, { ...meta, game: true })}
                onGameEvent={(type, data) => reactToGame("tod", type, data)}
                askCharacter={askCharacter}
                onUserAnswer={(text) => handleSend(text)}
              />
            )}
            {ludoOpen && (
              <LudoGame
                open={ludoOpen}
                character={character}
                onClose={() => setLudoOpen(false)}
                onStatus={(text) => (gameStatusRef.current = text)}
                onAnnounce={(line, meta) => addSystemLine(line, { ...meta, game: true })}
                onGameEvent={(type, data) => reactToGame("ludo", type, data)}
              />
            )}
          </div>
        )}

        <div
          className={`min-h-0 min-w-0 flex-1 ${
            gameOpen ? "md:h-full landscape:h-full" : "h-full"
          }`}
        >
          <ChatPanel
            character={character}
            messages={messages}
            isTyping={isTyping}
            isSpeaking={isSpeaking}
            isListening={isListening}
            error={error}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onSendImage={handleSendImage}
            onMicClick={handleVoiceInput}
            onStopSpeaking={handleStopSpeaking}
            onClear={handleClear}
            onBack={handleBack}
            inputRef={inputRef}
            isFavorite={fav}
            onToggleFavorite={toggleFav}
            mood={mood}
            onOpenTod={openTod}
            todActive={todOpen}
            onOpenIdeas={openIdeas}
            resumed={resumed}
            onOpenSnakes={openSnakes}
            onOpenLudo={openLudo}
            onPickGame={handlePickGame}
            split={gameOpen}
            snakesActive={snakesOpen}
            ludoActive={ludoOpen}
            userProfile={userProfile}
            displayName={getDisplayName(userProfile)}
            onSaveNickname={handleNicknameSave}
            chatLanguage={lang}
            onLanguageChange={handleLanguageChange}
            myUserId={myId}
          />
        </div>
      </div>

      <SuggestionPopup
        open={popupOpen}
        suggestions={popupSuggestions}
        loading={popupLoading}
        onPick={(q) => {
          setPopupOpen(false);
          handleSend(q);
        }}
        onClose={() => setPopupOpen(false)}
        onShuffle={() =>
          loadPopupSuggestions(messages.map((m) => ({ role: m.role, content: m.content || "[photo]" })))
        }
      />

      {askResume && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-dark/45 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-slide-up">
            <div className={`h-28 bg-gradient-to-br ${character.color} relative`}>
              {(character.avatar || character.image) && (
                <img
                  src={character.avatar || character.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/70 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 font-display font-bold text-white text-lg">
                {character.name}
              </p>
            </div>
            <div className="p-5">
              <p className="font-display font-bold text-dark text-lg">{t("chat.loadPrevious")}</p>
              <p className="text-muted text-sm mt-1">
                {t("chat.loadPreviousSub", { name: character.name.split(" ")[0] })}
              </p>
              {resumePreview?.text && (
                <p className="mt-3 text-xs text-dark/60 bg-primary/6 rounded-2xl px-3 py-2 leading-snug italic">
                  “{resumePreview.text}{resumePreview.text.length >= 90 ? "…" : ""}”
                  {resumePreview.count > 1 && (
                    <span className="not-italic text-muted">{t("chat.messageCount", { count: resumePreview.count })}</span>
                  )}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={loadPreviousChat}
                  className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-sm hover:opacity-95"
                >
                  {t("chat.loadBtn")}
                </button>
                <button
                  type="button"
                  onClick={startFreshFromChoice}
                  className="w-full py-3 rounded-2xl bg-white border border-dark/10 text-dark font-semibold text-sm hover:bg-dark/4"
                >
                  {t("chat.startNew")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
