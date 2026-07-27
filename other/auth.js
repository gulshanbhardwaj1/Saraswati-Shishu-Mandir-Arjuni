/* =============================================================
   auth.js — सरस्वती शिशु मंदिर, अर्जुनी
   -------------------------------------------------------------
   यह फ़ाइल पूरी तरह JavaScript से एक लॉगिन/साइनअप/प्रोफ़ाइल पॉपअप
   बनाती है — कोई अलग HTML फ़ाइल नहीं है, सब कुछ इसी स्क्रिप्ट से
   पेज में inject (जोड़ा) होता है।

   उपयोग: index.html में इस फ़ाइल को लिंक करें, ठीक script.js के बाद —

     <script src="script.js"></script>
     <script src="auth.js"></script>

   ज़रूरी शर्तें:
   1) index.html में Firebase SDK स्क्रिप्ट्स (app/firestore/storage/auth)
      पहले से लगी हों (जैसा मुख्य साइट में पहले से है)।
   2) style.css पहले से लोड हो — यह फ़ाइल उसी की रंग-योजना (--saffron,
      --navy, --sky आदि CSS वेरिएबल) का उपयोग करती है, ताकि पॉपअप
      मुख्य पृष्ठ जैसा ही दिखे और डार्क मोड में भी सही रहे।
   3) साइडबार/ड्रॉअर में जो "लॉगिन" वाला नया लिंक आप जोड़ेंगे, उसमें
      क्लास  class="ssm-login-trigger"  ज़रूर लगाएँ, जैसे:

        <li><a href="#" class="nav-link ssm-login-trigger">लॉगिन</a></li>
        <li><a href="#" class="drawer-link ssm-login-trigger">लॉगिन</a></li>

      यह स्क्रिप्ट खुद ही उन लिंक(s) को ढूँढ कर क्लिक जोड़ देगी।
   ============================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------
     1. FIREBASE CONFIG (placeholder) — यहाँ वही डालें जो script.js
        वाली फ़ाइल में डाला था (दोनों जगह एक ही प्रोजेक्ट का config
        होना चाहिए)। अगर script.js पहले से firebase.initializeApp()
        कर चुकी है, तो यह कोड दोबारा initialize नहीं करेगा — इससे
        कोई टकराव (conflict) नहीं होगा।
     ----------------------------------------------------------- */
  const firebaseConfig = {
  apiKey: "AIzaSyA3hhobZdMiccTYUlJJlGzqcInCyYI5tl4",
  authDomain: "saraswati-shishu-mandir-arjuni.firebaseapp.com",
  databaseURL: "https://saraswati-shishu-mandir-arjuni-default-rtdb.firebaseio.com",
  projectId: "saraswati-shishu-mandir-arjuni",
  storageBucket: "saraswati-shishu-mandir-arjuni.firebasestorage.app",
  messagingSenderId: "993993303304",
  appId: "1:993993303304:web:5ef6364df7ff26ced978bd"
};

  let auth = null, db = null, storage = null, firebaseReady = false;

  try {
    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK लोड नहीं है — index.html में firebase-app/auth/firestore/storage स्क्रिप्ट्स जोड़ें।");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    firebaseReady = true;
  } catch (err) {
    console.warn("auth.js: Firebase तैयार नहीं है —", err.message);
  }

  /* -----------------------------------------------------------
     2. STYLES — मुख्य साइट के CSS वेरिएबल्स (style.css) का उपयोग,
        ताकि थीम/रंग/डार्क-मोड सब कुछ अपने-आप मैच हो जाए।
     ----------------------------------------------------------- */
  const css = `
  .ssm-auth-overlay{
    position:fixed; inset:0; z-index:5000; display:none;
    align-items:center; justify-content:center; padding:20px;
    background:rgba(6,14,26,.6); backdrop-filter:blur(6px);
    opacity:0; transition:opacity .3s ease;
  }
  .ssm-auth-overlay.open{ display:flex; opacity:1; }
  .ssm-auth-modal{
    position:relative; width:100%; max-width:440px; max-height:88vh; overflow-y:auto;
    background:var(--surface,#fff); color:var(--text,#16263D);
    border-radius:var(--radius-lg,26px); box-shadow:var(--shadow,0 10px 30px -12px rgba(15,37,64,.3));
    padding:34px 30px 30px; font-family:var(--font-body,'Noto Sans Devanagari',sans-serif);
    transform:translateY(16px) scale(.98); transition:transform .3s ease;
  }
  .ssm-auth-overlay.open .ssm-auth-modal{ transform:translateY(0) scale(1); }
  .ssm-close-btn{
    position:absolute; top:16px; right:16px; width:38px; height:38px; border-radius:50%;
    background:var(--sky,#EAF5FC); border:2px solid var(--saffron,#FF6A1A); color:var(--navy,#0F2540);
    font-size:1.4rem; line-height:1; font-family:Arial,sans-serif; font-weight:700; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:.25s;
  }
  .ssm-close-btn:hover{ background:var(--saffron,#FF6A1A); color:#fff; transform:rotate(90deg); }
  .ssm-home-link{
    position:absolute; top:16px; left:16px; display:flex; align-items:center; gap:6px;
    padding:8px 14px; border-radius:30px; background:var(--sky,#EAF5FC);
    border:2px solid var(--saffron-light,#FFB067); color:var(--navy,#0F2540); font-weight:700;
    font-size:.82rem; cursor:pointer; transition:.25s;
  }
  .ssm-home-link:hover{ background:var(--saffron,#FF6A1A); color:#fff; }

  .ssm-auth-header{ text-align:center; margin:26px 0 18px; }
  .ssm-auth-logo{ width:56px; height:56px; border-radius:50%; border:3px solid var(--saffron,#FF6A1A); padding:3px; margin-bottom:8px; }
  .ssm-auth-header h2{ font-family:var(--font-display,'Baloo 2',sans-serif); font-size:1.15rem; color:var(--navy,#0F2540); }
  .ssm-auth-tagline{ font-size:.85rem; color:var(--text-soft,#4C5C72); margin-top:2px; }

  .ssm-auth-tabs{ display:flex; gap:8px; background:var(--bg-alt,#EAF5FC); border-radius:30px; padding:5px; margin-bottom:20px; }
  .ssm-tab{
    flex:1; padding:10px 0; border-radius:26px; border:none; background:none; cursor:pointer;
    font-family:var(--font-display,'Baloo 2',sans-serif); font-weight:700; font-size:.92rem;
    color:var(--text-soft,#4C5C72); transition:.25s;
  }
  .ssm-tab.active{ background:var(--saffron,#FF6A1A); color:#fff; }

  .ssm-auth-form{ display:flex; flex-direction:column; gap:5px; }
  .ssm-auth-form label{ font-size:.82rem; font-weight:700; color:var(--text-soft,#4C5C72); margin-top:8px; }
  .ssm-auth-form input, .ssm-auth-form textarea{
    padding:11px 14px; border-radius:10px; border:1px solid var(--card-border,#E2E9F1);
    background:var(--bg,#fff); color:var(--text,#16263D); font-family:inherit; font-size:.92rem; outline:none;
  }
  .ssm-auth-form input:focus, .ssm-auth-form textarea:focus{ border-color:var(--saffron,#FF6A1A); }
  .ssm-btn-primary, .ssm-btn-secondary, .ssm-btn-outline{
    margin-top:16px; padding:12px 18px; border-radius:30px; font-weight:700; text-align:center;
    font-family:var(--font-display,'Baloo 2',sans-serif); font-size:.92rem; cursor:pointer; border:none;
    transition:.25s; text-decoration:none; display:inline-block;
  }
  .ssm-btn-primary{ background:linear-gradient(135deg,var(--saffron,#FF6A1A),#E8540B); color:#fff; }
  .ssm-btn-primary:hover{ transform:translateY(-2px); }
  .ssm-btn-secondary{ background:var(--sky-mid,#CFE8F7); color:var(--navy,#0F2540); }
  .ssm-btn-outline{ background:none; border:2px solid var(--saffron,#FF6A1A); color:var(--saffron,#FF6A1A); }
  .ssm-btn-outline:hover{ background:var(--saffron,#FF6A1A); color:#fff; }
  .ssm-logout-btn{ width:100%; margin-top:18px; }

  .ssm-auth-error{ color:#D93025; font-size:.82rem; margin-top:8px; min-height:1em; }
  .ssm-auth-success{ color:var(--green-accent,#0B6E4F); font-size:.82rem; margin-top:8px; min-height:1em; }

  .ssm-google-btn{
    display:flex; align-items:center; justify-content:center; gap:12px;
    width:100%; margin-top:6px; padding:13px 18px; border-radius:12px;
    background:#fff; border:1.5px solid var(--card-border,#E2E9F1); color:#3c4043;
    font-family:var(--font-body,'Noto Sans Devanagari',sans-serif); font-weight:700; font-size:.95rem;
    cursor:pointer; transition:.25s; box-shadow:var(--shadow-sm,0 4px 14px -6px rgba(15,37,64,.15));
  }
  .ssm-google-btn:hover{ transform:translateY(-2px); box-shadow:var(--shadow,0 10px 30px -12px rgba(15,37,64,.25)); }
  .ssm-google-btn svg{ width:20px; height:20px; flex-shrink:0; }

  .ssm-profile-header{ text-align:center; margin:22px 0 6px; }
  .ssm-avatar-wrap{ position:relative; width:96px; height:96px; margin:0 auto 12px; }
  .ssm-avatar-wrap img{
    width:100%; height:100%; border-radius:50%; object-fit:cover; border:4px solid var(--saffron-soft,#FFF1E4);
    background:var(--sky-mid,#CFE8F7);
  }
  .ssm-avatar-edit{
    position:absolute; bottom:-2px; right:-2px; width:30px; height:30px; border-radius:50%;
    background:var(--saffron,#FF6A1A); color:#fff; display:flex; align-items:center; justify-content:center;
    cursor:pointer; border:2px solid var(--surface,#fff); font-size:.9rem;
  }
  .ssm-profile-header h3{ font-family:var(--font-display,'Baloo 2',sans-serif); font-size:1.1rem; }
  .ssm-profile-header p{ font-size:.85rem; color:var(--text-soft,#4C5C72); }

  .ssm-divider{ border:none; border-top:1px solid var(--card-border,#E2E9F1); margin:22px 0; }
  .ssm-message-section h4{ font-family:var(--font-display,'Baloo 2',sans-serif); font-size:1rem; margin-bottom:6px; }
  .ssm-msg-actions{ display:flex; gap:10px; margin-top:14px; flex-wrap:wrap; }
  .ssm-msg-actions .ssm-btn-primary, .ssm-msg-actions .ssm-btn-outline{ margin-top:0; flex:1; text-align:center; }

  .ssm-login-trigger{ cursor:pointer; }
  `;
  const styleTag = document.createElement("style");
  styleTag.setAttribute("data-ssm-auth", "true");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* -----------------------------------------------------------
     3. MODAL MARKUP (inject into <body>)
     ----------------------------------------------------------- */
  const modalHTML = `
  <div class="ssm-auth-overlay" id="ssmAuthOverlay" aria-hidden="true">
    <div class="ssm-auth-modal" role="dialog" aria-modal="true" aria-label="लॉगिन एवं प्रोफ़ाइल">
      <button class="ssm-home-link" id="ssmAuthHome" title="मुख्य पृष्ठ पर जाएँ">&larr; मुख्य पृष्ठ</button>
      <button class="ssm-close-btn" id="ssmAuthClose" aria-label="बंद करें">&times;</button>

      <!-- ===== लॉग्ड-आउट व्यू: केवल Google से लॉगिन ===== -->
      <div id="ssmAuthLoggedOut">
        <div class="ssm-auth-header">
          <img class="ssm-auth-logo" src="https://api.iconify.design/mdi:school.svg?color=%23FF6A1A" alt="">
          <h2>सरस्वती शिशु मंदिर, अर्जुनी</h2>
          <p class="ssm-auth-tagline">जारी रखने हेतु अपने Google खाते से लॉगिन करें</p>
        </div>

        <button type="button" id="ssmGoogleBtn" class="ssm-google-btn">
          <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.6 5.1C9.6 39.7 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.6 5.6C39.7 37.4 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
          Google से लॉगिन करें
        </button>
        <p class="ssm-auth-error" id="ssmGoogleError"></p>
      </div>

      <!-- ===== लॉग्ड-इन व्यू: प्रोफ़ाइल + संदेश फ़ॉर्म ===== -->
      <div id="ssmAuthLoggedIn" hidden>
        <div class="ssm-profile-header">
          <div class="ssm-avatar-wrap">
            <img id="ssmProfilePhoto" src="https://api.iconify.design/mdi:account-circle.svg?color=%23CFE8F7" alt="प्रोफ़ाइल फ़ोटो">
            <label class="ssm-avatar-edit" for="ssmProfilePhotoInput" title="फ़ोटो बदलें">&#9998;
              <input type="file" id="ssmProfilePhotoInput" accept="image/*" hidden>
            </label>
          </div>
          <h3 id="ssmProfileName">—</h3>
          <p id="ssmProfileEmail">—</p>
        </div>

        <form id="ssmProfileForm" class="ssm-auth-form">
          <label for="ssmProfileNameInput">पूरा नाम</label>
          <input type="text" id="ssmProfileNameInput">
          <label for="ssmProfilePhoneInput">फ़ोन नंबर</label>
          <input type="tel" id="ssmProfilePhoneInput">
          <label for="ssmProfileAddressInput">पता</label>
          <input type="text" id="ssmProfileAddressInput">
          <button type="submit" class="ssm-btn-secondary">प्रोफ़ाइल सहेजें</button>
          <p class="ssm-auth-success" id="ssmProfileSaved"></p>
        </form>

        <hr class="ssm-divider">

        <div class="ssm-message-section">
          <h4>विद्यालय को संदेश भेजें</h4>
          <form id="ssmMessageForm" class="ssm-auth-form">
            <label for="ssmMsgEmail">ईमेल</label>
            <input type="email" id="ssmMsgEmail">
            <label for="ssmMsgPhone">फ़ोन नंबर</label>
            <input type="tel" id="ssmMsgPhone">
            <label for="ssmMsgText">संदेश</label>
            <textarea id="ssmMsgText" rows="4" required placeholder="अपना संदेश यहाँ लिखें..."></textarea>
            <div class="ssm-msg-actions">
              <button type="submit" class="ssm-btn-primary">संदेश भेजें</button>
              <a href="#" id="ssmMsgEmailLink" class="ssm-btn-outline">ईमेल से भेजें</a>
            </div>
            <p class="ssm-auth-success" id="ssmMsgSent"></p>
          </form>
        </div>

        <button class="ssm-btn-outline ssm-logout-btn" id="ssmLogoutBtn" type="button">लॉगआउट करें</button>
      </div>
    </div>
  </div>`;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const overlay = document.getElementById("ssmAuthOverlay");
    const loggedOutView = document.getElementById("ssmAuthLoggedOut");
    const loggedInView = document.getElementById("ssmAuthLoggedIn");

    let manuallyClosed = false;

    /* ---------- खोलना / बंद करना ---------- */
    function openModal() {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeModal() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      manuallyClosed = true;
    }
    document.getElementById("ssmAuthClose").addEventListener("click", closeModal);
    document.getElementById("ssmAuthHome").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });

    // साइडबार/ड्रॉअर में जो भी लिंक class="ssm-login-trigger" रखते हैं, उन पर क्लिक पकड़ें।
    // event delegation (document पर सुनना) इसलिए किया है ताकि अगर वह लिंक बाद में जुड़े
    // (जैसे मोबाइल ड्रॉअर) या href गलती से किसी और जगह point कर रहा हो, तब भी क्लिक
    // सही तरीक़े से पकड़ में आए और पॉपअप ही खुले — पेज कहीं और नेविगेट न हो।
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest(".ssm-login-trigger");
      if (trigger) {
        e.preventDefault();
        openModal();
      }
    });

    if (!firebaseReady) {
      loggedOutView.insertAdjacentHTML("beforeend",
        `<p class="ssm-auth-error">Firebase कनेक्ट नहीं है — कृपया auth.js में firebaseConfig भरें।</p>`);
      return;
    }

    /* ---------- Google से लॉगिन ---------- */
    document.getElementById("ssmGoogleBtn").addEventListener("click", async () => {
      const errorEl = document.getElementById("ssmGoogleError");
      errorEl.textContent = "";
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        // पहली बार लॉगिन करने पर "users" कलेक्शन में uid के नाम से डॉक्यूमेंट बना दें
        const userRef = db.collection("users").doc(user.uid);
        const snap = await userRef.get();
        if (!snap.exists) {
          await userRef.set({
            name: user.displayName || "",
            email: user.email || "",
            phone: "",
            address: "",
            photoURL: user.photoURL || "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (err) {
        errorEl.textContent = friendlyError(err);
      }
    });

    /* ---------- लॉगआउट ---------- */
    document.getElementById("ssmLogoutBtn").addEventListener("click", () => auth.signOut());

    /* ---------- प्रोफ़ाइल फ़ोटो अपलोड ---------- */
    document.getElementById("ssmProfilePhotoInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file || !auth.currentUser) return;
      try {
        const path = `profile-photos/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
        const ref = storage.ref().child(path);
        await ref.put(file);
        const url = await ref.getDownloadURL();
        document.getElementById("ssmProfilePhoto").src = url;
        await auth.currentUser.updateProfile({ photoURL: url });
        await db.collection("users").doc(auth.currentUser.uid).update({ photoURL: url });
      } catch (err) {
        alert("फ़ोटो अपलोड नहीं हो पाई: " + friendlyError(err));
      }
    });

    /* ---------- प्रोफ़ाइल जानकारी सहेजना ---------- */
    document.getElementById("ssmProfileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const savedEl = document.getElementById("ssmProfileSaved");
      if (!auth.currentUser) return;
      const name = document.getElementById("ssmProfileNameInput").value.trim();
      const phone = document.getElementById("ssmProfilePhoneInput").value.trim();
      const address = document.getElementById("ssmProfileAddressInput").value.trim();
      try {
        await auth.currentUser.updateProfile({ displayName: name });
        await db.collection("users").doc(auth.currentUser.uid).set(
          { name, phone, address }, { merge: true }
        );
        document.getElementById("ssmProfileName").textContent = name || "—";
        updateTriggerLabels(auth.currentUser, name);
        savedEl.textContent = "प्रोफ़ाइल सहेजी गई ✓";
        setTimeout(() => (savedEl.textContent = ""), 2500);
      } catch (err) {
        savedEl.textContent = "";
        alert("सहेजने में समस्या: " + friendlyError(err));
      }
    });

    /* ---------- विद्यालय को संदेश भेजना ---------- */
    const msgForm = document.getElementById("ssmMessageForm");
    msgForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const sentEl = document.getElementById("ssmMsgSent");
      const email = document.getElementById("ssmMsgEmail").value.trim();
      const phone = document.getElementById("ssmMsgPhone").value.trim();
      const message = document.getElementById("ssmMsgText").value.trim();
      try {
        await db.collection("messages").add({
          uid: auth.currentUser ? auth.currentUser.uid : null,
          name: auth.currentUser ? auth.currentUser.displayName || "" : "",
          email, phone, message,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        msgForm.reset();
        sentEl.textContent = "संदेश भेज दिया गया ✓";
        setTimeout(() => (sentEl.textContent = ""), 3000);
      } catch (err) {
        alert("संदेश भेजने में समस्या: " + friendlyError(err));
      }
    });

    // "ईमेल से भेजें" — mailto: लिंक, स्कूल का ईमेल पेज पर पहले से दिख रहे संपर्क से उठाया जाता है
    document.getElementById("ssmMsgEmailLink").addEventListener("click", (e) => {
      e.preventDefault();
      const schoolEmail = document.getElementById("contactEmail")?.textContent?.trim() || "info@ssmarjuni.edu.in";
      const message = document.getElementById("ssmMsgText").value.trim();
      const subject = encodeURIComponent("विद्यालय हेतु संदेश");
      const body = encodeURIComponent(message);
      window.location.href = `mailto:${schoolEmail}?subject=${subject}&body=${body}`;
    });

    /* ---------- लॉगिन-स्थिति अनुसार व्यू बदलना ---------- */
    function updateTriggerLabels(user, nameOverride) {
      const label = user ? (nameOverride || user.displayName || "प्रोफ़ाइल") : "लॉगिन";
      document.querySelectorAll(".ssm-login-trigger").forEach(t => (t.textContent = label));
    }

    let authResolved = false;
    auth.onAuthStateChanged(async (user) => {
      authResolved = true;
      if (user) {
        loggedOutView.hidden = true;
        loggedInView.hidden = false;
        document.getElementById("ssmProfileEmail").textContent = user.email || "";
        document.getElementById("ssmProfilePhoto").src =
          user.photoURL || "https://api.iconify.design/mdi:account-circle.svg?color=%23CFE8F7";
        updateTriggerLabels(user);

        let data = {};
        try {
          const snap = await db.collection("users").doc(user.uid).get();
          if (snap.exists) data = snap.data();
        } catch (err) { /* नेटवर्क/कनेक्शन समस्या — फ़ॉलबैक खाली प्रोफ़ाइल दिखेगी */ }

        document.getElementById("ssmProfileName").textContent = data.name || user.displayName || "—";
        document.getElementById("ssmProfileNameInput").value = data.name || user.displayName || "";
        document.getElementById("ssmProfilePhoneInput").value = data.phone || "";
        document.getElementById("ssmProfileAddressInput").value = data.address || "";
        document.getElementById("ssmMsgEmail").value = user.email || "";
        document.getElementById("ssmMsgPhone").value = data.phone || "";
      } else {
        loggedOutView.hidden = false;
        loggedInView.hidden = true;
        updateTriggerLabels(null);
      }
    });

    /* ---------- पेज खुलने के 3 सेकंड बाद, अगर लॉगिन नहीं हुआ, तो पॉपअप अपने-आप दिखाना ---------- */
    setTimeout(() => {
      if (!manuallyClosed && authResolved === false) {
        // धीमे नेटवर्क में भी एक बार जाँच ज़रूर हो, इसलिए auth ready न होने पर भी कोशिश करें
      }
      if (!manuallyClosed && !auth.currentUser && !overlay.classList.contains("open")) {
        openModal();
      }
    }, 3000);

    function friendlyError(err) {
      const map = {
        "auth/popup-closed-by-user": "लॉगिन विंडो बंद कर दी गई, कृपया पुनः प्रयास करें।",
        "auth/cancelled-popup-request": "कृपया पुनः प्रयास करें।",
        "auth/popup-blocked": "ब्राउज़र ने पॉपअप रोक दिया — कृपया पॉपअप की अनुमति दें और पुनः प्रयास करें।",
        "auth/network-request-failed": "इंटरनेट कनेक्शन जाँचें और पुनः प्रयास करें।",
        "auth/unauthorized-domain": "यह वेबसाइट डोमेन Firebase Console में अधिकृत नहीं है — Authentication > Settings > Authorized domains में जोड़ें।"
      };
      return map[err.code] || err.message || "कुछ गड़बड़ हो गई, पुनः प्रयास करें।";
    }
  }
})();
