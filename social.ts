//convert js to ts

interface Market {
  question: string;
  side: string;
  category: string;
  prevProb: number;
  currProb: number;
}
 
interface Post {
  id: number;
  name: string;
  initials: string;
  minutesAgo: number;
  text: string;
  image: string | null;
  liked: boolean;
  likes: number;
  comments: number;
  market: Market;
}

let postsData: Post[] = [];

fetch("sample-posts.json")
  .then(async (r) => await r.json() as Post[])
  .then((data: Post[]): void => {
    postsData.push(...data);
    renderFeed();
  });

/* in-memory "database" of posts, comments, and which threads are open. */ 
let nextPostId: number= 1000;
/* which time-filter is active (matches .time-tab text) */
let activeFilter:string = "Now";

/*it's currently null until user selects an image */
let pendingImageDataUrl:string|null = null;

const CURRENT_USER:{ initials:string, name: string}={initials:"JD", name: "John Doe" };


/* formats time to m(minutes), h(hours), or d(days) */
function formatTime(minutesAgo:number):string {
  if (minutesAgo < 1)   return "now";
  if (minutesAgo < 60)  return `${minutesAgo}m`;
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}h`;
  return `${Math.floor(minutesAgo / 1440)}d`;
}
/* filters posts based on activeFilter which is set by clicking the time tabs */
function filterPosts(posts: Post[]):Post[] {
  const limits: Record<string, number>  = { "Now": 60, "Today": 1440, "This Week": 10080, "This Month": 43200 };
  const limit:number= limits[activeFilter] ?? Infinity;
  return posts.filter(p => p.minutesAgo <= limit);
}

function escapeHTML(str: string | null | undefined): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
/* The function that builds the HTML for the posts */
function buildPostHTML(post: Post): string{
  
  /*sets heart to red if liked empty if not */
  const heartFill:string= post.liked ? "red" : "none";
  const heartStroke:string= post.liked ? "red" : "currentColor";
  /*sets the color of the probablity bar based on the probability between 0-100*/
  const prob:number= Math.min(100, Math.max(0, post.market.currProb));
  /*keep count of comments */
  const commentCount:number= typeof post.comments === 'number' ? post.comments : 0;
    
  const imageHTML:string = post.image
    ? `<div class="post-images">
         <img src="${escapeHTML(post.image)}" alt="post image"/>
       </div>`
    : "";

  const marketHTML:string = post.market.question !== "No market attached"?`
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
       
   :""; 
   const buyHTMLBool:boolean = post.market.question !== "No market attached"
   const buyHTML:string = buyHTMLBool
    ? `<button class="btn-buy" data-id="${post.id}">Buy</button>`
    : "";
  return `
      <!-- Sample post -->
    <div class="post-row"  data-post-id="${post.id}">
      <div class="avatar">${escapeHTML(post.initials)}</div>
      <div class="field">
        <div class="post-header">
          <strong>${escapeHTML(post.name)}</strong>
          <span class="post-time">${formatTime(post.minutesAgo)}</span>
        </div>
        <div class="post-content">
          <p class="post-text">${escapeHTML(post.text)}</p>
              ${imageHTML} 
              ${marketHTML} 
       <hr class="divider">
       <div class="post-actions">
            <div class="post-action-row">
            <!-- comment icon-->
            <button class="action-btn" id="comment_btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p id="reply_count" data-id="${post.id}">${commentCount}</p>
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
    </div>
    </div>     
  </div>
    `;
}


/*Thiis function is for the heart icon when you click on it it will change color and increment or decrement the like count*/
function handleFeedClick(e: MouseEvent): void {
  const btn: HTMLElement|null = (e.target as Element).closest<HTMLElement>("[data-action]");
  if (!btn) return;
  const action:string|undefined = btn.dataset.action;
  const id: number = parseInt(btn.dataset["id"] ?? "", 10);
  const post:Post|undefined =postsData.find(p => p.id === id);

  if (action === "like" && post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
     
    const likecountid:HTMLElement|null = document.querySelector<HTMLElement>(`.like_count[data-id="${id}"]`);
    if (likecountid) {
      likecountid.textContent = String(post.likes);
    }
    const svg:SVGElement|null = btn.querySelector<SVGElement>("svg");

  if (svg) {
    svg.setAttribute("fill",   post.liked ? "red" : "none");
    svg.setAttribute("stroke", post.liked ? "red" : "currentColor");
  }
}
}

function handleNewPost():void {
  const textarea:HTMLTextAreaElement|null = document.querySelector<HTMLTextAreaElement>(".user-post-row textarea");
  const text:string|undefined = textarea?.value.trim();

  //don't post if textarea is empty
  if (!text) return;

  // new post structure matching buildPostHTML
  const newPost = {
    id:         nextPostId++,           // use and then increment the counter
    name:       CURRENT_USER.name,
    initials:   CURRENT_USER.initials,
    minutesAgo: 0,                      // just posted = 0 minutes ago
    text:       text,
    image:      pendingImageDataUrl,    // null if no image was uploaded
    liked:      false,
    likes:      0,
    comments:   0,
    market: {
      question: "No market attached",  // placeholder until you build market picker
      side:     "",
      category: "",
      prevProb: 0,
      currProb: 0
    }
  };

  //Prepend to postsData so it appears at the top of the feed
  postsData.unshift(newPost as Post);

  // Save the whole array to localStorage as a JSON string
  // so posts survive a page refresh
  localStorage.setItem("postsData", JSON.stringify(postsData));

  //clear the form
if (textarea) textarea.value = "";
  pendingImageDataUrl = null;
  const fileInput: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#file-upload");
  if (fileInput) fileInput.value = "";
  renderFeed();
}


function handleTabClick(e:MouseEvent):void{ /* when you click on a tab it will change the active filter and render the feed again*/
  const tab: HTMLElement|null = (e.target as Element).closest<HTMLElement>(".time-tab");
  if (!tab) return;
  activeFilter = tab.textContent?.trim() ?? "Now";
  document.querySelectorAll<HTMLElement>(".time-tab").forEach(t =>
    t.classList.toggle("active", t === tab)
  );
  renderFeed();
}


/* filter posts based on the active filter */
function renderFeed():void{ 
  const fc:HTMLElement|null = document.querySelector<HTMLElement>(".posts-feed .container");
  if (!fc) return;
  const visible: Post[] = filterPosts(postsData);
  fc.innerHTML = visible.map(buildPostHTML).join("");
}
/* filter posts based on the active filter */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".posts-feed")?.addEventListener("click", handleFeedClick as EventListener);
  document.querySelector(".btn-post")?.addEventListener("click", handleNewPost as EventListener);
  document.querySelector(".time-tabs")?.addEventListener("click", handleTabClick as EventListener);
  //used to save the active tab so when clicked it will stay the same as the tab active
const saved:string|null = localStorage.getItem("activeTab");
  if (saved) {
  const matchingTab = Array.from(document.querySelectorAll<HTMLElement>(".time-tab"))
  .find(t => t.textContent?.trim() === saved);
    if (matchingTab) {
      activeFilter = saved;
      document.querySelectorAll<HTMLElement>(".time-tab").forEach(t =>
        t.classList.toggle("active", t === matchingTab)
      );
    }
  }
});


