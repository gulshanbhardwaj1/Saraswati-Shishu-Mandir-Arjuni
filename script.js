/* =============================================================
   सरस्वती शिशु मंदिर, अर्जुनी — script.js
   Firebase initialisation, Firestore/Storage queries, dynamic
   rendering, and all interactive UI behaviour.
   ============================================================= */

/* -------------------------------------------------------------
   1. FIREBASE CONFIGURATION (placeholder — replace with your own
      project credentials from the Firebase console)
   ------------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let db = null;
let storage = null;
let auth = null;
let firebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  auth = firebase.auth();
  firebaseReady = true;
} catch (err) {
  // Placeholder credentials will fail to initialise a real connection.
  // The site falls back to sample content below so the UI is always complete.
  console.warn("Firebase प्रारंभ नहीं हो सका, नमूना डेटा दिखाया जा रहा है:", err.message);
}

/* -------------------------------------------------------------
   2. SMALL UTILITIES
   ------------------------------------------------------------- */
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function formatDateParts(dateStr) {
  // Accepts "YYYY-MM-DD" and returns { day, month } in Hindi short month.
  const months = ["जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];
  const d = new Date(dateStr);
  if (isNaN(d)) return { day: "--", month: "" };
  return { day: String(d.getDate()).padStart(2, "0"), month: months[d.getMonth()] };
}

/* -------------------------------------------------------------
   3. SAMPLE / FALLBACK DATA
   Used whenever Firestore is unavailable or a collection is empty,
   so the interface always renders as a complete, production-quality
   preview. Replace / remove once real Firebase data is populated.
   ------------------------------------------------------------- */
const SAMPLE = {
  heroSlides: [
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=1600&auto=format&fit=crop"
  ],
  schoolInfo: {
    estYear: "1985",
    history: "वर्ष 1985 में स्थापित सरस्वती शिशु मंदिर, अर्जुनी विद्या भारती परिवार का एक गौरवशाली अंग है। पिछले चार दशकों से यह विद्यालय क्षेत्र के हजारों विद्यार्थियों को गुणवत्तापूर्ण शिक्षा एवं भारतीय संस्कारों से जोड़ता आ रहा है।",
    vision: "प्रत्येक बालक में निहित प्रतिभा को पहचान कर उसे एक सुसंस्कृत, आत्मनिर्भर एवं राष्ट्रभक्त नागरिक के रूप में विकसित करना।",
    mission: "आधुनिक शिक्षा पद्धति एवं भारतीय मूल्यों के समन्वय से विद्यार्थियों का सर्वांगीण — शारीरिक, मानसिक, बौद्धिक एवं आध्यात्मिक — विकास सुनिश्चित करना।"
  },
  teachers: [
    { name: "श्रीमती अंजली शर्मा", subject: "हिंदी एवं संस्कृत", designation: "वरिष्ठ शिक्षिका", intro: "20 वर्षों के अनुभव के साथ भाषा शिक्षण में विशेषज्ञता।", photo: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=600&auto=format&fit=crop" },
    { name: "श्री रमेश पाटील", subject: "गणित", designation: "गणित विभागाध्यक्ष", intro: "गणित को रोचक बनाने की अनूठी शिक्षण शैली।", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop" },
    { name: "श्रीमती सुनीता वर्मा", subject: "विज्ञान", designation: "वरिष्ठ शिक्षिका", intro: "प्रायोगिक शिक्षण के माध्यम से विज्ञान में रुचि जागृत करना।", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" },
    { name: "श्री विजय कुलकर्णी", subject: "सामाजिक विज्ञान", designation: "शिक्षक", intro: "इतिहास एवं नागरिक शास्त्र के अनुभवी शिक्षक।", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop" }
  ],
  principal: {
    name: "श्री चैन सिंह साहु",
    role: "वर्तमान प्राचार्य",
    message: "शिक्षा का उद्देश्य केवल जानकारी देना नहीं, अपितु चरित्र निर्माण करना है। हमारा प्रयास है कि प्रत्येक बालक संस्कारवान, आत्मविश्वासी एवं ज्ञानवान बने।",
    details: "इस वर्ष नियुक्त हुए | एम.एड, .",
    photo: "https://images.unsplash.com/photo-1580894908361-967195033215?q=80&w=800&auto=format&fit=crop"
  },
  formerPrincipals: [
    { name: "श्री चैन सिंह साहु", years: "__", note: "विद्यालय के संस्थापक प्राचार्य, जिन्होंने नींव रखी।" },
    { name: "श्री रमेश शर्मा", years: "2018 - 2026", note: "विद्यालय के विस्तार एवं सांस्कृतिक कार्यक्रमों की अगुवाई।" },
    { name: "श्री चैन सिंह साहु", years: "वर्तमान प्राचार्य", note: "आधुनिक शिक्षण तकनीकों को विद्यालय में लाने का श्रेय।" }
  ],
  achievements: [
    { title: "राज्य स्तरीय विज्ञान प्रदर्शनी", date: "2025", desc: "हमारे विद्यार्थियों ने प्रथम स्थान प्राप्त किया।", photo: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop" },
    { title: "जिला खेलकूद प्रतियोगिता", date: "2024", desc: "कबड्डी एवं खो-खो में स्वर्ण पदक।", photo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop" },
    { title: "राष्ट्रीय निबंध प्रतियोगिता", date: "2024", desc: "हिंदी निबंध लेखन में द्वितीय पुरस्कार।", photo: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop" }
  ],
  notices: [
    { title: "वार्षिक परीक्षा तिथि घोषित", desc: "कक्षा 1 से 10 तक की वार्षिक परीक्षाएँ मार्च माह में आयोजित होंगी।", date: "2026-02-15", category: "परीक्षा" },
    { title: "गर्मी की छुट्टियाँ", desc: "विद्यालय में ग्रीष्मकालीन अवकाश की सूचना।", date: "2026-05-01", category: "अवकाश" },
    { title: "नए सत्र हेतु प्रवेश प्रारंभ", desc: "सत्र 2026-27 के लिए प्रवेश प्रक्रिया शुरू।", date: "2026-01-10", category: "प्रवेश" },
    { title: "दसवीं बोर्ड परिणाम घोषित", desc: "इस वर्ष विद्यालय का परिणाम 98% रहा।", date: "2026-01-05", category: "परिणाम" },
    { title: "अभिभावक-शिक्षक बैठक", desc: "सभी अभिभावकों से उपस्थित रहने का अनुरोध है।", date: "2026-02-20", category: "घोषणा" }
  ],
  events: [
    { title: "वार्षिकोत्सव समारोह", desc: "विद्यालय का भव्य वार्षिकोत्सव आयोजित होगा।", date: "2026-03-12", photo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop" },
    { title: "विज्ञान प्रदर्शनी", desc: "विद्यार्थियों के नवाचार प्रोजेक्ट्स का प्रदर्शन।", date: "2026-02-08", photo: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=600&auto=format&fit=crop" },
    { title: "योग एवं खेल दिवस", desc: "स्वास्थ्य जागरूकता हेतु योग सत्र एवं खेल प्रतियोगिताएँ।", date: "2026-06-21", photo: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop" }
  ],
  gallery: [
    { category: "स्वतंत्रता दिवस", url: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=600&auto=format&fit=crop", caption: "ध्वजारोहण समारोह" },
    { category: "गणतंत्र दिवस", url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=600&auto=format&fit=crop", caption: "परेड प्रस्तुति" },
    { category: "वार्षिकोत्सव", url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop", caption: "सांस्कृतिक प्रस्तुति" },
    { category: "खेलकूद", url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop", caption: "खेल दिवस" },
    { category: "विज्ञान प्रदर्शनी", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop", caption: "विज्ञान मॉडल" },
    { category: "योग दिवस", url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop", caption: "योग सत्र" },
    { category: "वृक्षारोपण", url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?q=80&w=600&auto=format&fit=crop", caption: "पौधरोपण अभियान" },
    { category: "शिक्षक दिवस", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop", caption: "शिक्षक सम्मान" }
  ],
  videos: [
    { title: "वार्षिकोत्सव 2025 झलकियाँ", date: "मार्च 2025", thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop", url: "" },
    { title: "स्वतंत्रता दिवस समारोह", date: "अगस्त 2025", thumbnail: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=600&auto=format&fit=crop", url: "" },
    { title: "खेल दिवस हाइलाइट्स", date: "जनवरी 2026", thumbnail: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop", url: "" }
  ],
  contact: {
    phone: "+91 98765 43210",
    email: "info@ssmarjuni.edu.in",
    hours: "सोमवार - शनिवार, प्रातः 7:00 - दोपहर 1:00"
  }
};

/* -------------------------------------------------------------
   4. GENERIC FIRESTORE FETCH HELPER
   ------------------------------------------------------------- */
async function fetchCollection(path, orderField) {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  let ref = db.collection(path);
  if (orderField) ref = ref.orderBy(orderField, "desc");
  const snap = await ref.get();
  if (snap.empty) throw new Error("empty-collection");
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchDoc(path) {
  if (!firebaseReady) throw new Error("firebase-not-ready");
  const snap = await db.doc(path).get();
  if (!snap.exists) throw new Error("doc-missing");
  return snap.data();
}

/* -------------------------------------------------------------
   5. RENDER FUNCTIONS
   ------------------------------------------------------------- */

// ---- Hero slider ----
let heroIndex = 0;
let heroTimer = null;
function renderHeroSlider(images) {
  const slider = qs("#heroSlider");
  const dotsWrap = qs("#sliderDots");
  slider.innerHTML = "";
  dotsWrap.innerHTML = "";
  images.forEach((src, i) => {
    const slide = el("div", "hero-slide" + (i === 0 ? " active" : ""));
    slide.style.backgroundImage = `url('${src}')`;
    slider.appendChild(slide);
    const dot = el("button", i === 0 ? "active" : "");
    dot.setAttribute("aria-label", `स्लाइड ${i + 1}`);
    dot.addEventListener("click", () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  startHeroAutoplay(images.length);
}
function goToSlide(i) {
  const slides = qsa(".hero-slide");
  const dots = qsa("#sliderDots button");
  slides[heroIndex]?.classList.remove("active");
  dots[heroIndex]?.classList.remove("active");
  heroIndex = i;
  slides[heroIndex]?.classList.add("active");
  dots[heroIndex]?.classList.add("active");
}
function startHeroAutoplay(count) {
  clearInterval(heroTimer);
  if (count < 2) return;
  heroTimer = setInterval(() => goToSlide((heroIndex + 1) % count), 5000);
}

// ---- School introduction ----
function renderSchoolInfo(info) {
  qs("#introEstYear").textContent = info.estYear;
  qs("#introHistory").textContent = info.history;
  qs("#introVision").textContent = info.vision;
  qs("#introMission").textContent = info.mission;
  qs("#qiEstYear").textContent = info.estYear;
}

// ---- Teachers ----
function renderTeachers(list) {
  const grid = qs("#teachersGrid");
  grid.innerHTML = "";
  list.forEach(t => {
    const card = el("article", "person-card reveal");
    card.innerHTML = `
      <img src="${t.photo}" alt="${t.name}" loading="lazy">
      <div class="p-body">
        <h4>${t.name}</h4>
        <p class="designation">${t.designation}</p>
        <p class="subject"><i class="fa-solid fa-book"></i> ${t.subject}</p>
        <p class="intro-text">${t.intro}</p>
      </div>`;
    grid.appendChild(card);
  });
  observeReveal();
}

// ---- Principal ----
function renderPrincipal(p) {
  const wrap = qs("#principalCard");
  wrap.innerHTML = `
    <img src="${p.photo}" alt="${p.name}">
    <div class="principal-info">
      <h3>${p.name}</h3>
      <p class="role">${p.role}</p>
      <p class="message">"${p.message}"</p>
      <p class="details">${p.details}</p>
    </div>`;
}

// ---- Former principals timeline ----
function renderFormerPrincipals(list) {
  const wrap = qs("#formerPrincipalsTimeline");
  wrap.innerHTML = "";
  list.forEach(p => {
    const item = el("div", "timeline-item reveal");
    item.innerHTML = `<h4>${p.name}</h4><p class="years">${p.years}</p><p>${p.note}</p>`;
    wrap.appendChild(item);
  });
  observeReveal();
}

// ---- Achievements ----
function renderAchievements(list) {
  const grid = qs("#achievementsGrid");
  grid.innerHTML = "";
  list.forEach(a => {
    const card = el("article", "achievement-card reveal");
    card.innerHTML = `
      <img src="${a.photo}" alt="${a.title}" loading="lazy">
      <div class="a-body">
        <span class="a-date">${a.date}</span>
        <h4>${a.title}</h4>
        <p>${a.desc}</p>
      </div>`;
    grid.appendChild(card);
  });
  observeReveal();
}

// ---- Notices ----
let ALL_NOTICES = [];
function renderNotices(list, filter = "सभी") {
  const wrap = qs("#noticeList");
  wrap.innerHTML = "";
  const filtered = filter === "सभी" ? list : list.filter(n => n.category === filter);
  if (!filtered.length) {
    wrap.innerHTML = `<p style="text-align:center;color:var(--text-soft)">इस श्रेणी में कोई सूचना उपलब्ध नहीं है।</p>`;
    return;
  }
  filtered.forEach(n => {
    const { day, month } = formatDateParts(n.date);
    const item = el("div", "notice-item reveal");
    item.innerHTML = `
      <div class="notice-date"><span class="day">${day}</span><span class="mon">${month}</span></div>
      <div><h4>${n.title}</h4><p>${n.desc}</p></div>
      <span class="tag">${n.category}</span>`;
    wrap.appendChild(item);
  });
  observeReveal();
}
function renderHomeNotices(list) {
  const wrap = qs("#homeNoticeList");
  wrap.innerHTML = "";
  list.slice(0, 4).forEach(n => {
    const li = el("li");
    li.innerHTML = `<span class="tag">${n.category}</span><span>${n.title}</span>`;
    wrap.appendChild(li);
  });
}

// ---- Events ----
function renderEvents(list) {
  const grid = qs("#eventsGrid");
  grid.innerHTML = "";
  list.forEach(ev => {
    const card = el("article", "event-card reveal");
    card.innerHTML = `
      <img src="${ev.photo}" alt="${ev.title}" loading="lazy">
      <div class="e-body">
        <span class="e-date">${ev.date}</span>
        <h4>${ev.title}</h4>
        <p>${ev.desc}</p>
      </div>`;
    grid.appendChild(card);
  });
  observeReveal();
}
function renderHomeEvents(list) {
  const wrap = qs("#homeEventList");
  wrap.innerHTML = "";
  list.slice(0, 4).forEach(ev => {
    const li = el("li");
    li.innerHTML = `<span class="tag">${ev.date}</span><span>${ev.title}</span>`;
    wrap.appendChild(li);
  });
}

// ---- Gallery ----
let ALL_GALLERY = [];
let currentLightboxList = [];
let currentLightboxIndex = 0;
function renderGallery(list, filter = "सभी") {
  const grid = qs("#galleryGrid");
  grid.innerHTML = "";
  const filtered = filter === "सभी" ? list : list.filter(g => g.category === filter);
  currentLightboxList = filtered;
  filtered.forEach((g, i) => {
    const item = el("div", "gallery-item reveal");
    item.innerHTML = `<img src="${g.url}" alt="${g.caption}" loading="lazy"><span class="g-cap">${g.caption}</span>`;
    item.addEventListener("click", () => openLightbox(i));
    grid.appendChild(item);
  });
  observeReveal();
}

// ---- Videos ----
function renderVideos(list) {
  const grid = qs("#videoGrid");
  grid.innerHTML = "";
  list.forEach(v => {
    const card = el("article", "video-card reveal");
    card.innerHTML = `
      <div class="video-thumb">
        <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
        <span class="play-btn"><i class="fa-solid fa-play"></i></span>
      </div>
      <div class="video-body"><h4>${v.title}</h4><p class="v-date">${v.date}</p></div>`;
    card.addEventListener("click", () => openVideoModal(v));
    grid.appendChild(card);
  });
  observeReveal();
}

// ---- Contact ----
function renderContact(c) {
  qs("#contactPhone").textContent = c.phone;
  qs("#contactEmail").textContent = c.email;
  qs("#contactHours").textContent = c.hours;
  qs("#footerPhone").textContent = c.phone;
  qs("#footerEmail").textContent = c.email;
}

/* -------------------------------------------------------------
   6. DATA LOADING ORCHESTRATION (Firestore first, sample fallback)
   ------------------------------------------------------------- */
async function loadHero() {
  try {
    const docs = await fetchCollection("heroSlides");
    renderHeroSlider(docs.map(d => d.url));
  } catch { renderHeroSlider(SAMPLE.heroSlides); }
}

async function loadSchoolInfo() {
  try { renderSchoolInfo(await fetchDoc("school/info")); }
  catch { renderSchoolInfo(SAMPLE.schoolInfo); }
}

async function loadTeachers() {
  try { renderTeachers(await fetchCollection("teachers")); }
  catch { renderTeachers(SAMPLE.teachers); }
}

async function loadPrincipal() {
  try { renderPrincipal(await fetchDoc("principal/current")); }
  catch { renderPrincipal(SAMPLE.principal); }
}

async function loadFormerPrincipals() {
  try { renderFormerPrincipals(await fetchCollection("formerPrincipals")); }
  catch { renderFormerPrincipals(SAMPLE.formerPrincipals); }
}

async function loadAchievements() {
  try { renderAchievements(await fetchCollection("achievements", "date")); }
  catch { renderAchievements(SAMPLE.achievements); }
}

async function loadNotices() {
  try { ALL_NOTICES = await fetchCollection("notices", "date"); }
  catch { ALL_NOTICES = SAMPLE.notices; }
  renderNotices(ALL_NOTICES);
  renderHomeNotices(ALL_NOTICES);
}

async function loadEvents() {
  let list;
  try { list = await fetchCollection("events", "date"); }
  catch { list = SAMPLE.events; }
  renderEvents(list);
  renderHomeEvents(list);
}

async function loadGallery() {
  try { ALL_GALLERY = await fetchCollection("gallery"); }
  catch { ALL_GALLERY = SAMPLE.gallery; }
  renderGallery(ALL_GALLERY);
}

async function loadVideos() {
  try { renderVideos(await fetchCollection("videos", "date")); }
  catch { renderVideos(SAMPLE.videos); }
}

async function loadContact() {
  try { renderContact(await fetchDoc("school/contact")); }
  catch { renderContact(SAMPLE.contact); }
}

async function loadAllData() {
  await Promise.all([
    loadHero(), loadSchoolInfo(), loadTeachers(), loadPrincipal(),
    loadFormerPrincipals(), loadAchievements(), loadNotices(),
    loadEvents(), loadGallery(), loadVideos(), loadContact()
  ]);
}

/* -------------------------------------------------------------
   7. UI INTERACTIONS
   ------------------------------------------------------------- */

// ---- Loader ----
window.addEventListener("load", () => {
  setTimeout(() => qs("#loader").classList.add("hidden"), 400);
});

// ---- Header scroll shadow + active link ----
const sections = () => qsa("main section[id]");
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  qs("#siteHeader").style.boxShadow = y > 10 ? "var(--shadow)" : "var(--shadow-sm)";
  qs("#scrollTopBtn").classList.toggle("show", y > 500);

  let current = "home";
  sections().forEach(sec => {
    if (y >= sec.offsetTop - 130) current = sec.id;
  });
  qsa(".nav-link, .drawer-link").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}, { passive: true });

qs("#scrollTopBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ---- Mobile drawer ----
const drawer = qs("#mobileDrawer");
const overlay = qs("#drawerOverlay");
function openDrawer() {
  drawer.classList.add("open");
  overlay.classList.add("show");
  qs("#hamburger").setAttribute("aria-expanded", "true");
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawerFn() {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
  qs("#hamburger").setAttribute("aria-expanded", "false");
  drawer.setAttribute("aria-hidden", "true");
}
qs("#hamburger").addEventListener("click", openDrawer);
qs("#closeDrawer").addEventListener("click", closeDrawerFn);
overlay.addEventListener("click", closeDrawerFn);
qsa(".drawer-link").forEach(l => l.addEventListener("click", closeDrawerFn));

// ---- Theme toggle (persisted) ----
const themeToggle = qs("#themeToggle");
function applyTheme(dark) {
  document.body.classList.toggle("dark-mode", dark);
  themeToggle.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}
applyTheme(localStorage.getItem("ssm-theme") === "dark");
themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark-mode");
  applyTheme(isDark);
  localStorage.setItem("ssm-theme", isDark ? "dark" : "light");
});

// ---- Animated counters ----
function animateCounters() {
  qsa(".counter").forEach(counter => {
    const target = +counter.dataset.target;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const tick = () => {
      current += step;
      if (current >= target) { counter.textContent = target; return; }
      counter.textContent = current;
      requestAnimationFrame(tick);
    };
    tick();
  });
}
const counterObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCounters(); obs.disconnect(); }
  });
}, { threshold: 0.4 });
const quickInfoSection = qs(".quick-info");
if (quickInfoSection) counterObserver.observe(quickInfoSection);

// ---- Scroll reveal (re-usable, applied after dynamic render) ----
function observeReveal() {
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  qsa(".reveal:not(.in-view)").forEach(node => revealObserver.observe(node));
}

// ---- Notice filters ----
qs("#noticeFilters").addEventListener("click", e => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;
  qsa("#noticeFilters .filter-chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  renderNotices(ALL_NOTICES, btn.dataset.filter);
});

// ---- Gallery filters ----
qs("#galleryFilters").addEventListener("click", e => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;
  qsa("#galleryFilters .filter-chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  renderGallery(ALL_GALLERY, btn.dataset.filter);
});

// ---- Lightbox ----
const lightbox = qs("#lightbox");
function openLightbox(index) {
  currentLightboxIndex = index;
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function updateLightbox() {
  const item = currentLightboxList[currentLightboxIndex];
  if (!item) return;
  qs("#lightboxImg").src = item.url;
  qs("#lightboxImg").alt = item.caption;
  qs("#lightboxCaption").textContent = `${item.caption} — ${item.category}`;
}
function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
qs("#lightboxClose").addEventListener("click", closeLightbox);
qs("#lightboxPrev").addEventListener("click", () => {
  currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxList.length) % currentLightboxList.length;
  updateLightbox();
});
qs("#lightboxNext").addEventListener("click", () => {
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxList.length;
  updateLightbox();
});
lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") qs("#lightboxPrev").click();
  if (e.key === "ArrowRight") qs("#lightboxNext").click();
});

// ---- Video modal ----
const videoModal = qs("#videoModal");
const videoPlayer = qs("#videoPlayer");
function openVideoModal(v) {
  if (v.url) {
    videoPlayer.src = v.url;
  } else {
    // No real source configured yet (placeholder demo entry) — show poster only.
    videoPlayer.removeAttribute("src");
    videoPlayer.poster = v.thumbnail;
  }
  videoModal.classList.add("open");
  videoModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeVideoModal() {
  videoPlayer.pause();
  videoModal.classList.remove("open");
  videoModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
qs("#videoModalClose").addEventListener("click", closeVideoModal);
videoModal.addEventListener("click", e => { if (e.target === videoModal) closeVideoModal(); });

// ---- Footer year ----
qs("#currentYear").textContent = new Date().getFullYear();

/* -------------------------------------------------------------
   8. INITIALISE
   ------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", loadAllData);
