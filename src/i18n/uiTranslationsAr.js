/** UI strings for chat, games, rooms, join, preloader — Arabic locale */

const regions = {
  african: "أفريقي", asian: "آسيوي", chinese: "صيني", european: "أوروبي",
  pakistani: "باكستاني", indian: "هندي", afghani: "أفغاني", srilankan: "سريلانكي",
};

const themes = {
  "blush-hour": { name: "ساعة الورد", tagline: "أضواء ناعمة، وكلمات أنعم" },
  "midnight-spark": { name: "شرارة منتصف الليل", tagline: "كيمياء ليلية" },
  "velvet-tease": { name: "مخمل داعب", tagline: "نظرات جريئة وجمل مرحة" },
  "champagne-flirt": { name: "مغازلة الشمبانيا", tagline: "طاقة فقاعات" },
  "summer-heat": { name: "حر الصيف", tagline: "كيمياء دافئة وسهلة" },
  afterglow: { name: "الوهج", tagline: "بطيء، حلو، يبقى" },
};

const testimonials = {
  t1: { quote: "كأنّها دردشة حقيقية في آخر الليل — رجعت مرة بعد مرة." },
  t2: { quote: "الردود الصوتية تبدو فعلاً مثلهم. جنوني." },
  t3: { quote: "دعوت صديقاً وتحدثنا معاً مع نفس الرفيق." },
  t4: { quote: "الألعاب + الصوت جعلتها أمتع بكثير من روبوت عادي." },
};

const chat = {
  listening: "يستمع…", speaking: "يتحدث…", typing: "يكتب…", online: "متصل",
  back: "رجوع", stopSpeaking: "إيقاف الكلام", linkCopied: "تم نسخ الرابط", inviteFriend: "ادعُ صديقاً",
  unfavorite: "إزالة من المفضلة", favorite: "مفضلة", yourProfile: "ملفك", newChat: "دردشة جديدة",
  inviteTitle: "ادعُ صديقاً", inviteSub: "أرسل هذا الرابط — أبقِ الدردشة مفتوحة ريثما ينضم.",
  copied: "تم النسخ", copy: "نسخ", hide: "إخفاء", people: "الأشخاص:", guest: "ضيف", you: " (أنت)",
  chattingWith: " · يتحدث مع {name}", yourNickname: "لقبك", nickPlaceholder: "مثال: آيس",
  save: "حفظ", clear: "مسح", wantGames: "تحب تلعب؟", nickname: "✏️ لقب", ideas: "💡 أفكار",
  truth: "💬 صدق", dare: "🎯 تجرأ", welcomeBack: "أهلاً بعودتك، {name} 👋", continuing: "نكمل دردشتك",
  tapFresh: "اضغط 🔄 للبدء من جديد", sayHiNamed: "قل مرحباً — سينادونك {name} 💕",
  sayHi: "قل مرحباً لتبدأ المحادثة", tryExtras: "جرّب 🎭 ألعاب · 💡 أفكار · 📷 صور",
  loadPrevious: "تحميل الدردشة السابقة؟", loadPreviousSub: "تحدثت مع {name} من قبل. أكمل من حيث توقفت، أو ابدأ من جديد.",
  messageCount: " · {count} رسائل", loadBtn: "تحميل الدردشة السابقة", startNew: "دردشة جديدة",
  tellMore: "أخبرني المزيد", cuteKeep: "لطيف — كمّل", yourTurn: "دورك تسألني شيئاً",
  someone: "شخص ما", photoTag: "[صورة]", sharedPhoto: "[شارك صورة]", alsoShared: "[شارك صورة أيضاً]",
  friend: "صديق", photo: "صورة", everyone: "الجميع",
  couldNotReply: "تعذّر الحصول على رد.", checkKey: "تعذّر الحصول على رد. تحقق من مفتاح OpenAI في frontend/.env",
  adultNotAllowed: "عذراً — الدردشة للكبار أو الصريحة غير مسموحة في يالّو. خلّينا نبقا مرِحين وPG-13 💕",
  weaponsNotAllowed: "ما أحكي عن السلاح ولا العنف — مو هالجو. قولي كيف حاسس 💕",
  speechUnsupported: "التعرف على الصوت غير مدعوم في متصفحك. جرّب كروم.",
  truthPick: "صدق أو تجرأ — أختار صدق. اسألني:",
  darePick: "صدق أو تجرأ — أختار تجرأ. تحديّي:",
  linkCopiedKeepOpen: "تم نسخ الرابط — أبقِ الدردشة مفتوحة لينضم أصدقاؤك",
  copyLinkHint: "انسخ الرابط أدناه وأرسله لصديقك",
  gamesBoredOffer: "تحب نلعب ألعاب؟ 🎮",
  gamesOptionsIntro: "إي! عندي هالخيارات — أي لعبة تبي؟ 🎮",
  pickGame: "اضغط لعبة للبدء",
};

const voice = {
  listening: "يستمع…", captionOptional: "أضف تعليقاً (اختياري)…", message: "رسالة إلى {name}…",
  photoReady: "الصورة جاهزة للإرسال", photoHint: "أضف تعليقاً أدناه أو أرسل كما هي",
  stop: "إيقاف", speak: "تحدث", emoji: "إيموجي", sendImage: "إرسال صورة", send: "إرسال", enterSend: "Enter للإرسال",
  preview: "معاينة",
};

const suggestions = {
  close: "إغلاق الاقتراحات", title: "ردود مقترحة", sub: "بناءً على هذه المحادثة",
  cooking: "يحضّر جملاً لطيفة…", none: "لا اقتراحات بعد — كمّل الدردشة.", newIdeas: "أفكار جديدة", later: "ربما لاحقاً",
};

const games = {
  snakesTitle: "ثعابين وسلالم", vs: "ضد {name}", vsLabel: "ضد", close: "إغلاق",
  rollHint: "ارمِ 6 لتدخل اللوحة. أول من يصل 100 يفوز!", rematch: "إعادة! ارمِ 6 للبدء.",
  you: "أنت", ladder: "سلم", snake: "ثعبان", offBoard: "خارج اللوحة", needSix: "تحتاج 6",
  youStart: "أنت ·", start: "بداية", youWin: "فزت!", wins: "{name} يفوز!", playAgain: "العب مجدداً",
  rolling: "يرمي…", rollDice: "ارمِ النرد", nameRolling: "{name} يرمي…", rollTitle: "ارمِ نرداً", diceBtn: "🎲 نرد",
  rolled: "رمى {value}", waiting: "انتظار",
  youRolled: "رميت {value} …", youRolledExclaim: "رميت {value}!",
  youWonRound: "فزت بهذه الجولة!", theyWonRound: "{name} فاز بهذه الجولة!", tieRound: "تعادل",
  freshGame: "لعبة جديدة — ارمِ عندما تكون جاهزاً!", round: "جولة", reset: "تصفير النقاط",
  chatWhilePlay: "دردش وأنت تلعب",
  ludoTitle: "لودو", ludoSub: "ضد {name} · دردش وأنت تلعب", ludoRoll: "ارمِ", ludoYourTurn: "دورك — ارمِ النرد!",
  ludoExtraTurn: "دور إضافي — ارمِ مجدداً!", ludoYouRolled: "رميت {value}.",
  ludoTapPiece: "رميت {value} — اضغط على قطعة مضيئة.", ludoYouNoMove: "رميت {value} — لا توجد حركة ممكنة.",
  ludoAiNoMove: "{name} رمى {value} — لا توجد حركة ممكنة.", ludoAiRolled: "{name} رمى {value}…",
  ludoThinking: "{name} يفكر…", ludoYouCaptured: "أسقطت قطعة! دور إضافي.",
  ludoAiCaptured: "{name} أسقط قطعتك! دور إضافي.", ludoYouWon: "🎉 فزت!", ludoAiWon: "{name} فاز هذه المرة!",
  ludoChatStart: "🎲 بدأت لعبة لودو مع {name} — أنت الأحمر و{name} الأصفر. ارمِ 6 لإخراج قطعة!",
  ludoChatYouCapture: "💥 أسقطت إحدى قطع {name}!", ludoChatTheyCapture: "😏 {name} أسقط قطعتك للتو!",
  ludoChatYouHome: "🏠 وصلت إحدى قطعك إلى البيت!", ludoChatTheyHome: "🏠 {name} أوصل قطعة إلى البيت!",
  ludoChatYouWin: "🏆 هزمت {name} في لودو!", ludoChatTheyWin: "🏆 {name} فاز في لودو — إعادة؟",
  slYouRolled: "رميت {value}.", slAiRolled: "{name} رمى {value}.",
  slYouExact: "رميت {value} — تحتاج الرقم الدقيق للوصول إلى 100.",
  slAiExact: "{name} رمى {value} — يحتاج الرقم الدقيق للوصول إلى 100.", slYouSnake: "🐍 ثعبان! نزلت إلى {to}.",
  slAiSnake: "🐍 ثعبان! {name} نزل إلى {to}.", slYouLadder: "🪜 سلم! صعدت إلى {to}.",
  slAiLadder: "🪜 سلم! {name} صعد إلى {to}.", slYouSix: "رميت 6 — دور إضافي!",
  slAiSix: "{name} رمى 6 — دور إضافي!",
  slChatStart: "🐍 بدأت ثعابين وسلالم مع {name} — أنت الأحمر و{name} الأصفر. أول من يصل 100 يفوز!",
  slChatYouSnake: "🐍 لدغك ثعبان — نزلت إلى {to}!", slChatTheySnake: "🐍 ثعبان لدغ {name} — نزل إلى {to}!",
  slChatYouLadder: "🪜 صعدت سلماً إلى {to}!", slChatTheyLadder: "🪜 {name} صعد سلماً إلى {to}!",
  slChatYouWin: "🏆 هزمت {name} في ثعابين وسلالم!", slChatTheyWin: "🏆 {name} فاز في ثعابين وسلالم — إعادة؟",
  feedYouRoll: "🎲 رميت {value} وتحركت", feedAiRoll: "🎲 {name} رمى {value} وتحرك",
  feedYouRollTo: "🎲 رميت {value} ← المربع {to}", feedAiRollTo: "🎲 {name} رمى {value} ← المربع {to}",
  feedYouNoMove: "🎲 رميت {value} — لا حركة", feedAiNoMove: "🎲 {name} رمى {value} — لا حركة",
  feedYouHome: "🏠 رميت {value} — وصلت قطعة إلى البيت!",
  feedAiHome: "🏠 {name} رمى {value} — وصلت قطعة إلى البيت!",
  todTitle: "صراحة أم جرأة", todSub: "ضد {name} · أول من يصل إلى {goal} نقاط يفوز", todLevel_fun: "😄 مرح",
  todLevel_flirty: "💕 غزل", todLevel_bold: "🔥 جريء", todYourTurn: "دورك", todTheirTurn: "دور {name}",
  todPick: "صراحة أم جرأة؟", todPickForThem: "اختر تحدياً لـ{name}", todTruth: "صراحة", todDare: "جرأة",
  todRandom: "عشوائي", todRandomHint: "العشوائي شجاعة — +1 نقطة إضافية",
  todAskOwn: "أو اسأل {name} سؤالك الخاص…", todAsk: "اسأل", todThinkingQ: "{name} تختار واحداً لك خصيصاً…",
  todThinkingA: "{name} تجيب…", todAnswerPh: "اكتب إجابتك بصراحة…",
  todDarePh: "أخبر {name} كيف كان الأمر (اختياري)…", todSendAnswer: "أرسل الإجابة", todDone: "تم ✅",
  todSkip: "تخطَّ (متبقٍ {left})", todTimeUp: "انتهى الوقت!", todRate: "قيّم إجابة {name}",
  todEnd: "إنهاء اللعبة", todGameOver: "انتهت اللعبة", todYouWin: "🎉 فزت!",
  todTheyWin: "{name} فاز هذه المرة!", todDraw: "تعادل!",
  todShyAnswer: "حسناً حسناً… أمسكت بي 🙈 اسألني لاحقاً!", todFeedTruthForYou: "🔵 صراحة لك: {prompt}",
  todFeedDareForYou: "🔴 جرأة لك: {prompt}", todFeedYouAskTruth: "🔵 سألت {name}: {prompt}",
  todFeedYouAskDare: "🔴 تحديت {name}: {prompt}", todFeedYouTruth: "🔵 أجبت على صراحة · +{pts}",
  todFeedYouDare: "🔴 نفذت جرأة · +{pts}", todFeedYouSkip: "⏭️ تخطيت · متبقٍ {left}",
  todFeedRated: "{hearts} أعطيت {name} +{pts}",
  todChatStart: "🎭 صراحة أم جرأة مع {name} — أول من يصل إلى {goal} نقاط يفوز!",
  todChatYouWin: "🏆 هزمت {name} في صراحة أم جرأة ({you}–{them})!",
  todChatTheyWin: "🏆 {name} فاز في صراحة أم جرأة ({them}–{you}) — إعادة؟",
  todChatDraw: "🤝 انتهت صراحة أم جرأة بالتعادل ({you}–{them})!",
};

const roomCreate = {
  backRooms: "← الغرف", newLounge: "صالة جديدة", title: "إنشاء غرفة دردشة",
  sub: "اختر أجواء لطيفة، ثم أضف البنات والأولاد الذين تريدهم في الغرفة.",
  roomName: "اسم الغرفة", roomPlaceholder: "مثال: مغازلات الجمعة", theme: "الثيم",
  addCompanions: "أضف رفاقاً ({count}/6)", all: "الكل", girls: "بنات", boys: "أولاد",
  girl: "بنت", boy: "ولد", selectTwo: "اختر رفيقين على الأقل", ready: "{count} جاهزون · {theme}",
  openRoom: "افتح الغرفة", defaultName: "صالة مغازلة", maxSix: "يمكنك إضافة حتى 6 رفاق.",
  couldNotCreate: "تعذّر إنشاء الغرفة.",
};

const join = {
  preparing: "جارٍ تجهيز الدعوة…", couldNotJoin: "تعذّر الانضمام", companionUnavailable: "هذا الرفيق غير متاح على هذا الجهاز.",
  opening: "أنت داخل — جارٍ فتح الدردشة…", couldNotOpen: "تعذّر فتح هذه الدردشة", title: "انضم للدردشة",
  invited: "{prefix}صديقك دعاك لتنضم لدردشة يالّو!", hey: "مرحباً {name} — ",
  keepOpen: "اطلب من صديقك إبقاء الدردشة مفتوحة ريثما تنضم.",
  shareHint: "تأكد أن صديقك ضغط مشاركة وترك الدردشة مفتوحة.", tryAgain: "حاول مجدداً",
  connected: "متصل…", backHome: "العودة للرئيسية",
};

const roomChat = {
  backRooms: "← الغرف", rename: "إعادة تسمية الغرفة", inRoom: "{theme} · {count} في الغرفة", hi: " · مرحباً {name}",
  inviteTitle: "ادعُ صديقاً برابط", share: "مشاركة", members: "الأعضاء", stop: "إيقاف", new: "جديد",
  inviteFriend: "ادعُ صديقاً", inviteSub: "أرسل هذا الرابط — أبقِ هذه الصفحة مفتوحة ريثما ينضمون.",
  inThisRoom: "في هذه الغرفة", remove: "إزالة", addAnyone: "أضف أحداً", roomFull: "الغرفة ممتلئة — أزل أحداً لإضافة آخر.",
  chatHint: "دردش مع أصدقائك والرفاق — @ اسماً للتحدث مع شخص واحد",
  linkCopied: "تم نسخ الرابط — أبقِ هذه الصفحة مفتوحة لينضم أصدقاؤك",
  copyHint: "انسخ الرابط أدناه وأرسله لصديقك",
  roomNamePrompt: "اسم الغرفة", joined: "{name} انضم للغرفة ✨",
  left: "{name} غادر الغرفة", sharedPhotoRoom: "شارك صورة مع الغرفة",
  said: "{speaker} قال: {text}",
};

const share = {
  syncedHost: "متزامن مع المضيف", hostLeft: "المضيف غادر — اطلب منه إعادة فتح الغرفة",
  waitingFriends: "تم إرسال الدعوة — بانتظار الأصدقاء", friendConnected: "صديق متصل",
  joinedHost: "انضم للمضيف", ready: "جاهز للمشاركة", connecting: "جارٍ الاتصال…",
  shareKeepOpen: "شارك الرابط — أبقِ هذه الصفحة مفتوحة", roomOpenElsewhere: "هذه الغرفة مفتوحة في تبويب آخر. أغلق التبويب الآخر وحاول مجدداً.",
  hostOffline: "المضيف غير متصل — اطلب منه فتح الغرفة وإبقاءها مفتوحة", reconnecting: "إعادة الاتصال…",
  connectionError: "خطأ في الاتصال",
};

const preloader = {
  aria: "جارٍ تحميل يالّو!", line1: "مرحباً… كنت أنتظرك 💕", line2: "أوشكت على الوصول 😍",
  line3: "الأشياء الحلوة تأخذ لحظة ✨", tagline: "كيمياؤك تُحمَّل…",
};

const photo = {
  noPhotos: "ما عندي صور الحين… بس تقدر تغازلني بعد 💕",
  cap1: "طيب… أقنعتني. لا تحدّق كثير 😘",
  cap2: "شفت؟ قلت لك راح تعلق بالنظر… خذ ثانية ✨",
  cap3: "محظوظ إنك لطيف. واحدة زيادة — عيوني عليك بس 😏",
  cap4: "آخر واحدة الليلة… لساتك ما تقدر تشيل نظرك؟ تمام 💕",
  tease1: "صور من أول؟ روّق… غازلني أولاً 😏",
  tease2: "مو بهالسهولة… جملة حلوة زيادة ويمكن 😘",
  tease3: "طيب طيب، ربحت — جاية ✨",
  tease4: "همم… أبهرني مرة ثانية أولاً 💕",
  bulk: "طيب طيب… كم صورة لك. لا تقول ما أدلّلك ✨",
  oneMore: "طيب… خذ واحدة. حاول ما تذوب 😘",
  denied1: "هذي كل صوري… بس انتباهي عندك، كمّل مغازلة 😌",
  denied2: "ما في صور زيادة — استخدم خيالك… أو خلّيني أضحك 💬",
  denied3: "الكاميرا ارتاحت اليوم. كلام بس الحين… أبهرني 💕",
};

const roomErrors = {
  minTwo: "أضف رفيقين على الأقل لبدء غرفة.", maxSix: "الحد الأقصى 6 رفاق في الغرفة.",
  sharedLounge: "صالة مشتركة", inviteMinTwo: "غرفة الدعوة هذه تحتاج رفيقين على الأقل.",
  roomFull: "الغرفة ممتلئة (الحد 6).", keepTwo: "أبقِ رفيقين على الأقل في الغرفة.",
};

const home = {
  scroll: "تمرير", readyWhen: "جاهز عندما", youAre: "تكون أنت",
  footerTag: "دردشة · صوت · كيمياء · © {year} يالّو!",
  demoMsg1: "مم، مرحباً. ما أهمس — أغازل. جاهز؟",
  demoMsg2: "تشارك صورتك؟ 📸", demoMsg3: "طيب… هذي لك 😘", demoShared: "تمت المشاركة",
  themeBlush: "صالة الورد 🌸", themeMidnight: "أجواء منتصف الليل 🌙", themeVelvet: "غرفة المخمل 💜",
  themeChampagne: "شمبانيا 🥂", themeSummer: "حر الصيف ☀️",
  playStory: "شغّل قصة {name}",
};

const chatMessage = {
  listen: "استمع", tapListen: "اضغط للاستماع", yourPhoto: "صورتك", shared: "تمت المشاركة",
  sharedBy: "{name} شارك", react: "تفاعل", photoViewer: "عارض الصور", close: "إغلاق", avatar: "الصورة",
};

const common = {
  all: "الكل", girls: "بنات", boys: "أولاد", girl: "بنت", boy: "ولد", you: "أنت", stop: "إيقاف",
  copy: "نسخ", hide: "إخفاء", save: "حفظ", close: "إغلاق", remove: "إزالة", new: "جديد",
};

export const uiTranslationsAr = { regions, themes, testimonials, chat, voice, suggestions, games, roomCreate, join, roomChat, share, preloader, photo, roomErrors, home, chatMessage, common };

export const SHARE_STATUS_KEYS_AR = {
  "متزامن مع المضيف": "share.syncedHost",
  "المضيف غادر — اطلب منه إعادة فتح الغرفة": "share.hostLeft",
  "تم إرسال الدعوة — بانتظار الأصدقاء": "share.waitingFriends",
  "صديق متصل": "share.friendConnected",
  "انضم للمضيف": "share.joinedHost",
  "جاهز للمشاركة": "share.ready",
  "جارٍ الاتصال…": "share.connecting",
  "شارك الرابط — أبقِ هذه الصفحة مفتوحة": "share.shareKeepOpen",
  "هذه الغرفة مفتوحة في تبويب آخر. أغلق التبويب الآخر وحاول مجدداً.": "share.roomOpenElsewhere",
  "المضيف غير متصل — اطلب منه فتح الغرفة وإبقاءها مفتوحة": "share.hostOffline",
  "إعادة الاتصال…": "share.reconnecting",
  "خطأ في الاتصال": "share.connectionError",
};

export const ROOM_ERROR_KEYS_AR = {
  "أضف رفيقين على الأقل لبدء غرفة.": "roomErrors.minTwo",
  "الحد الأقصى 6 رفاق في الغرفة.": "roomErrors.maxSix",
  "غرفة الدعوة هذه تحتاج رفيقين على الأقل.": "roomErrors.inviteMinTwo",
  "الغرفة ممتلئة (الحد 6).": "roomErrors.roomFull",
  "أبقِ رفيقين على الأقل في الغرفة.": "roomErrors.keepTwo",
};
