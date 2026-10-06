import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
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


const form = document.getElementById("registerForm");

const studentNumber = document.getElementById("studentNumber");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const registerBtn = document.getElementById("registerBtn");
const errorMsg = document.getElementById("errorMsg");

// --- ID rules ---------------------------------------------------------
// IDs that start with "ADM-" (e.g. ADM-001) are Admin accounts. Everything else is a Student.
// Change this pattern if your real Admin IDs look different.
const ADMIN_ID_PATTERN = /^ADM-/i;
const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/;

function getRole(id) {
    return ADMIN_ID_PATTERN.test(id) ? "admin" : "student";
}

// The old built-in accounts (admin, superadmin, ...) also count as taken IDs
function isReservedId(id) {
    const reserved = ["admin", "superadmin"];
    try {
        const raw = localStorage.getItem("essu_accounts");
        if (raw) JSON.parse(raw).forEach((a) => reserved.push(String(a.studentId).toLowerCase()));
    } catch (e) {}
    return reserved.includes(id.toLowerCase());
}

async function isIdTaken(id) {
    if (isReservedId(id)) return true;
    const snapshot = await getDocs(query(collection(db, "students"), where("studentNumber", "==", id)));
    return !snapshot.empty;
}

if (registerBtn) {
    registerBtn.addEventListener("mouseenter", () => {
        registerBtn.style.transform = "translateY(-2px)";
        registerBtn.style.boxShadow = "0 6px 14px rgba(0,0,0,0.2)";
    });

    registerBtn.addEventListener("mouseleave", () => {
        registerBtn.style.transform = "translateY(0)";
        registerBtn.style.boxShadow = "none";
    });

    registerBtn.addEventListener("mousedown", () => {
        registerBtn.style.transform = "scale(0.95)";
    });

    registerBtn.addEventListener("mouseup", () => {
        registerBtn.style.transform = "translateY(-2px)";
    });
}

function shake(element) {
    if (!element) return;

    element.style.transform = "translateX(-6px)";

    setTimeout(() => { element.style.transform = "translateX(6px)"; }, 50);
    setTimeout(() => { element.style.transform = "translateX(-6px)"; }, 100);
    setTimeout(() => { element.style.transform = "translateX(6px)"; }, 150);
    setTimeout(() => { element.style.transform = "translateX(0)"; }, 200);
}

function showError(message) {
    if (!errorMsg) return;
    errorMsg.textContent = message;
    errorMsg.style.opacity = "1";
}

function hideError() {
    if (!errorMsg) return;
    errorMsg.textContent = "";
    errorMsg.style.opacity = "0";
}

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        hideError();

        const studentID = studentNumber.value.trim();
        const name = fullName.value.trim();
        const userEmail = email.value.trim().toLowerCase();
        const userPassword = password.value;
        const confirmPass = confirmPassword.value;

        // 1. Blank fields: name every field that is missing
        const missing = [];
        if (studentID === "") missing.push({ label: "Student ID", el: studentNumber });
        if (name === "") missing.push({ label: "Full name", el: fullName });
        if (userEmail === "") missing.push({ label: "Email", el: email });
        if (userPassword === "") missing.push({ label: "Password", el: password });
        if (confirmPass === "") missing.push({ label: "Confirm password", el: confirmPassword });

        if (missing.length > 0) {
            missing.forEach((m) => shake(m.el));
            const labels = missing.map((m) => m.label);
            showError(
                labels.length === 1
                    ? labels[0] + " is required."
                    : labels.slice(0, -1).join(", ") + " and " + labels[labels.length - 1] + " are required."
            );
            return;
        }

        // 2. ID format
        if (studentID.length > 32) {
            shake(studentNumber);
            showError("Student ID must not exceed 32 characters.");
            return;
        }

        if (!/^[A-Za-z0-9_-]+$/.test(studentID)) {
            shake(studentNumber);
            showError("Student ID can only contain letters, numbers, _ and -.");
            return;
        }

        // 3. Full name
        if (name.length > 100) {
            shake(fullName);
            showError("Full name must not exceed 100 characters.");
            return;
        }

        // 4. Email must be a Gmail address
        if (!GMAIL_REGEX.test(userEmail)) {
            shake(email);
            showError("Wrong email format.");
            return;
        }

        // 5. Password rules
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

        if (userPassword !== confirmPass) {
            shake(password);
            shake(confirmPassword);
            showError("Passwords do not match.");
            return;
        }

        try {
            registerBtn.disabled = true;
            registerBtn.textContent = "Registering...";

            // Each Student ID / Admin ID can only be registered once
            if (await isIdTaken(studentID)) {
                shake(studentNumber);
                showError("This ID is already registered.");
                return;
            }

            const role = getRole(studentID);

            // 1. Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

            const user = userCredential.user;

            // 2. Save the extra profile fields in Firestore, under the user's UID
            await setDoc(doc(db, "students", user.uid), {
                studentNumber: studentID,
                fullName: name,
                email: userEmail,
                role: role,                       // "student" or "admin"
                approved: role === "student",     // admin accounts wait for approval
                createdAt: serverTimestamp()
            });

            // 3. Curtain animation, then go to the login page
            go("login.html", role === "admin" ? "Admin account created. Awaiting approval." : "Registration successful!");

        } catch (error) {
            console.error("Submission Error:", error);

            switch (error.code) {
                case "auth/email-already-in-use":
                    showError("This email is already registered.");
                    break;
                case "auth/invalid-email":
                    showError("Please enter a valid email address.");
                    break;
                case "auth/weak-password":
                    showError("Password is too weak.");
                    break;
                default:
                    showError("Failed to register. Please try again.");
            }

        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = "Register";
        }
    });
}