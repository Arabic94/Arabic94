import { useState, useEffect, useRef } from "react";
const API = "https://arabic94.onrender.com";
const WORDS = [
  "أنا",
  "أنت",
  "هو",
  "هي",
  "نحن",
  "هم",
  "هذا",
  "هذه",
  "ذلك",
  "هنا",
  "هناك",
  "في",
  "على",
  "إلى",
  "من",
  "عن",
  "مع",
  "بين",
  "تحت",
  "فوق",
  "ثم",
  "و",
  "أو",
  "لكن",
  "لأن",
  "نعم",
  "لا",
  "كل",
  "بعض",
  "كثير",
  "قليل",
  "اليوم",
  "أمس",
  "غدًا",
  "صباح",
  "مساء",
  "بيت",
  "باب",
  "نافذة",
  "غرفة",
  "مدرسة",
  "صف",
  "كتاب",
  "دفتر",
  "قلم",
  "حقيبة",
  "معلم",
  "طالب",
  "ولد",
  "بنت",
  "أم",
  "أب",
  "أخ",
  "أخت",
  "جد",
  "جدة",
  "طفل",
  "رجل",
  "امرأة",
  "صديق",
  "ماء",
  "طعام",
  "خبز",
  "حليب",
  "تفاح",
  "سيارة",
  "شارع",
  "شجرة",
  "زهرة",
  "شمس",
  "قمر",
  "سماء",
  "أرض",
  "بحر",
  "نهر",
  "جبل",
  "لون",
  "أحمر",
  "أزرق",
  "أخضر",
  "كبير",
  "صغير",
  "طويل",
  "قصير",
  "جميل",
  "سريع",
  "بطيء",
  "فتح",
  "أغلق",
  "ذهب",
  "جاء",
  "جلس",
  "وقف",
  "لعب",
  "كتب",
  "قرأ",
  "أكل",
  "شرب",
  "نام",
  "أحب",
];

const TOTAL_BATCHES = Math.ceil(WORDS.length / 5);

// ─── Avatars (4 choices: 2 for boys, 2 for girls) ──────────────────────────
const AVATAR_OPTIONS = [
  { id: "boy1", emoji: "👦", label: "ولد" },
  { id: "boy2", emoji: "🦸‍♂️", label: "بطل خارق" },
  { id: "girl1", emoji: "👧", label: "بنت" },
  { id: "girl2", emoji: "🦸‍♀️", label: "بطلة خارقة" },
];
const avatarEmoji = (id) =>
  AVATAR_OPTIONS.find((a) => a.id === id)?.emoji || "🦉";

const toAr = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function speak(word, onEnd) {
  const audio = new Audio(`./audio/${word}.mp3`);
  if (onEnd) audio.onended = onEnd;
  audio.play().catch((err) => {
    console.error(`تعذر تشغيل الصوت للكلمة: ${word}`, err);
  });
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function ArabicReader() {
  // top-level screen: auth | avatarPick | menu | learn | quiz | review | done
  const [screen, setScreen] = useState("auth");

  // ── auth state ──
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authName, setAuthName] = useState("");
  const [authAge, setAuthAge] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);
  const [editingAvatarOnly, setEditingAvatarOnly] = useState(false);

  // ── logged-in student ──
  const [student, setStudent] = useState(null);

  // ── learn/quiz state ──
  const [batchStart, setBatchStart] = useState(0);
  const [wordPos, setWordPos] = useState(0);
  const [phase, setPhase] = useState("learn"); // learn | quiz
  const [avatarAnim, setAvatarAnim] = useState("");
  const [bubbleMsg, setBubbleMsg] = useState(
    "أهلاً! استمع للكلمة ثم انتقل للتالية 😊",
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [quizRound, setQuizRound] = useState(0);
  const [quizTarget, setQuizTarget] = useState("");
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [quizDone, setQuizDone] = useState(false);
  const repeatRef = useRef(null);

  // ── review (cumulative) exam state ──
  const [reviewWords, setReviewWords] = useState([]);
  const [reviewRound, setReviewRound] = useState(0);
  const [reviewTarget, setReviewTarget] = useState("");
  const [reviewOptions, setReviewOptions] = useState([]);
  const [reviewResults, setReviewResults] = useState([]);
  const [reviewSelected, setReviewSelected] = useState(null);
  const [reviewDone, setReviewDone] = useState(false);
  const reviewRepeatRef = useRef(null);

  const currentWordIdx = batchStart + wordPos;
  const currentWord = WORDS[currentWordIdx];
  const currentBatch = batchStart / 5;

  useEffect(() => {
    return () => {
      clearTimeout(repeatRef.current);
      clearTimeout(reviewRepeatRef.current);
    };
  }, []);
  useEffect(() => {
    async function loadStudent() {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await fetch(`${API}/student/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        setStudent(data.student);

        setScreen("menu");
      }
    }

    loadStudent();
  }, []);

  function animAvatar(type) {
    setAvatarAnim(type);
    setTimeout(() => setAvatarAnim(""), 700);
  }

  function speakWord(word, onEnd) {
    setIsSpeaking(true);
    animAvatar("talk");
    speak(word, () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    });
  }

  // ── Auth actions ─────────────────────────────────────────────────────────
  async function handleRegister() {
    setAuthError("");

    const name = authName.trim();

    if (!name || !authAge || !authPassword) {
      setAuthError("الرجاء تعبئة كل الحقول");
      return;
    }

    setAuthBusy(true);

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          age: Number(authAge),
          password: authPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error);
        return;
      }

      localStorage.setItem("token", data.token);

      setPendingProfile(data.student);

      setScreen("avatarPick");
    } catch (err) {
      setAuthError("تعذر الاتصال بالسيرفر");
    } finally {
      setAuthBusy(false);
    }
  }
  async function handleLogin() {
    setAuthError("");

    if (!authName || !authPassword) {
      setAuthError("الاسم وكلمة المرور مطلوبان");
      return;
    }

    setAuthBusy(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: authName.trim(),

          password: authPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error);
        return;
      }

      localStorage.setItem("token", data.token);

      enterAppWithStudent(data.student);
    } catch (err) {
      setAuthError("تعذر الاتصال بالسيرفر");
    } finally {
      setAuthBusy(false);
    }
  }

  function enterAppWithStudent(profile) {
    setStudent(profile);
    setAuthName("");
    setAuthAge("");
    setAuthPassword("");
    setAuthError("");
    setScreen("menu");
    setBubbleMsg(`أهلاً بعودتك يا ${profile.name}! 😊`);
  }

async function handleAvatarChosen(avatarId) {
  try {

    // إذا كان تغيير أفتار لطالب موجود
    if (editingAvatarOnly && student) {

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/student/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar: avatarId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(data.error);
        return;
      }

      setStudent(data.student);
      setEditingAvatarOnly(false);
      setScreen("menu");

      return;
    }


    // اختيار الأفتار أول مرة بعد التسجيل
    const profile = {
      ...pendingProfile,
      avatar: avatarId,
      maxBatchReached: 0,
      batchPassed: Array(TOTAL_BATCHES).fill(false),
      createdAt: Date.now(),
    };


    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/student/avatar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        avatar: avatarId,
      }),
    });


    const data = await res.json();


    if (!res.ok) {
      console.log(data.error);
      return;
    }


    enterAppWithStudent(data.student);


  } catch (err) {
    console.log(err);
  }
}

  function handleLogout() {
    clearTimeout(repeatRef.current);
    clearTimeout(reviewRepeatRef.current);
    window.speechSynthesis?.cancel();
    setStudent(null);
    setAuthMode("login");
    setScreen("auth");
    setPhase("learn");
    setBatchStart(0);
    setWordPos(0);
    setBubbleMsg("أهلاً! استمع للكلمة ثم انتقل للتالية 😊");
  }

  // ── Menu ─────────────────────────────────────────────────────────────────
  function goToLearning() {
    if (!student) return;
    const nextBatchIdx = Math.min(student.maxBatchReached, TOTAL_BATCHES - 1);
    setBatchStart(nextBatchIdx * 5);
    setWordPos(0);
    setPhase("learn");
    setScreen("learn");
    setBubbleMsg("هيا بنا نتعلم! 🚀");
  }

  function startReviewExam() {
    if (!student || student.maxBatchReached <= 0) return;
    const available = WORDS.slice(0, student.maxBatchReached * 5);
    const total = Math.min(10, available.length);
    const pool = shuffle(available).slice(0, total);
    setReviewWords(pool);
    setReviewRound(0);
    setReviewResults([]);
    setReviewDone(false);
    setReviewSelected(null);
    setScreen("review");
    setBubbleMsg("امتحان شامل لكل الكلمات اللي خلصتها! 🎯");
    setTimeout(() => buildReviewRound(pool, 0), 300);
  }

  // ── Learn phase ──────────────────────────────────────────────────────────
  function handleSpeak() {
    setBubbleMsg("استمع جيداً... 👂");
    speakWord(currentWord);
  }
  function handleNext() {
    if (wordPos < 4) {
      setWordPos(wordPos + 1);
      setBubbleMsg("ممتاز! كلمة جديدة 🌟");
    } else {
      startQuiz();
    }
  }
  function handlePrev() {
    if (wordPos > 0) {
      setWordPos(wordPos - 1);
      setBubbleMsg("العودة للكلمة السابقة ↩️");
    }
  }

  // ── Batch quiz ───────────────────────────────────────────────────────────
  function startQuiz() {
    setPhase("quiz");
    setScreen("quiz");
    setQuizRound(0);
    setQuizResults([]);
    setQuizDone(false);
    setSelectedOpt(null);
    setBubbleMsg(
      "وقت الاختبار! لازم تجاوب صح على الكل عشان تفتح المجموعة الجاية 🎯",
    );
    setTimeout(() => buildRound(0), 300);
  }

  function buildRound(round) {
    const targetWord = WORDS[batchStart + round];
    const batchWords = WORDS.slice(batchStart, batchStart + 5);
    const wrong = shuffle(batchWords.filter((w) => w !== targetWord));
    const opts = shuffle([targetWord, ...wrong]);
    setQuizTarget(targetWord);
    setQuizOptions(opts);
    setSelectedOpt(null);
    setTimeout(() => {
      speakWord(targetWord);
      scheduleRepeat(targetWord);
    }, 400);
  }

  function scheduleRepeat(word) {
    clearTimeout(repeatRef.current);
    repeatRef.current = setTimeout(() => {
      speakWord(word, () => scheduleRepeat(word));
    }, 3500);
  }

  function handleQuizAnswer(word) {
    if (selectedOpt) return;
    clearTimeout(repeatRef.current);
    window.speechSynthesis?.cancel();
    const correct = word === quizTarget;
    setSelectedOpt({ word, correct });
    const newResults = [...quizResults, correct];
    setQuizResults(newResults);
    if (correct) {
      animAvatar("happy");
      setBubbleMsg("صحيح! أحسنت 🎉");
    } else {
      animAvatar("shake");
      setBubbleMsg("خطأ! الكلمة كانت: " + quizTarget + " 💪");
    }

    const nextRound = quizRound + 1;
    setTimeout(() => {
      if (nextRound < 5) {
        setQuizRound(nextRound);
        buildRound(nextRound);
      } else {
        setQuizDone(true);
        const score = newResults.filter(Boolean).length;
        if (score === 5) {
          setBubbleMsg(
            `ممتاز! نجحت بدون أي خطأ ${toAr(score)}/٥ 🏆 فتحت المجموعة الجاية!`,
          );
          animAvatar("happy");
        } else {
          setBubbleMsg(
            `نتيجتك ${toAr(score)}/٥ — لازم تجاوب صح على الكل عشان تفتح المجموعة الجاية 💪`,
          );
        }
      }
    }, 1500);
  }

  function handleReplay() {
    speakWord(quizTarget);
    scheduleRepeat(quizTarget);
  }
async function saveProgress(){

  const token = localStorage.getItem("token");

  const batchIndex = batchStart / 5;

  const res = await fetch(`${API}/student/progress`,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${token}`
    },
    body:JSON.stringify({
      batchIndex,
      passed:true
    })
  });


  const data = await res.json();


  if(res.ok){
    setStudent(data.student);
  }

}
async function handleContinue() {
  clearTimeout(repeatRef.current);
  window.speechSynthesis?.cancel();

  await saveProgress();

  const nextBatch = batchStart + 5;

  if (nextBatch >= WORDS.length) {
    setScreen("done");
    setBubbleMsg("أحسنت! أكملت جميع الكلمات 🎊");
    animAvatar("happy");
    return;
  }

  setBatchStart(nextBatch);
  setWordPos(0);
  setPhase("learn");
  setScreen("learn");
  setBubbleMsg("مجموعة جديدة! هيا نتعلم 🚀");
} 

  function handleReviewWords() {
    clearTimeout(repeatRef.current);
    window.speechSynthesis?.cancel();
    setWordPos(0);
    setPhase("learn");
    setScreen("learn");
    setBubbleMsg("راجع الكلمات وارجع للاختبار 📖");
  }

  function handleRetryQuiz() {
    clearTimeout(repeatRef.current);
    window.speechSynthesis?.cancel();
    setQuizRound(0);
    setQuizResults([]);
    setQuizDone(false);
    setSelectedOpt(null);
    setBubbleMsg("حاول مرة ثانية! 💪");
    setTimeout(() => buildRound(0), 300);
  }

  // ── Cumulative review quiz ───────────────────────────────────────────────
  function buildReviewRound(pool, round) {
    const target = pool[round];
    const available = WORDS.slice(0, student.maxBatchReached * 5);
    const wrong = shuffle(available.filter((w) => w !== target)).slice(0, 3);
    const opts = shuffle([target, ...wrong]);
    setReviewTarget(target);
    setReviewOptions(opts);
    setReviewSelected(null);
    setTimeout(() => {
      speakWord(target);
      scheduleReviewRepeat(target);
    }, 400);
  }

  function scheduleReviewRepeat(word) {
    clearTimeout(reviewRepeatRef.current);
    reviewRepeatRef.current = setTimeout(() => {
      speakWord(word, () => scheduleReviewRepeat(word));
    }, 3500);
  }

  function handleReviewReplay() {
    speakWord(reviewTarget);
    scheduleReviewRepeat(reviewTarget);
  }

  function handleReviewAnswer(word) {
    if (reviewSelected) return;
    clearTimeout(reviewRepeatRef.current);
    window.speechSynthesis?.cancel();
    const correct = word === reviewTarget;
    setReviewSelected({ word, correct });
    const newResults = [...reviewResults, correct];
    setReviewResults(newResults);
    if (correct) {
      animAvatar("happy");
      setBubbleMsg("صحيح! 🎉");
    } else {
      animAvatar("shake");
      setBubbleMsg("الكلمة الصحيحة: " + reviewTarget);
    }
    const next = reviewRound + 1;
    setTimeout(() => {
      if (next < reviewWords.length) {
        setReviewRound(next);
        buildReviewRound(reviewWords, next);
      } else {
        setReviewDone(true);
        const score = newResults.filter(Boolean).length;
        setBubbleMsg(
          `انتهى الامتحان الشامل! نتيجتك ${toAr(score)}/${toAr(reviewWords.length)} 🏆`,
        );
        animAvatar(score >= Math.ceil(reviewWords.length * 0.8) ? "happy" : "");
      }
    }, 1500);
  }

  // ── Progress ─────────────────────────────────────────────────────────────
  const learnedCount = student
    ? student.maxBatchReached * 5 + (screen === "learn" ? wordPos : 0)
    : 0;
  const progressPct = Math.round((learnedCount / WORDS.length) * 100);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════

  if (screen === "auth") {
    return (
      <div style={styles.root}>
        <div style={{ ...styles.avatar, marginTop: 12 }}>🦉</div>
        <div style={styles.bubble}>
          تعلّم قراءة ١٠٠ كلمة عربية! سجّل حسابك أو ادخل عليه
        </div>
        <div style={styles.card}>
          <div style={styles.tabRow}>
            <button
              style={
                authMode === "login" ? styles.tabActive : styles.tabInactive
              }
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              تسجيل الدخول
            </button>
            {/*
            <button
              style={
                authMode === "register" ? styles.tabActive : styles.tabInactive
              }
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
            >
              حساب جديد
            </button>*/}
          </div>

          <input
            style={styles.input}
            placeholder="الاسم"
            value={authName}
            onChange={(e) => setAuthName(e.target.value)}
          />
          {authMode === "register" && (
            <input
              style={styles.input}
              placeholder="العمر"
              type="number"
              min="1"
              max="18"
              value={authAge}
              onChange={(e) => setAuthAge(e.target.value)}
            />
          )}
          <input
            style={styles.input}
            placeholder="كلمة المرور"
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
          />

          {authError && <div style={styles.errorText}>{authError}</div>}

          <button
            style={{
              ...styles.btnPrimary,
              marginTop: 14,
              width: "100%",
              justifyContent: "center",
            }}
            onClick={authMode === "login" ? handleLogin : handleRegister}
            disabled={authBusy}
          >
            {authBusy
              ? "..."
              : authMode === "login"
                ? "دخول 🔑"
                : "إنشاء الحساب →"}
          </button>

          <div style={styles.hintNote}>للاستفسار عن خدماتنا الاخرى او لملاحظاتكم عن هذه الخدمة يمكنكم التواصل على
            0799142612</div>
        </div>
      </div>
    );
  }

  if (screen === "avatarPick") {
    return (
      <div style={styles.root}>
        <div style={styles.bubble}>
          {editingAvatarOnly
            ? "اختر أفتار جديد لك"
            : "اختر الأفتار اللي بيمثلك 😊"}
        </div>
        <div style={styles.card}>
          <div style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a.id}
                style={styles.avatarOption}
                onClick={() => handleAvatarChosen(a.id)}
              >
                <div style={{ fontSize: 56 }}>{a.emoji}</div>
                <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
                  {a.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "menu") {
    return (
      <div style={styles.root}>
        <div style={styles.avatar}>{avatarEmoji(student.avatar)}</div>
        <div style={styles.bubble}>{bubbleMsg}</div>
        <div style={styles.card}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
            {student.name}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
            العمر: {toAr(student.age)}
          </div>

          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressFill, width: progressPct + "%" }} />
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            أنجزت {toAr(student.maxBatchReached * 5)} من {toAr(WORDS.length)}{" "}
            كلمة ({toAr(progressPct)}%)
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              width: "100%",
            }}
          >
            {student.maxBatchReached < TOTAL_BATCHES ? (
              <button style={styles.btnPrimary} onClick={goToLearning}>
                متابعة التعلم 🚀
              </button>
            ) : (
              <div
                style={{
                  color: "#15803d",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                🎊 أكملت كل الكلمات!
              </div>
            )}
            <button
              style={
                student.maxBatchReached > 0
                  ? styles.btnSecondary
                  : styles.btnDisabled
              }
              onClick={startReviewExam}
              disabled={student.maxBatchReached <= 0}
            >
              🎯 امتحان شامل لكل الكلمات اللي خلصتها
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => {
                setEditingAvatarOnly(true);
                setScreen("avatarPick");
              }}
            >
              🧑‍🎨 غيّر الأفتار
            </button>
            <button style={styles.btnGhost} onClick={handleLogout}>
              🚪 تسجيل خروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "done") {
    return (
      <div style={styles.root}>
        <div style={styles.avatar}>{avatarEmoji(student.avatar)}</div>
        <div style={styles.bubble}>{bubbleMsg}</div>
        <div style={styles.card}>
          <div style={{ fontSize: 64 }}>🎊</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1e293b",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            أحسنت يا {student.name}! أتقنت جميع الكلمات
          </div>
          <button
            style={{ ...styles.btnPrimary, marginTop: 20 }}
            onClick={() => setScreen("menu")}
          >
            🏠 القائمة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (screen === "review") {
    return (
      <div style={styles.root}>
        <div
          style={{
            ...styles.avatar,
            animation:
              avatarAnim === "talk"
                ? "pulse 0.3s ease infinite alternate"
                : avatarAnim === "happy"
                  ? "bounce 0.5s ease"
                  : avatarAnim === "shake"
                    ? "shake 0.4s ease"
                    : "none",
          }}
        >
          {avatarEmoji(student.avatar)}
        </div>
        <div style={styles.bubble}>{bubbleMsg}</div>

        {!reviewDone ? (
          <div style={styles.card}>
            <div style={styles.quizHeader}>
              <span style={styles.quizTitle}>الامتحان الشامل</span>
              <span style={styles.quizRound}>
                {toAr(reviewRound + 1)} / {toAr(reviewWords.length)}
              </span>
            </div>

            <p style={styles.quizHint}>استمع واختر الكلمة الصحيحة 👇</p>

            <button
              style={{ ...styles.btnListen, marginBottom: 16 }}
              onClick={handleReviewReplay}
              disabled={isSpeaking}
            >
              <SpeakerIcon /> &nbsp; إعادة الصوت
            </button>

            <div style={styles.optionsGrid}>
              {reviewOptions.map((w) => {
                let bg = "#fff",
                  border = "1.5px solid #e2e8f0",
                  color = "#1e293b";
                if (reviewSelected) {
                  if (w === reviewTarget) {
                    bg = "#dcfce7";
                    border = "2px solid #22c55e";
                    color = "#15803d";
                  } else if (
                    w === reviewSelected.word &&
                    !reviewSelected.correct
                  ) {
                    bg = "#fee2e2";
                    border = "2px solid #ef4444";
                    color = "#b91c1c";
                  }
                }
                return (
                  <button
                    key={w}
                    style={{
                      ...styles.optionBtn,
                      background: bg,
                      border,
                      color,
                    }}
                    onClick={() => handleReviewAnswer(w)}
                    disabled={!!reviewSelected}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.scoreWrap}>
              <div style={styles.scoreBig}>
                {toAr(reviewResults.filter(Boolean).length)}
                <span style={styles.scoreOf}>/{toAr(reviewWords.length)}</span>
              </div>
              <div style={styles.scoreLabel}>نتيجة الامتحان الشامل</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 20,
                width: "100%",
              }}
            >
              <button style={styles.btnPrimary} onClick={startReviewExam}>
                🔁 أعد الامتحان الشامل
              </button>
              <button
                style={styles.btnSecondary}
                onClick={() => setScreen("menu")}
              >
                🏠 القائمة الرئيسية
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── learn & quiz screens (batch flow) ──
  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <span style={styles.topLabel}>
          {toAr(Math.min(learnedCount + 1, WORDS.length))} /{" "}
          {toAr(WORDS.length)}
        </span>
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressFill, width: progressPct + "%" }} />
        </div>
        <span style={styles.topLabel}>{toAr(progressPct)}%</span>
      </div>

      <div style={styles.batchDots}>
        {Array.from({ length: TOTAL_BATCHES }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.batchDot,
              background:
                i < student.maxBatchReached
                  ? "#3b82f6"
                  : i === currentBatch
                    ? "#93c5fd"
                    : "#e2e8f0",
            }}
          />
        ))}
      </div>

      <div
        style={{
          ...styles.avatar,
          animation:
            avatarAnim === "talk"
              ? "pulse 0.3s ease infinite alternate"
              : avatarAnim === "happy"
                ? "bounce 0.5s ease"
                : avatarAnim === "shake"
                  ? "shake 0.4s ease"
                  : "none",
        }}
      >
        {avatarEmoji(student.avatar)}
      </div>

      <div style={styles.bubble}>{bubbleMsg}</div>

      {screen === "learn" && (
        <div style={styles.card}>
          <div style={styles.miniDots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  ...styles.miniDot,
                  background:
                    i < wordPos
                      ? "#3b82f6"
                      : i === wordPos
                        ? "#93c5fd"
                        : "#e2e8f0",
                  transform: i === wordPos ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>

          <div style={styles.wordText}>{currentWord}</div>
          <div style={styles.wordSub}>
            كلمة {toAr(wordPos + 1)} من ٥ — المجموعة {toAr(currentBatch + 1)}
          </div>

          <button
            style={{ ...styles.btnPrimary, marginTop: 20 }}
            onClick={handleSpeak}
            disabled={isSpeaking}
          >
            <SpeakerIcon /> &nbsp; استمع للكلمة
          </button>

          <div style={styles.navRow}>
            <button
              style={styles.btnSecondary}
              onClick={handlePrev}
              disabled={wordPos === 0}
            >
              ← السابقة
            </button>
            <button style={styles.btnPrimary} onClick={handleNext}>
              {wordPos === 4 ? "🎯 ابدأ الاختبار" : "التالية →"}
            </button>
          </div>
          <button
            style={{ ...styles.btnGhost, marginTop: 12 }}
            onClick={() => setScreen("menu")}
          >
            🏠 القائمة الرئيسية
          </button>
        </div>
      )}

      {screen === "quiz" && !quizDone && (
        <div style={styles.card}>
          <div style={styles.quizHeader}>
            <span style={styles.quizTitle}>
              اختبار المجموعة {toAr(currentBatch + 1)}
            </span>
            <span style={styles.quizRound}>{toAr(quizRound + 1)} / ٥</span>
          </div>

          <div style={styles.miniDots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  ...styles.miniDot,
                  background:
                    i < quizResults.length
                      ? quizResults[i]
                        ? "#22c55e"
                        : "#ef4444"
                      : i === quizRound
                        ? "#93c5fd"
                        : "#e2e8f0",
                  transform: i === quizRound ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>

          <p style={styles.quizHint}>استمع واختر الكلمة الصحيحة 👇</p>

          <button
            style={{ ...styles.btnListen, marginBottom: 16 }}
            onClick={handleReplay}
            disabled={isSpeaking}
          >
            <SpeakerIcon /> &nbsp; إعادة الصوت
          </button>

          <div style={styles.optionsGrid}>
            {quizOptions.map((w) => {
              let bg = "#fff",
                border = "1.5px solid #e2e8f0",
                color = "#1e293b";
              if (selectedOpt) {
                if (w === quizTarget) {
                  bg = "#dcfce7";
                  border = "2px solid #22c55e";
                  color = "#15803d";
                } else if (w === selectedOpt.word && !selectedOpt.correct) {
                  bg = "#fee2e2";
                  border = "2px solid #ef4444";
                  color = "#b91c1c";
                }
              }
              return (
                <button
                  key={w}
                  style={{ ...styles.optionBtn, background: bg, border, color }}
                  onClick={() => handleQuizAnswer(w)}
                  disabled={!!selectedOpt}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {screen === "quiz" && quizDone && (
        <div style={styles.card}>
          <div style={styles.scoreWrap}>
            <div style={styles.scoreBig}>
              {toAr(quizResults.filter(Boolean).length)}
              <span style={styles.scoreOf}>/٥</span>
            </div>
            <div style={styles.scoreLabel}>نتيجتك</div>
          </div>

          <div style={styles.miniDots}>
            {quizResults.map((r, i) => (
              <div
                key={i}
                style={{
                  ...styles.miniDot,
                  background: r ? "#22c55e" : "#ef4444",
                  width: 14,
                  height: 14,
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 24,
              width: "100%",
            }}
          >
            {quizResults.every(Boolean) ? (
              <button style={styles.btnPrimary} onClick={handleContinue}>
                متابعة للمجموعة الجاية 🚀
              </button>
            ) : (
              <div
                style={{
                  color: "#b91c1c",
                  fontWeight: 600,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                لازم تنجح بدون أي خطأ عشان تفتح المجموعة الجاية
              </div>
            )}
            <button style={styles.btnSecondary} onClick={handleRetryQuiz}>
              🔁 أعد الاختبار
            </button>
            <button style={styles.btnSecondary} onClick={handleReviewWords}>
              📖 راجع الكلمات الـ٥
            </button>
            <button style={styles.btnGhost} onClick={() => setScreen("menu")}>
              🏠 القائمة الرئيسية
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.07); } }
        @keyframes bounce { 0%,100%{transform:scale(1) rotate(0)} 30%{transform:scale(1.15) rotate(-8deg)} 70%{transform:scale(1.15) rotate(8deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        button:hover:not(:disabled) { filter: brightness(0.95); }
        button:active:not(:disabled) { transform: scale(0.97) !important; }
        button:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ verticalAlign: "middle" }}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

const styles = {
  root: {
    direction: "rtl",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px 40px",
    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 480,
    marginBottom: 8,
  },
  topLabel: {
    fontSize: 13,
    color: "#64748b",
    minWidth: 36,
    textAlign: "center",
  },
  progressWrap: {
    flex: 1,
    height: 10,
    background: "#dbeafe",
    borderRadius: 99,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    background: "#3b82f6",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  batchDots: {
    display: "flex",
    gap: 5,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 480,
  },
  batchDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    transition: "background 0.3s",
  },
  avatar: {
    fontSize: 72,
    lineHeight: 1,
    marginBottom: 8,
    userSelect: "none",
    cursor: "default",
  },
  bubble: {
    background: "#fff",
    border: "1.5px solid #dbeafe",
    borderRadius: 16,
    padding: "10px 20px",
    fontSize: 15,
    color: "#1e293b",
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(59,130,246,0.08)",
    lineHeight: 1.6,
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: "28px 24px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 4px 24px rgba(59,130,246,0.10)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  },
  miniDots: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    justifyContent: "center",
  },
  miniDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    transition: "background 0.3s, transform 0.2s",
  },
  wordText: {
    fontSize: 80,
    fontWeight: 700,
    color: "#1e293b",
    fontFamily: "'Amiri', 'Traditional Arabic', serif",
    lineHeight: 1.2,
    textAlign: "center",
    marginBottom: 6,
  },
  wordSub: { fontSize: 14, color: "#94a3b8", marginBottom: 0 },
  btnPrimary: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 99,
    padding: "13px 32px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "transform 0.1s",
    direction: "rtl",
    justifyContent: "center",
  },
  btnDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    border: "1.5px solid #e2e8f0",
    borderRadius: 99,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "not-allowed",
    direction: "rtl",
  },
  btnSecondary: {
    background: "#fff",
    color: "#475569",
    border: "1.5px solid #e2e8f0",
    borderRadius: 99,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "transform 0.1s",
    direction: "rtl",
  },
  btnGhost: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: 99,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    direction: "rtl",
  },
  btnListen: {
    background: "#eff6ff",
    color: "#3b82f6",
    border: "1.5px solid #bfdbfe",
    borderRadius: 99,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    direction: "rtl",
  },
  navRow: {
    display: "flex",
    gap: 10,
    marginTop: 16,
    width: "100%",
    justifyContent: "center",
  },
  quizHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  quizTitle: { fontSize: 17, fontWeight: 700, color: "#1e293b" },
  quizRound: {
    fontSize: 14,
    color: "#94a3b8",
    background: "#f1f5f9",
    borderRadius: 99,
    padding: "4px 12px",
  },
  quizHint: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
  optionBtn: {
    padding: "22px 10px",
    borderRadius: 14,
    fontSize: 34,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    fontFamily: "'Amiri', 'Traditional Arabic', serif",
    transition: "border 0.15s, background 0.15s, transform 0.1s",
    direction: "rtl",
    lineHeight: 1.2,
  },
  scoreWrap: { textAlign: "center", marginBottom: 16 },
  scoreBig: { fontSize: 64, fontWeight: 800, color: "#3b82f6", lineHeight: 1 },
  scoreOf: { fontSize: 32, color: "#94a3b8" },
  scoreLabel: { fontSize: 16, color: "#64748b", marginTop: 4 },
  tabRow: { display: "flex", gap: 8, marginBottom: 20, width: "100%" },
  tabActive: {
    flex: 1,
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 99,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    direction: "rtl",
  },
  tabInactive: {
    flex: 1,
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: 99,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    direction: "rtl",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    borderRadius: 14,
    border: "1.5px solid #e2e8f0",
    fontSize: 15,
    marginBottom: 12,
    direction: "rtl",
    fontFamily: "inherit",
    outline: "none",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 8,
    textAlign: "center",
  },
  hintNote: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 14,
    textAlign: "center",
    lineHeight: 1.6,
  },
  avatarGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    width: "100%",
  },
  avatarOption: {
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: 18,
    padding: "20px 10px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};
