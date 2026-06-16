// ===== Like Button Functionality with Firebase =====
(function() {
  const DATABASE_URL = 'https://ziyang-like-default-rtdb.firebaseio.com';
  const LIKES_PATH = '/likes';
  const LIKED_KEY = 'ziyang_gong_has_liked';
  const DEVICE_ID_KEY = 'ziyang_gong_device_id';

  const likeBtn = document.getElementById('likeBtn');
  const likeCount = document.getElementById('likeCount');
  const likeIcon = document.getElementById('likeIcon');

  if (!likeBtn || !likeCount) return;

  // 生成设备唯一ID
  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // 检查本地是否已点赞
  function hasLikedLocally() {
    return localStorage.getItem(LIKED_KEY) === 'true';
  }

  // 标记为已点赞
  function setLikedLocally() {
    localStorage.setItem(LIKED_KEY, 'true');
  }

  // 获取当前点赞数和已点赞设备列表
  async function fetchLikes() {
    try {
      const response = await fetch(`${DATABASE_URL}${LIKES_PATH}.json`);
      const data = await response.json();
      if (!data) {
        return { count: 0, devices: {} };
      }
      const devices = data.devices || {};
      const count = Object.keys(devices).length;
      return { count, devices };
    } catch (err) {
      console.error('Failed to fetch likes:', err);
      return { count: 0, devices: {} };
    }
  }

  // 添加点赞
  async function addLike() {
    const deviceId = getDeviceId();
    try {
      // 使用 PUT 添加设备到列表
      const response = await fetch(`${DATABASE_URL}${LIKES_PATH}/devices/${deviceId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          timestamp: Date.now(),
          userAgent: navigator.userAgent.slice(0, 50)
        })
      });
      if (response.ok) {
        const data = await fetchLikes();
        return data.count;
      }
      return null;
    } catch (err) {
      console.error('Failed to add like:', err);
      return null;
    }
  }

  // 更新显示
  async function updateDisplay() {
    const { count } = await fetchLikes();
    const liked = hasLikedLocally();
    likeCount.textContent = count;
    if (liked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
  }

  // 点击事件
  likeBtn.addEventListener('click', async function() {
    if (hasLikedLocally()) {
      // 已点赞，只做视觉反馈
      likeBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        likeBtn.style.transform = '';
      }, 150);
    } else {
      // 未点赞，添加点赞
      const newCount = await addLike();
      if (newCount !== null) {
        setLikedLocally();
        likeCount.textContent = newCount;
        likeBtn.classList.add('liked');

        // 添加动画效果
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
          likeBtn.style.transform = '';
        }, 200);
      }
    }
  });

  // 初始化显示
  updateDisplay();

  // 每 10 秒刷新一次计数（实时同步其他用户的点赞）
  setInterval(updateDisplay, 10000);
})();

// ===== Publications Filter =====
const chips = Array.from(document.querySelectorAll(".filter-tag"));
const pubs = Array.from(document.querySelectorAll(".pub"));

function setActive(filter) {
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));

  pubs.forEach((p) => {
    const tags = (p.dataset.tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const show = filter === "all" || tags.includes(filter);

    if (show) {
      p.style.display = "";
      p.style.opacity = "0";
      p.style.transform = "translateY(8px)";
      requestAnimationFrame(() => {
        p.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        p.style.opacity = "1";
        p.style.transform = "translateY(0)";
      });
    } else {
      p.style.display = "none";
    }
  });
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => setActive(chip.dataset.filter));
});

setActive("all");

// ===== Section Tabs (Publications / Funding) =====
const sectionTabs = Array.from(document.querySelectorAll(".section-tab"));
const sectionPanels = Array.from(document.querySelectorAll(".section-panel"));

function activateSection(name) {
  sectionTabs.forEach((tab) => {
    const active = tab.dataset.section === name;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  sectionPanels.forEach((panel) => {
    const active = panel.id === `${name}-panel`;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

sectionTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateSection(tab.dataset.section));
});

document.querySelectorAll("[data-section-tab]").forEach((link) => {
  link.addEventListener("click", () => {
    activateSection(link.dataset.sectionTab);
  });
});

activateSection("publications");

// ===== Visitor Counter (Firebase) =====
(function initVisitorCounter() {
  const DATABASE_URL = "https://ziyang-like-default-rtdb.firebaseio.com";
  const PAGE_VIEWS_PATH = "/visitors/pageviews";
  const VISIT_FLAG_KEY = "ziyang_gong_visit_recorded";
  const visitorCountEl = document.getElementById("visitorCount");

  if (!visitorCountEl) return;

  const htmlBaseline = Number(visitorCountEl.dataset.visitorBaseline || 0);

  async function fetchPageViews() {
    const response = await fetch(`${DATABASE_URL}${PAGE_VIEWS_PATH}.json`);
    const value = await response.json();
    return Number(value) || 0;
  }

  async function recordVisitOnce() {
    if (sessionStorage.getItem(VISIT_FLAG_KEY)) return;

    const current = await fetchPageViews();
    const response = await fetch(`${DATABASE_URL}${PAGE_VIEWS_PATH}.json`, {
      method: "PUT",
      body: JSON.stringify(current + 1),
    });

    if (response.ok) {
      sessionStorage.setItem(VISIT_FLAG_KEY, "1");
    }
  }

  async function updateVisitorCount() {
    try {
      await recordVisitOnce();
      const pageviews = await fetchPageViews();
      const total = htmlBaseline + pageviews;
      visitorCountEl.textContent = total.toLocaleString();
    } catch (error) {
      console.warn("Failed to update visitor count:", error);
      if (htmlBaseline > 0) {
        visitorCountEl.textContent = htmlBaseline.toLocaleString();
      } else {
        visitorCountEl.textContent = "—";
      }
    }
  }

  updateVisitorCount();
  window.setInterval(updateVisitorCount, 30000);
})();

// ===== Live GitHub Stars =====
function formatGithubStars(count) {
  if (count >= 1000) {
    const value = (count / 1000).toFixed(1).replace(/\.0$/, "");
    return `${value}k`;
  }
  return count.toLocaleString();
}

async function updateGithubStars() {
  const nodes = Array.from(document.querySelectorAll("[data-github-stars]"));
  if (!nodes.length) return;

  const repos = [...new Set(nodes.map((node) => node.dataset.githubStars).filter(Boolean))];

  await Promise.all(
    repos.map(async (repo) => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const formatted = formatGithubStars(data.stargazers_count);
        nodes
          .filter((node) => node.dataset.githubStars === repo)
          .forEach((node) => {
            node.textContent = formatted;
          });
      } catch (error) {
        console.warn(`Failed to fetch GitHub stars for ${repo}:`, error);
        nodes
          .filter((node) => node.dataset.githubStars === repo)
          .forEach((node) => {
            if (node.dataset.githubStarsFallback) {
              node.textContent = node.dataset.githubStarsFallback;
            }
          });
      }
    })
  );
}

updateGithubStars();

// ===== Visitor Map (MapMyVisitors) =====
(function initVisitorMap() {
  const container = document.getElementById("visitors-map");
  const fallback = document.getElementById("visitors-map-fallback");
  if (!container) return;

  const siteId = container.dataset.mapSiteId;
  if (!siteId) return;

  const showFallback = () => {
    container.hidden = true;
    if (fallback) fallback.hidden = false;
  };

  const params = new URLSearchParams({
    d: siteId,
    cl: "ffffff",
    w: "a",
  });

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.id = "mapmyvisitors";
  script.async = true;
  script.src = `https://mapmyvisitors.com/map.js?${params.toString()}`;
  script.onerror = showFallback;
  container.appendChild(script);

  window.setTimeout(() => {
    const hasMap = container.querySelector("img, canvas, iframe, svg");
    if (!hasMap) showFallback();
  }, 12000);
})();

// ===== Auto-update Date =====
document.getElementById("lastUpdated").textContent = new Date().toISOString().slice(0, 10);

// ===== "/" Hotkey =====
window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    chips[0]?.focus();
  }
});

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('.nav a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
