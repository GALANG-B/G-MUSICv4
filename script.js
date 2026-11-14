
const JAMENDO_CLIENT_ID = "709fa152"; // ID testing saja

const audio = document.getElementById("audio");
const upload = document.getElementById("musicUpload");
const uploadBtn = document.getElementById("uploadBtn");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const progress = document.getElementById("progress");
const songTitle = document.getElementById("songTitle");
const artist = document.getElementById("artist");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const cover = document.getElementById("cover");
const licenseInfo = document.getElementById("licenseInfo");

const playlistElement = document.getElementById("playlist");
const lyricsBtn = document.getElementById("lyricsBtn");
const lyricsUpload = document.getElementById("lyricsUpload");
const lyricsContent = document.getElementById("lyricsContent");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchStatus = document.getElementById("searchStatus");
const onlineResults = document.getElementById("onlineResults");

let playlist = [];
let currentSong = 0;
let lyrics = [];
let activeLyric = -1;

// FORMAT WAKTU
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return min + ":" + String(sec).padStart(2, "0");
}

// UPLOAD MUSIK LOKAL
uploadBtn.addEventListener("click", () => upload.click());

upload.addEventListener("change", () => {
  const files = Array.from(upload.files);

  files.forEach(file => {
    if (!file.type.startsWith("audio/")) return;

    playlist.push({
      id: "local-" + crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Local Music",
      url: URL.createObjectURL(file),
      cover: null,
      license: null,
      source: "local"
    });
  });

  renderPlaylist();

  if (playlist.length && !audio.src) {
    loadSong(0);
  }

  upload.value = "";
});

// PENCARIAN MUSIK ONLINE
async function searchOnline() {
  const query = searchInput.value.trim();

  if (!query) {
    searchStatus.textContent = "Masukkan nama lagu atau artis.";
    return;
  }

  searchStatus.textContent = "Sedang mencari musik...";
  onlineResults.innerHTML = "";

  const params = new URLSearchParams({
    client_id: JAMENDO_CLIENT_ID,
    format: "json",
    limit: "15",
    search: query,
    type: "single albumtrack",
    audioformat: "mp32",
    include: "licenses"
  });

  try {
    const response = await fetch(
      "https://api.jamendo.com/v3.0/tracks/?" + params
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (data.headers?.status !== "success") {
      throw new Error(
        data.headers?.error_message || "API error"
      );
    }

    const tracks = data.results || [];

    if (!tracks.length) {
      searchStatus.textContent = "Musik tidak ditemukan.";
      return;
    }

    searchStatus.textContent =
      tracks.length + " musik ditemukan.";

    tracks.forEach(track => {
      renderOnlineTrack(track);
    });

  } catch (error) {
    console.error(error);

    searchStatus.textContent =
      "Pencarian gagal. Periksa internet, Client ID, atau coba jalankan melalui localhost/HTTPS.";
  }
}

searchBtn.addEventListener("click", searchOnline);

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchOnline();
});

// TAMPILKAN HASIL ONLINE
function renderOnlineTrack(track) {
  const card = document.createElement("div");
  card.className = "online-card";

  const image = document.createElement("img");
  image.src = track.image || "";
  image.alt = "Album cover";
  image.onerror = () => {
    image.style.visibility = "hidden";
  };

  const info = document.createElement("div");
  info.className = "online-info";

  const title = document.createElement("h3");
  title.textContent = track.name;

  const artistName = document.createElement("p");
  artistName.textContent = track.artist_name || "Unknown Artist";

  const button = document.createElement("button");
  button.textContent = "▶";
  button.title = "Play music";

  button.addEventListener("click", () => {
    if (!track.audio) {
      alert("Stream lagu tidak tersedia.");
      return;
    }

    const song = {
      id: "jamendo-" + track.id,
      name: track.name,
      artist: track.artist_name || "Unknown Artist",
      url: track.audio,
      cover: track.image || null,
      license: track.license_ccurl || null,
      source: "online"
    };

    const existing = playlist.findIndex(
      item => item.id === song.id
    );

    if (existing >= 0) {
      currentSong = existing;
    } else {
      playlist.push(song);
      currentSong = playlist.length - 1;
    }

    renderPlaylist();
    loadSong(currentSong);
    playSong();
  });

  info.append(title, artistName);
  card.append(image, info, button);

  onlineResults.appendChild(card);
}

// MEMUAT LAGU
function loadSong(index) {
  const song = playlist[index];

  if (!song) return;

  audio.pause();
  audio.src = song.url;

  songTitle.textContent = song.name;
  artist.textContent = song.artist;

  if (song.cover) {
    cover.innerHTML = "";

    const image = document.createElement("img");
    image.src = song.cover;
    image.alt = "Album cover";

    cover.appendChild(image);
  } else {
    cover.innerHTML = "<span>G MUSIC</span>";
  }

  licenseInfo.replaceChildren();

  if (song.license) {
    const link = document.createElement("a");
    link.href = song.license;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View music license";

    licenseInfo.append("License: ", link);
  } else {
    licenseInfo.textContent =
      song.source === "local"
        ? "Local music"
        : "License information unavailable";
  }

  progress.value = 0;
  currentTime.textContent = "0:00";
  duration.textContent = "0:00";

  lyrics = [];
  activeLyric = -1;
  showLyrics();

  renderPlaylist();
  audio.load();
}

// PLAY
async function playSong() {
  if (!audio.src) {
    alert("Pilih musik terlebih dahulu.");
    return;
  }

  try {
    await audio.play();
  } catch (error) {
    console.error(error);
    alert("Musik tidak dapat diputar.");
  }
}

playBtn.addEventListener("click", () => {
  if (!audio.src) {
    alert("Pilih musik terlebih dahulu.");
    return;
  }

  if (audio.paused) {
    playSong();
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", () => {
  playBtn.textContent = "❚❚";
});

audio.addEventListener("pause", () => {
  playBtn.textContent = "▶";
});

// NEXT
nextBtn.addEventListener("click", () => {
  if (!playlist.length) return;

  currentSong = (currentSong + 1) % playlist.length;
  loadSong(currentSong);
  playSong();
});

// PREVIOUS
prevBtn.addEventListener("click", () => {
  if (!playlist.length) return;

  currentSong =
    (currentSong - 1 + playlist.length) % playlist.length;

  loadSong(currentSong);
  playSong();
});

// PROGRESS
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  progress.value =
    (audio.currentTime / audio.duration) * 100;

  currentTime.textContent =
    formatTime(audio.currentTime);

  updateLyrics();
});

audio.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  if (!audio.duration) return;

  audio.currentTime =
    (progress.value / 100) * audio.duration;

  updateLyrics();
});

// AUTO NEXT
audio.addEventListener("ended", () => {
  if (!playlist.length) return;

  currentSong = (currentSong + 1) % playlist.length;
  loadSong(currentSong);
  playSong();
});

// PLAYLIST
function renderPlaylist() {
  playlistElement.innerHTML = "";

  if (!playlist.length) {
    playlistElement.innerHTML =
      '<p class="empty">Your songs will appear here.</p>';
    return;
  }

  playlist.forEach((song, index) => {
    const item = document.createElement("div");
    item.className = "song-item";

    if (index === currentSong) {
      item.classList.add("active");
    }

    const name = document.createElement("span");
    name.className = "song-name";
    name.textContent =
      (index === currentSong ? "▶ " : "♪ ") + song.name;

    const source = document.createElement("small");
    source.textContent =
      song.source === "online" ? "ONLINE" : "LOCAL";

    item.append(name, source);

    item.addEventListener("click", () => {
      currentSong = index;
      loadSong(currentSong);
      playSong();
    });

    playlistElement.appendChild(item);
  });
}

// UPLOAD LIRIK LRC
lyricsBtn.addEventListener("click", () => {
  lyricsUpload.click();
});

lyricsUpload.addEventListener("change", async () => {
  const file = lyricsUpload.files[0];

  if (!file) return;

  const text = await file.text();

  parseLyrics(text);
  showLyrics();

  lyricsUpload.value = "";
});

// MEMBACA LRC
function parseLyrics(text) {
  lyrics = [];

  const lines = text.split(/\r?\n/);

  lines.forEach(line => {
    const match = line.match(
      /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/
    );

    if (!match) return;

    const min = Number(match[1]);
    const sec = Number(match[2]);
    const fraction = match[3] || "0";

    const milliseconds = Number(
      fraction.padEnd(3, "0")
    );

    lyrics.push({
      time: min * 60 + sec + milliseconds / 1000,
      text: match[4].trim()
    });
  });

  lyrics.sort((a, b) => a.time - b.time);
  activeLyric = -1;
}

// MENAMPILKAN LIRIK
function showLyrics() {
  lyricsContent.innerHTML = "";

  if (!lyrics.length) {
    lyricsContent.innerHTML =
      "<p>Upload your own LRC lyrics file.</p>";
    return;
  }

  lyrics.forEach((line, index) => {
    const p = document.createElement("p");
    p.textContent = line.text;
    p.dataset.index = index;

    lyricsContent.appendChild(p);
  });
}

// SINKRONISASI LIRIK
function updateLyrics() {
  if (!lyrics.length) return;

  let currentIndex = -1;

  for (let i = 0; i < lyrics.length; i++) {
    if (audio.currentTime >= lyrics[i].time) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (currentIndex === activeLyric) return;

  activeLyric = currentIndex;

  const lines = lyricsContent.querySelectorAll("p");

  lines.forEach((line, index) => {
    line.classList.toggle(
      "active-lyric",
      index === activeLyric
    );
  });

  const active = lyricsContent.querySelector(
    ".active-lyric"
  );

  if (active) {
    active.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

renderPlaylist();

console.log("G MUSIC v2.0 Ready!");
