"use strict";
//convert js to ts
const TRENDING_MARKETS = [
    { id: 1, question: "Will the shuttle bus break down next month?", category: "ccny", side: "YES", prevProb: 55, currProb: 62 },
    { id: 2, question: "Will Marshak Terrace be completed this year?", category: "ccny", side: "NO", prevProb: 50, currProb: 47 },
    { id: 3, question: "Will the library extend hours during finals?", category: "ccny", side: "YES", prevProb: 60, currProb: 71 },
    { id: 4, question: "Will the Knicks win their next 3 games?", category: "sports", side: "NO", prevProb: 40, currProb: 35 },
    { id: 5, question: "Will the Yankees make the World Series?", category: "sports", side: "YES", prevProb: 48, currProb: 44 }
];
let postsData = [];
fetch("sample-posts.json")
    .then(async (r) => await r.json())
    .then((data) => {
    const now = Date.now();
    postsData = data.map(p => ({
        ...p,
        // Convert post minutesAgo -> timestamp
        timestamp: now - p.minutesAgo * 60000,
        // Convert comment minutesAgo -> timestamp
        comments: p.comments.map(c => ({
            ...c,
            timestamp: now - c.minutesAgo * 60000
        }))
    }));
    renderFeed();
});
/* in-memory "database" of posts, comments, and which threads are open. */
let nextPostId = 1000;
let nextCommentId = 5000;
const openComments = new Set();
/* which time-filter is active (matches .time-tab text) */
let activeFilter = "Today";
/*it's currently null until user selects an image */
let pendingImageDataUrl = null;
/* legacy current user (kept but not used for auth UI anymore) */
const CURRENT_USER = { initials: "JD", name: "John Doe" };
/* selected market for composer */
let selectedMarket = null;
let pickerCatFilter = "all";
let pickerSearchQuery = "";
/* ── Auth helpers ── */
function getCurrentUser() {
    if (typeof window.EventraAuth === "undefined")
        return null;
    const user = window.EventraAuth.getCurrentUser();
    if (!user)
        return null;
    const raw = (user.displayName || user.email.split("@")[0]).trim();
    const parts = raw.split(/\s+/);
    const initials = parts
        .map((p) => (p[0] ?? "").toUpperCase())
        .join("")
        .slice(0, 3) || "??";
    return { name: raw, initials };
}
function updateAuthUI() {
    const navAuth = document.getElementById("nav-auth");
    const navUser = document.getElementById("nav-user");
    const navAvatar = document.getElementById("nav-avatar");
    const composerAvatar = document.getElementById("composer-avatar");
    const user = getCurrentUser();
    if (user) {
        if (navAuth)
            navAuth.style.display = "none";
        if (navUser)
            navUser.style.display = "flex";
        if (navAvatar)
            navAvatar.textContent = user.initials;
        if (composerAvatar)
            composerAvatar.textContent = user.initials;
    }
    else {
        if (navAuth)
            navAuth.style.display = "flex";
        if (navUser)
            navUser.style.display = "none";
        if (composerAvatar)
            composerAvatar.textContent = "?";
    }
}
/* ── Login gate modal ── */
function openLoginGate() {
    const gate = document.getElementById("login-gate");
    if (gate)
        gate.style.display = "flex";
}
function closeLoginGate() {
    const gate = document.getElementById("login-gate");
    if (gate)
        gate.style.display = "none";
}
/* ── Sidebar trending markets ── */
function renderSidebar() {
    const el = document.getElementById("sidebar-markets");
    if (!el)
        return;
    el.innerHTML = TRENDING_MARKETS.slice(0, 5).map(m => `
    <div class="sidebar-market-card">
      <span class="market-tag ${escapeHTML(m.category)}">${escapeHTML(m.category.toUpperCase())}</span>
      <div class="sidebar-market-q">${escapeHTML(m.question)}</div>
      <div class="prob-bar"><div class="prob-fill" style="width:${m.currProb}%"></div></div>
      <div class="sidebar-market-footer">
        <span class="sidebar-yes">YES</span>
        <span style="color:${m.currProb >= 50 ? "var(--accent)" : "var(--muted)"};font-weight:700;font-size:12px">${m.currProb}%</span>
      </div>
    </div>`).join("");
}
/* ── Market picker modal ── */
function openMarketPicker() {
    const picker = document.getElementById("market-picker");
    if (picker)
        picker.style.display = "flex";
    renderMarketPicker();
}
function closeMarketPicker() {
    const picker = document.getElementById("market-picker");
    if (picker)
        picker.style.display = "none";
}
function renderMarketPicker() {
    const pillsEl = document.getElementById("market-cat-pills");
    if (pillsEl) {
        pillsEl.innerHTML = ["all", "ccny", "sports", "politics"]
            .map(c => `<button class="cat-pill${pickerCatFilter === c ? " active" : ""}" data-cat="${c}">${c === "all" ? "All" : c.toUpperCase()}</button>`)
            .join("");
    }
    const listEl = document.getElementById("market-list");
    if (!listEl)
        return;
    const filtered = TRENDING_MARKETS.filter(m => {
        const catOk = pickerCatFilter === "all" || m.category === pickerCatFilter;
        const searchOk = m.question.toLowerCase().includes(pickerSearchQuery.toLowerCase());
        return catOk && searchOk;
    });
    if (filtered.length === 0) {
        listEl.innerHTML = `<p class="market-empty">No markets found.</p>`;
        return;
    }
    listEl.innerHTML = filtered.map(m => {
        const isSel = selectedMarket?.id === m.id;
        return `
      <div class="market-pick-item${isSel ? " selected" : ""}" data-market-id="${m.id}">
        <div class="market-pick-top">
          <span class="market-tag ${escapeHTML(m.category)}">${escapeHTML(m.category.toUpperCase())}</span>
          <span class="market-pick-prob">${m.currProb}%</span>
        </div>
        <div class="market-pick-question">${escapeHTML(m.question)}</div>
        <div class="prob-bar"><div class="prob-fill" style="width:${m.currProb}%"></div></div>
        ${isSel ? `<div class="market-pick-check">✓ Selected</div>` : ""}
      </div>`;
    }).join("");
}
function attachMarket(marketId) {
    const m = TRENDING_MARKETS.find(x => x.id === marketId);
    if (!m)
        return;
    selectedMarket = m;
    updateAttachedPreview();
    closeMarketPicker();
}
function updateAttachedPreview() {
    const preview = document.getElementById("attached-market-preview");
    const content = document.getElementById("attached-market-content");
    if (!preview || !content)
        return;
    if (selectedMarket) {
        content.innerHTML = `
      <span class="market-tag ${escapeHTML(selectedMarket.category)}">${escapeHTML(selectedMarket.category.toUpperCase())}</span>
      <div class="attached-market-question">${escapeHTML(selectedMarket.question)}</div>
      <div class="prob-bar" style="margin-top:6px"><div class="prob-fill" style="width:${selectedMarket.currProb}%"></div></div>`;
        preview.style.display = "flex";
    }
    else {
        preview.style.display = "none";
        content.innerHTML = "";
    }
}
function getMinutesAgo(timestamp) {
    return Math.floor((Date.now() - timestamp) / 60000);
}
function formatTime(timestamp) {
    const minutesAgo = getMinutesAgo(timestamp);
    if (minutesAgo < 1)
        return "now";
    if (minutesAgo < 60)
        return `${minutesAgo}m`;
    if (minutesAgo < 1440)
        return `${Math.floor(minutesAgo / 60)}h`;
    return `${Math.floor(minutesAgo / 1440)}d`;
}
/* filters posts based on activeFilter which is set by clicking the time tabs */
function filterPosts(posts) {
    const limits = { "Now": 60, "Today": 1440, "This Week": 10080, "This Month": 43200 };
    const limit = limits[activeFilter] ?? Infinity;
    return posts.filter(p => getMinutesAgo(p.timestamp) <= limit);
}
function escapeHTML(str) {
    if (str === undefined || str === null)
        return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
/* The function that builds the HTML for the posts */
function buildPostHTML(post) {
    /*sets heart to red if liked empty if not */
    const heartFill = post.liked ? "red" : "none";
    const heartStroke = post.liked ? "red" : "currentColor";
    /*sets the color of the probablity bar based on the probability between 0-100*/
    const prob = Math.min(100, Math.max(0, post.market.currProb));
    /*keep count of comments */
    const commentCount = post.comments.length;
    const imageHTML = post.image
        ? `<div class="post-images">
         <img src="${escapeHTML(post.image)}" alt="post image"/>
       </div>`
        : "";
    const marketHTML = post.market.question !== "No market attached" ? `
  <div class="market-card">
        <a href="#" class="market-link">
          <div class="market-name">${escapeHTML(post.market.question)}</div>
        </a>
        <div class="market-meta">
          ${escapeHTML(post.market.side)} · ${escapeHTML(post.market.category)} ·
          was ${post.market.prevProb}% → now ${prob}%
        </div>
        <div class="prob-bar"><div class="prob-fill" style="width:${prob}%;"></div></div>
       </div>`
        : "";
    const buyHTMLBool = post.market.question !== "No market attached";
    const buyHTML = buyHTMLBool
        ? `<button class="btn-buy" data-id="${post.id}">Buy</button>`
        : "";
    return `
      <!-- Sample post -->
    <div class="post-row"  data-post-id="${post.id}">
      <div class="avatar">${escapeHTML(post.initials)}</div>
      <div class="field">
        <div class="post-header">
          <strong>${escapeHTML(post.name)}</strong>
          <span class="post-time">${formatTime(post.timestamp)}</span>
        </div>
        <div class="post-content">
          <p class="post-text">${escapeHTML(post.text)}</p>
              ${imageHTML} 
              ${marketHTML} 
       <hr class="divider">
       <div class="post-actions">

            <div class="post-action-row">
            <!-- comment icon-->
            <button class="action-btn" id="comment_btn" data-action="comment" data-id="${post.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p id="reply_count">${commentCount}</p>
          </button>

            <button class="action-btn" id="like_btn" data-action="like" data-id="${post.id}">
              <!-- heart icon -->
              <svg viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <p id="like_count" class="like_count" data-id="${post.id}">${post.likes}</p>
            </button>
            <button class="action-btn" data-id="${post.id}">
              <!-- share icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
           </div>
           <div class = "buy-row" >
            ${buyHTML} 
        </div>
      </div>
  <div class="comment-section" data-id="${post.id}">
          <div class="comment-list">
            ${post.comments.map((c) => `
                <div class="comment-item">
                  <div class="comment-avatar">${escapeHTML(c.initials)}</div>

                  <div class="comment-body">
                    <div class="comment-header">
                      <span class="comment-author">${escapeHTML(c.name)}</span>
                      <span class="comment-time">${formatTime(c.timestamp)}</span>
                    </div>

                    <div class="comment-text">${escapeHTML(c.text)}</div>
                  </div>
                </div>
              `).join("")}
          </div>

          <div class="comment-box">
            <input 
              type="text"
              class="comment-input"
              placeholder="Write a comment..."
              data-id="${post.id}"
            >
            <button class="comment-submit" data-id="${post.id}">Post</button>
          </div>
          </div>
    </div>
    </div>     
  </div>
    `;
}
/*Thiis function is for the heart icon when you click on it it will change color and increment or decrement the like count*/
function handleFeedClick(e) {
    // ⭐ FIRST: handle comment-submit BEFORE the early return
    if (e.target.classList.contains("comment-submit")) {
        const id = parseInt(e.target.dataset.id);
        const post = postsData.find(p => p.id === id);
        const input = document.querySelector(`.comment-input[data-id="${id}"]`);
        if (!post || !input || !input.value.trim())
            return;
        const user = getCurrentUser();
        if (!user) {
            openLoginGate();
            return;
        }
        post.comments.push({
            id: nextCommentId++,
            initials: user.initials,
            name: user.name,
            text: input.value.trim(),
            minutesAgo: 0, // new comment = 0 minutes ago
            timestamp: Date.now() // real timestamp
        });
        input.value = "";
        localStorage.setItem("postsData", JSON.stringify(postsData));
        renderFeed();
        return; // ⭐ stop here so it doesn't fall into like/share logic
    }
    // ⭐ THEN handle like/share buttons
    const btn = e.target.closest("[data-action]");
    if (!btn)
        return;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset["id"] ?? "", 10);
    const post = postsData.find(p => p.id === id);
    // LIKE BUTTON
    if (action === "like" && post) {
        const user = getCurrentUser();
        if (!user) {
            openLoginGate();
            return;
        }
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        const likecountid = document.querySelector(`.like_count[data-id="${id}"]`);
        if (likecountid)
            likecountid.textContent = String(post.likes);
        const svg = btn.querySelector("svg");
        if (svg) {
            svg.setAttribute("fill", post.liked ? "red" : "none");
            svg.setAttribute("stroke", post.liked ? "red" : "currentColor");
        }
    }
    // COMMENT ICON TOGGLE
    if (btn.id === "comment_btn") {
        const section = document.querySelector(`.comment-section[data-id="${id}"]`);
        if (section) {
            section.style.display = section.style.display === "none" ? "block" : "none";
        }
    }
    if (action === "comment") {
        const section = document.querySelector(`.comment-section[data-id="${id}"]`);
        if (section) {
            section.style.display = section.style.display === "none" ? "block" : "none";
        }
        return;
    }
}
function handleNewPost() {
    const user = getCurrentUser();
    if (!user) {
        openLoginGate();
        return;
    }
    const textarea = document.querySelector(".user-post-row textarea");
    const text = textarea?.value.trim();
    if (!text && !pendingImageDataUrl)
        return;
    const newPost = {
        id: nextPostId++,
        name: user.name,
        initials: user.initials,
        minutesAgo: 0,
        timestamp: Date.now(),
        text: text || "",
        image: pendingImageDataUrl,
        liked: false,
        likes: 0,
        comments: [],
        market: selectedMarket
            ? {
                question: selectedMarket.question,
                side: selectedMarket.side,
                category: selectedMarket.category,
                prevProb: selectedMarket.prevProb,
                currProb: selectedMarket.currProb
            }
            : {
                question: "No market attached",
                side: "",
                category: "",
                prevProb: 0,
                currProb: 0
            }
    };
    //Prepend to postsData so it appears at the top of the feed
    postsData.unshift(newPost);
    // Save the whole array to localStorage as a JSON string
    // so posts survive a page refresh
    localStorage.setItem("postsData", JSON.stringify(postsData));
    //clear the form
    if (textarea)
        textarea.value = "";
    pendingImageDataUrl = null;
    selectedMarket = null;
    updateAttachedPreview();
    const fileInput = document.querySelector("#file-upload");
    if (fileInput)
        fileInput.value = "";
    renderFeed();
}
function handleTabClick(e) {
    const tab = e.target.closest(".time-tab");
    if (!tab)
        return;
    activeFilter = tab.textContent?.trim() ?? "Now";
    document.querySelectorAll(".time-tab").forEach(t => t.classList.toggle("active", t === tab));
    localStorage.setItem("activeTab", activeFilter);
    renderFeed();
}
/* filter posts based on the active filter */
function renderFeed() {
    const fc = document.querySelector(".posts-feed .container");
    if (!fc)
        return;
    const visible = filterPosts(postsData);
    fc.innerHTML = visible.map(buildPostHTML).join("");
}
/* filter posts based on the active filter */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".posts-feed")?.addEventListener("click", handleFeedClick);
    document.getElementById("post-btn")?.addEventListener("click", handleNewPost);
    document.querySelector(".time-tabs")?.addEventListener("click", handleTabClick);
    document.querySelector("#file-upload")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            pendingImageDataUrl = reader.result;
        };
        reader.readAsDataURL(file);
    });
    //used to save the active tab so when clicked it will stay the same as the tab active
    const saved = localStorage.getItem("activeTab");
    if (saved) {
        const matchingTab = Array.from(document.querySelectorAll(".time-tab"))
            .find(t => t.textContent?.trim() === saved);
        if (matchingTab) {
            activeFilter = saved;
            document.querySelectorAll(".time-tab").forEach(t => t.classList.toggle("active", t === matchingTab));
        }
    }
    // auth + sidebar + market picker + login gate wiring
    updateAuthUI();
    renderSidebar();
    if (typeof window.EventraAuth !== "undefined") {
        window.EventraAuth.onAuthStateChanged(() => {
            updateAuthUI();
        });
    }
    document.getElementById("attach-market-btn")
        ?.addEventListener("click", openMarketPicker);
    document.getElementById("market-picker-close")
        ?.addEventListener("click", closeMarketPicker);
    document.getElementById("market-picker")
        ?.addEventListener("click", (e) => {
        if (e.target.id === "market-picker")
            closeMarketPicker();
    });
    document.getElementById("market-search")
        ?.addEventListener("input", (e) => {
        pickerSearchQuery = e.target.value;
        renderMarketPicker();
    });
    document.getElementById("market-cat-pills")
        ?.addEventListener("click", (e) => {
        const pill = e.target.closest(".cat-pill");
        if (!pill)
            return;
        pickerCatFilter = pill.dataset.cat ?? "all";
        renderMarketPicker();
    });
    document.getElementById("market-list")
        ?.addEventListener("click", (e) => {
        const item = e.target.closest(".market-pick-item");
        if (!item)
            return;
        const mid = parseInt(item.dataset.marketId ?? "", 10);
        attachMarket(mid);
    });
    document.getElementById("detach-market-btn")
        ?.addEventListener("click", () => {
        selectedMarket = null;
        updateAttachedPreview();
    });
    document.getElementById("login-gate-close")
        ?.addEventListener("click", closeLoginGate);
    document.getElementById("login-gate")
        ?.addEventListener("click", (e) => {
        if (e.target.id === "login-gate")
            closeLoginGate();
    });
});
