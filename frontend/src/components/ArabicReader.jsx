import { useState, useEffect, useRef, useCallback } from "react";

const WORDS = [
  "أنا","أنت","هو","هي","نحن","هم","هذا","هذه","ذلك","هنا",
  "هناك","في","على","إلى","من","عن","مع","بين","تحت","فوق",
  "ثم","و","أو","لكن","لأن","نعم","لا","كل","بعض","كثير",
  "قليل","اليوم","أمس","غدًا","صباح","مساء","بيت","باب","نافذة","غرفة",
  "مدرسة","صف","كتاب","دفتر","قلم","حقيبة","معلم","طالب","ولد","بنت",
  "أم","أب","أخ","أخت","جد","جدة","طفل","رجل","امرأة","صديق",
  "ماء","طعام","خبز","حليب","تفاح","سيارة","شارع","شجرة","زهرة","شمس",
  "قمر","سماء","أرض","بحر","نهر","جبل","لون","أحمر","أزرق","أخضر",
  "كبير","صغير","طويل","قصير","جميل","سريع","بطيء","فتح","أغلق","ذهب",
  "جاء","جلس","وقف","لعب","كتب","قرأ","أكل","شرب","نام","أحب",
];

const AVATARS = ["🦉","😊","🌟","🎉","💪"];
const toAr = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function speak(word, onEnd) {
  const audio = new Audio(`/audio/${word}.mp3`);

  if (onEnd) audio.onended = onEnd;
  
  // الـ catch ده بيحمي الكود لو الملف مش موجود أو المتصفح منعه
  audio.play().catch(err => {
    console.error(`تعذر تشغيل الصوت للكلمة: ${word}`, err);
  });
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function ArabicReader() {
  // currentIdx = index of the first word in the CURRENT unlocked batch (0,5,10,...)
  // wordPos = position within the current batch (0-4)
  const [batchStart, setBatchStart] = useState(0); // 0,5,10...
  const [wordPos, setWordPos]       = useState(0); // 0-4 within batch
  const [phase, setPhase]           = useState("learn"); // "learn" | "quiz"
  const [avatarAnim, setAvatarAnim] = useState("");
  const [bubbleMsg, setBubbleMsg]   = useState("أهلاً! استمع للكلمة ثم انتقل للتالية 😊");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // quiz state
  const [quizRound, setQuizRound]       = useState(0);
  const [quizTarget, setQuizTarget]     = useState("");
  const [quizOptions, setQuizOptions]   = useState([]);
  const [quizResults, setQuizResults]   = useState([]);
  const [selectedOpt, setSelectedOpt]   = useState(null); // null | { word, correct }
  const [quizDone, setQuizDone]         = useState(false);
  const repeatRef = useRef(null);

  const currentWordIdx = batchStart + wordPos;
  const currentWord    = WORDS[currentWordIdx];
  const totalBatches   = Math.ceil(WORDS.length / 5);
  const currentBatch   = batchStart / 5; // 0-based

  // ── Avatar animation helper ──
  function animAvatar(type) {
    setAvatarAnim(type);
    setTimeout(() => setAvatarAnim(""), 700);
  }

  // ── Speak with speaking state ──
  function speakWord(word, onEnd) {
    setIsSpeaking(true);
    animAvatar("talk");
    speak(word, () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    });
  }

  // ── Learn phase: speak current ──
  function handleSpeak() {
    setBubbleMsg("استمع جيداً... 👂");
    speakWord(currentWord);
  }

  // ── Learn phase: go to next word ──
  function handleNext() {
    if (wordPos < 4) {
      setWordPos(wordPos + 1);
      setBubbleMsg("ممتاز! كلمة جديدة 🌟");
    } else {
      // Finished 5 words → start quiz
      startQuiz();
    }
  }

  function handlePrev() {
    if (wordPos > 0) {
      setWordPos(wordPos - 1);
      setBubbleMsg("العودة للكلمة السابقة ↩️");
    }
  }

  // ── Start quiz ───────────────────────────────────────────────────────────
  function startQuiz() {
    setPhase("quiz");
    setQuizRound(0);
    setQuizResults([]);
    setQuizDone(false);
    setSelectedOpt(null);
    setBubbleMsg("وقت الاختبار! استمع واختر الكلمة الصحيحة 🎯");
    // build first round after short delay
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
    // auto-play sound
    setTimeout(() => {
      speakWord(targetWord);
      scheduleRepeat(targetWord);
    }, 400);
  }

  // keep repeating sound until answered
  function scheduleRepeat(word) {
    clearTimeout(repeatRef.current);
    repeatRef.current = setTimeout(() => {
      if (!selectedOpt) {
        speakWord(word, () => scheduleRepeat(word));
      }
    }, 3500);
  }

  useEffect(() => {
    return () => clearTimeout(repeatRef.current);
  }, []);

  function handleQuizAnswer(word) {
    if (selectedOpt) return; // already answered
    clearTimeout(repeatRef.current);
    window.speechSynthesis.cancel();
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
        setBubbleMsg(`انتهى الاختبار! نتيجتك ${toAr(score)}/٥ 🏆`);
        animAvatar(score >= 4 ? "happy" : "");
      }
    }, 1500);
  }

  function handleReplay() {
    speakWord(quizTarget);
    scheduleRepeat(quizTarget);
  }

  // ── After quiz: continue to next batch ───────────────────────────────────
  function handleContinue() {
    clearTimeout(repeatRef.current);
    window.speechSynthesis.cancel();
    const nextBatch = batchStart + 5;
    if (nextBatch >= WORDS.length) {
      setBubbleMsg("أحسنت! أكملت جميع الكلمات 🎊");
      setPhase("done");
      animAvatar("happy");
      return;
    }
    setBatchStart(nextBatch);
    setWordPos(0);
    setPhase("learn");
    setBubbleMsg("مجموعة جديدة! هيا نتعلم 🚀");
  }

  // u2500u2500 Review: go back to the 5 words u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500
  function handleReviewWords() {
    clearTimeout(repeatRef.current);
    window.speechSynthesis.cancel();
    setWordPos(0);
    setPhase("learn");
    setBubbleMsg("u0631u0627u062cu0639 u0627u0644u0643u0644u0645u0627u062a u0648u0627u0631u062cu0639 u0644u0644u0627u062eu062au0628u0627u0631 ud83dudcd6");
  }

  // u2500u2500 Retry: redo the quiz for same batch u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500
  function handleRetryQuiz() {
    clearTimeout(repeatRef.current);
    window.speechSynthesis.cancel();
    setQuizRound(0);
    setQuizResults([]);
    setQuizDone(false);
    setSelectedOpt(null);
    setBubbleMsg("u062du0627u0648u0644 u0645u0631u0629 u062bu0627u0646u064au0629! ud83dudcaa");
    setTimeout(() => buildRound(0), 300);
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  const learnedCount = batchStart + (phase === "learn" ? wordPos : 5);
  const progressPct  = Math.round((learnedCount / WORDS.length) * 100);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.topLabel}>
          {toAr(Math.min(learnedCount + 1, WORDS.length))} / {toAr(WORDS.length)}
        </span>
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressFill, width: progressPct + "%" }} />
        </div>
        <span style={styles.topLabel}>{toAr(progressPct)}%</span>
      </div>

      {/* Batch dots */}
      <div style={styles.batchDots}>
        {Array.from({ length: totalBatches }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.batchDot,
              background:
                i < currentBatch
                  ? "#3b82f6"
                  : i === currentBatch
                  ? "#93c5fd"
                  : "#e2e8f0",
            }}
          />
        ))}
      </div>

      {/* Avatar */}
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
        🦉
      </div>

      {/* Speech bubble */}
      <div style={styles.bubble}>{bubbleMsg}</div>

      {/* ── LEARN PHASE ── */}
      {phase === "learn" && (
        <div style={styles.card}>
          {/* mini progress dots within batch */}
          <div style={styles.miniDots}>
            {[0,1,2,3,4].map((i) => (
              <div
                key={i}
                style={{
                  ...styles.miniDot,
                  background: i < wordPos ? "#3b82f6" : i === wordPos ? "#93c5fd" : "#e2e8f0",
                  transform: i === wordPos ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* Word */}
          <div style={styles.wordText}>{currentWord}</div>
          <div style={styles.wordSub}>
            كلمة {toAr(wordPos + 1)} من ٥ — المجموعة {toAr(currentBatch + 1)}
          </div>

          {/* Speak button */}
          <button
            style={{ ...styles.btnPrimary, marginTop: 20 }}
            onClick={handleSpeak}
            disabled={isSpeaking}
          >
            <SpeakerIcon /> &nbsp; استمع للكلمة
          </button>

          {/* Nav */}
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
        </div>
      )}

      {/* ── QUIZ PHASE ── */}
      {phase === "quiz" && !quizDone && (
        <div style={styles.card}>
          <div style={styles.quizHeader}>
            <span style={styles.quizTitle}>اختبار المجموعة {toAr(currentBatch + 1)}</span>
            <span style={styles.quizRound}>
              {toAr(quizRound + 1)} / ٥
            </span>
          </div>

          {/* Result dots */}
          <div style={styles.miniDots}>
            {[0,1,2,3,4].map((i) => (
              <div
                key={i}
                style={{
                  ...styles.miniDot,
                  background:
                    i < quizResults.length
                      ? quizResults[i] ? "#22c55e" : "#ef4444"
                      : i === quizRound ? "#93c5fd" : "#e2e8f0",
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
              let bg = "#fff";
              let border = "1.5px solid #e2e8f0";
              let color = "#1e293b";
              if (selectedOpt) {
                if (w === quizTarget) {
                  bg = "#dcfce7"; border = "2px solid #22c55e"; color = "#15803d";
                } else if (w === selectedOpt.word && !selectedOpt.correct) {
                  bg = "#fee2e2"; border = "2px solid #ef4444"; color = "#b91c1c";
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

      {/* ── QUIZ DONE ── */}
      {phase === "quiz" && quizDone && (
        <div style={styles.card}>
          <div style={styles.scoreWrap}>
            <div style={styles.scoreBig}>
              {toAr(quizResults.filter(Boolean).length)}<span style={styles.scoreOf}>/٥</span>
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
                  width: 14, height: 14,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, width: "100%" }}>
            {batchStart + 5 < WORDS.length && (
              <button style={styles.btnPrimary} onClick={handleContinue}>
                متابعة التعلم 🚀
              </button>
            )}
            {batchStart + 5 >= WORDS.length && (
              <div style={{ color: "#15803d", fontWeight: 700, fontSize: 22, textAlign: "center" }}>
                🎊 أنهيت جميع الكلمات!
              </div>
            )}
            <button style={styles.btnSecondary} onClick={handleRetryQuiz}>
              🔁 أعد الاختبار
            </button>
            <button style={styles.btnSecondary} onClick={handleReviewWords}>
              📖 راجع الكلمات الـ٥
            </button>
          </div>
        </div>
      )}

      {/* ── ALL DONE ── */}
      {phase === "done" && (
        <div style={styles.card}>
          <div style={{ fontSize: 64 }}>🎊</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 12 }}>
            أحسنت! أتقنت جميع الكلمات
          </div>
        </div>
      )}

      {/* CSS animations */}
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

// ─── Speaker icon ────────────────────────────────────────────────────────────
function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "middle" }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  wordSub: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 0,
  },
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
  quizTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1e293b",
  },
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
  optionsGridFive: {
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
  scoreWrap: {
    textAlign: "center",
    marginBottom: 16,
  },
  scoreBig: {
    fontSize: 64,
    fontWeight: 800,
    color: "#3b82f6",
    lineHeight: 1,
  },
  scoreOf: {
    fontSize: 32,
    color: "#94a3b8",
  },
  scoreLabel: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
};
