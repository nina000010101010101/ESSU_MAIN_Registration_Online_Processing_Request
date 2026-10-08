import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

/* =====================================================================
   ANIMATIONS: curtain reveal on arrival, form entrance, focus glow,
   button ripple, and a curtain when leaving the page (go(url, message))
   ===================================================================== */
const go = (function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const N = 7;

  const style = document.createElement("style");
  style.textContent = `
  @keyframes aRise  { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes aCard  { from { opacity: 0; transform: translateY(30px) scale(.965); } to { opacity: 1; transform: none; } }
  @keyframes aDown  { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
  @keyframes aLine  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes aGlow  { 0%,100% { box-shadow: 0 0 0 0 rgba(240,205,108,.45); } 50% { box-shadow: 0 0 0 16px rgba(240,205,108,0); } }
  @keyframes aRipple { to { transform: scale(4); opacity: 0; } }
  @keyframes aPulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }

  #authTransition { position: fixed; inset: 0; z-index: 99999; visibility: hidden; pointer-events: none; overflow: hidden; }
  #authTransition.show { visibility: visible; pointer-events: auto; }
  #authTransition .layer { position: absolute; inset: 0; display: flex; }
  #authTransition .panel { flex: 1; height: 100%; transform: translateY(101%); transition: transform .65s cubic-bezier(.76,0,.24,1); }
  #authTransition .gold .panel   { background: linear-gradient(180deg, #f0cd6c, #c99a2e); }
  #authTransition .forest .panel { background: linear-gradient(180deg, #153a27, #0b2116); margin-left: -1px; }
  #authTransition.in .panel   { transform: translateY(0); }
  #authTransition.lift .panel { transform: translateY(-101%); }
  #authTransition .content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; padding: 24px; transition: opacity .35s ease; }
  #authTransition .content > * { opacity: 0; }
  #authTransition.in .content > * { animation: aRise .6s cubic-bezier(.22,1,.36,1) forwards; }
  #authTransition .crest { width: 92px; height: 92px; border-radius: 50%; overflow: hidden; margin-bottom: 20px; background: #153a27;
    border: 2px solid #e3b53f; display: flex; align-items: center; justify-content: center; }
  #authTransition .crest img { width: 100%; height: 100%; object-fit: contain; }
  #authTransition .crest span { color: #f0cd6c; font: 700 18px Poppins, sans-serif; }
  #authTransition.in .crest  { animation: aRise .6s cubic-bezier(.22,1,.36,1) .85s forwards, aGlow 1.6s ease-in-out 1.4s infinite; }
  #authTransition .title { color: #fff; font: 700 22px Poppins, sans-serif; margin: 0 0 6px; }
  #authTransition .line  { width: 120px; height: 2px; background: #e3b53f; margin: 12px 0; }
  #authTransition.in .line { animation: aLine .7s ease 1.1s forwards; opacity: 1; transform: scaleX(0); }
  #authTransition .msg   { color: #f0cd6c; font: 500 15px Inter, sans-serif; letter-spacing: .04em; margin: 0; }
  #authTransition.in .title { animation-delay: 1s; }
  #authTransition.in .msg   { animation-delay: 1.2s; }
  #authTransition.no-anim, #authTransition.no-anim * { transition: none !important; animation: none !important; }
  #authTransition.no-anim .content > * { opacity: 1 !important; }
  #authTransition.lift .content { opacity: 0; }
  #authTransition.lift .content > * { animation: none; opacity: 1; }

  .a-card { animation: aCard .8s cubic-bezier(.22,1,.36,1) backwards; }
  .a-item { animation: aRise .6s cubic-bezier(.22,1,.36,1) backwards; }
  .a-head { animation: aDown .6s cubic-bezier(.22,1,.36,1) backwards; }

  input, select, textarea { transition: box-shadow .25s ease, border-color .25s ease, background .25s ease; }
  input:focus, select:focus, textarea:focus { border-color: #e3b53f; box-shadow: 0 0 0 4px rgba(227,181,63,.25); outline: none; }
  form button[type="submit"], form button:not([type]) { position: relative; overflow: hidden; }
  form button:disabled { animation: aPulse 1s ease-in-out infinite; cursor: wait; }
  #errorMsg { transition: opacity .3s ease; }
  .a-ripple { position: absolute; border-radius: 50%; background: rgba(255,255,255,.55); transform: scale(0);
    animation: aRipple .6s ease-out; pointer-events: none; }
  @media (prefers-reduced-motion: reduce) { .a-card, .a-item, .a-head { animation: none !important; } }`;
  document.head.appendChild(style);

  /* curtain overlay: starts covering the page, then lifts */
  let arrivedMsg = null;                       /* set by the page we just left */
  try {
    const saved = JSON.parse(sessionStorage.getItem("essuTransition") || "null");
    sessionStorage.removeItem("essuTransition");
    if (saved && Date.now() - saved.t < 8000) arrivedMsg = saved.m;
  } catch (e) {}

  const overlay = document.createElement("div");
  overlay.id = "authTransition";
  overlay.className = arrivedMsg ? "show in no-anim" : "";
  const panels = (extra) => {
    let h = "";
    for (let i = 0; i < N; i++) h += '<div class="panel" style="transition-delay:' + (i * 0.06 + extra) + 's"></div>';
    return h;
  };
  overlay.innerHTML =
    '<div class="layer gold">' + panels(0) + "</div>" +
    '<div class="layer forest">' + panels(0.14) + "</div>" +
    '<div class="content">' +
      '<div class="crest"><img src="./img/logo2.png" alt="" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';"><span style="display:none">ESSU</span></div>' +
      '<h2 class="title">Eastern Samar State University</h2><div class="line"></div><p class="msg"></p>' +
    "</div>";
  document.documentElement.appendChild(overlay);
  const msg = overlay.querySelector(".msg");
  msg.textContent = arrivedMsg || "";

  function resetOverlay() {
    overlay.classList.add("no-anim");
    overlay.classList.remove("show", "in", "lift");
    void overlay.offsetWidth;
    overlay.classList.remove("no-anim");
  }

  /* form entrance */
  if (!reduce) {
    const base = arrivedMsg ? 0.8 : 0.1;
    document.querySelectorAll("form").forEach((f) => {
      const card = f.parentElement;
      if (card && card !== document.body) {
        card.classList.add("a-card");
        card.style.animationDelay = (base - 0.1) + "s";
        Array.from(card.children).forEach((el, i) => {
          if (el === f) return;
          el.classList.add("a-head");
          el.style.animationDelay = (base + 0.05 + i * 0.07) + "s";
        });
      }
      Array.from(f.children).forEach((el, i) => {
        el.classList.add("a-item");
        el.style.animationDelay = (base + 0.2 + i * 0.08) + "s";
      });
      f.addEventListener("click", (e) => {            /* ripple on the button */
        const b = e.target.closest('button[type="submit"], button:not([type])');
        if (!b || !f.contains(b)) return;
        const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
        const dot = document.createElement("span");
        dot.className = "a-ripple";
        dot.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (e.clientX - r.left - d / 2) + "px;top:" + (e.clientY - r.top - d / 2) + "px;";
        b.appendChild(dot);
        setTimeout(() => dot.remove(), 650);
      });
    });
  }

  /* lift the curtain (only when we arrived through one) */
  if (arrivedMsg) setTimeout(() => {
    if (reduce) { resetOverlay(); return; }
    overlay.classList.remove("no-anim");
    overlay.classList.add("lift");
    setTimeout(resetOverlay, 1400);
  }, reduce ? 0 : 350);

  /* leaving: curtain, then open the page */
  function leave(href, message) {
    msg.textContent = message;
    try { sessionStorage.setItem("essuTransition", JSON.stringify({ m: message, t: Date.now() })); } catch (e) {}
    overlay.classList.remove("lift", "no-anim");
    overlay.classList.add("show", "in");
    setTimeout(() => { window.location.href = href; }, reduce ? 250 : 1600);
  }

  /* links to login / register / home also use the curtain */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    const m = (a.getAttribute("href") || "").match(/(?:^|\/)(login|register|index)\.html(?:[?#].*)?$/i);
    if (!m) return;
    const here = (location.pathname.match(/([^\/]+)$/) || [])[1] || "";
    if (here.toLowerCase() === m[1].toLowerCase() + ".html") return;
    e.preventDefault();
    const w = m[1].toLowerCase();
    leave(a.href, w === "register" ? "Let's get you started" : w === "login" ? "Welcome back" : "Taking you home");
  });

  window.addEventListener("pageshow", (e) => { if (e.persisted) resetOverlay(); });
  return leave;
})();


// --- Legacy hardcoded accounts (admin / superadmin only, until those are migrated to Firebase) ---
const ACCOUNTS_KEY = "essu_accounts";

function loadAccounts() {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (raw) return JSON.parse(raw);

  const defaults = [
    { studentId: "superadmin", password: "SuperAdmin@123", role: "superadmin", fullName: "Super Admin", email: "" },
    { studentId: "admin", password: "admin123", role: "admin", fullName: "Admin", email: "" }
  ];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults));
  return defaults;
}

// --- Login form logic ---
const form = document.getElementById("loginForm");
const studentNumber = document.getElementById("studentNumber");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

// --- ID formats ---
const STUDENT_ID_FORMAT = /^\d{2}-\d{5}$/;     // Student: 00-00000
const ADMIN_ID_FORMAT   = /^\d{3}-\d{5}$/;     // Admin/Personnel: 000-00000

loginBtn.addEventListener("mouseenter", () => {
    loginBtn.style.transform = "translateY(-2px)";
    loginBtn.style.boxShadow = "0 6px 14px rgba(0,0,0,0.2)";
});

loginBtn.addEventListener("mouseleave", () => {
    loginBtn.style.transform = "translateY(0)";
    loginBtn.style.boxShadow = "none";
});

loginBtn.addEventListener("mousedown", () => {
    loginBtn.style.transform = "scale(0.95)";
});

loginBtn.addEventListener("mouseup", () => {
    loginBtn.style.transform = "translateY(-2px)";
});

// ID box: when the ID starts with a number it is shaped like 00-00000 (student)
// or 000-00000 (admin) as you type
studentNumber.addEventListener("input", () => {
    if (!/^[0-9-]/.test(studentNumber.value)) return;   // legacy "admin"/"superadmin" text IDs
    const raw = studentNumber.value.replace(/[^\d-]/g, "");
    const pos = raw.indexOf("-");
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length === 8) out = digits.slice(0, 3) + "-" + digits.slice(3);
    else if (digits.length === 7 && pos !== 3) out = digits.slice(0, 2) + "-" + digits.slice(2);
    else if ((pos === 2 || pos === 3) && digits.length >= pos) out = digits.slice(0, pos) + "-" + digits.slice(pos);
    studentNumber.value = out;
});

function shake(element) {
    element.style.transform = "translateX(-6px)";
    setTimeout(() => { element.style.transform = "translateX(6px)"; }, 50);
    setTimeout(() => { element.style.transform = "translateX(-6px)"; }, 100);
    setTimeout(() => { element.style.transform = "translateX(6px)"; }, 150);
    setTimeout(() => { element.style.transform = "translateX(0)"; }, 200);
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.opacity = "1";
}

function hideError() {
    errorMsg.style.opacity = "0";
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError();

    const username = String(studentNumber.value).trim();
    const userPassword = password.value.trim();

    // 1. Blank fields: name every field that is missing
    const missing = [];
    if (username === "") missing.push({ label: "Student ID/Admin ID", el: studentNumber });
    if (userPassword === "") missing.push({ label: "Password", el: password });

    if (missing.length > 0) {
        missing.forEach((m) => shake(m.el));
        showError(missing.map((m) => m.label).join(" and ") + (missing.length === 1 ? " is required." : " are required."));
        return;
    }

    // 2. ID format (the built-in admin / superadmin accounts are exempt)
    const isBuiltIn = loadAccounts().some((acc) => acc.studentId === username);

    if (!isBuiltIn) {
        if (!STUDENT_ID_FORMAT.test(username) && !ADMIN_ID_FORMAT.test(username)) {
            shake(studentNumber);
            showError("Invalid ID. Student: 00-00000. Admin/Personnel: 000-00000.");
            return;
        }
    }

    // 3. Password length
    if (userPassword.length < 8) {
        shake(password);
        showError("Password should have at least 8 characters.");
        return;
    }

    if (userPassword.length > 32) {
        shake(password);
        showError("Password must not exceed 32 characters.");
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
        // 1. Check legacy hardcoded admin / superadmin accounts first
        const accounts = loadAccounts();
        const localMatch = accounts.find(
            (acc) => acc.studentId === username && acc.password === userPassword
        );

        if (localMatch) {
            sessionStorage.setItem(
                "essu_currentUser",
                JSON.stringify({ studentId: localMatch.studentId, role: localMatch.role, fullName: localMatch.fullName })
            );

            if (localMatch.role === "superadmin") {
                go("superadmin-dashboard.html", "Welcome, " + localMatch.fullName);
            } else {
                go("admin-dashboard.html", "Welcome, " + localMatch.fullName);
            }
            return;
        }

        // 2. Otherwise, look up the student's email in Firestore by their Student ID
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("studentNumber", "==", username));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            shake(studentNumber);
            shake(password);
            showError("Invalid Student ID/Admin ID or password.");
            return;
        }

        const studentDoc = snapshot.docs[0].data();

        // 3. Sign in with Firebase Auth using that email + the entered password
        const userCredential = await signInWithEmailAndPassword(auth, studentDoc.email, userPassword);
        const user = userCredential.user;

        // The role comes from the account saved in the database, not from the login form
        const role = studentDoc.role === "admin" ? "admin" : "student";

        // Admin accounts must be approved before they can log in
        if (role === "admin" && studentDoc.approved !== true) {
            await signOut(auth);
            showError("Your admin account is still awaiting approval.");
            return;
        }

        sessionStorage.setItem(
            "essu_currentUser",
            JSON.stringify({ uid: user.uid, studentId: studentDoc.studentNumber, role: role, fullName: studentDoc.fullName })
        );

        go(role === "admin" ? "admin-dashboard.html" : "student-dashboard.html", "Welcome, " + studentDoc.fullName);

    } catch (error) {
        console.error("Login error:", error);

        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                shake(studentNumber);
                shake(password);
                showError("Invalid Student ID/Admin ID or password.");
                break;
            default:
                showError("Failed to log in. Please try again.");
        }

    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
});