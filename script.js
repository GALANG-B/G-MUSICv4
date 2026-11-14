
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

const playlistElement = document.getElementById("playlist");

const lyricsBtn = document.getElementById("lyricsBtn");
const lyricsUpload = document.getElementById("lyricsUpload");
const lyricsContent = document.getElementById("lyricsContent");

let playlist = [];
let currentSong = 0;
let lyrics = [];
let activeLyric = -1;

// Format waktu
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return min + ":" + String(sec).padStart(2, "0");
}

// Upload musik
uploadBtn.addEventListener("click", () => {
  upload.click();
});

upload.addEventListener("change", () => {
  const files = Array.from(upload.files);

  files.forEach(file => {
    if (!file.type.startsWith("audio/")) return;

    playlist.push({
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file)
    });
  });

  renderPlaylist();

  if (playlist.length && !audio.src) {
    loadSong(0);
  }

  upload.value = "";
});

// Tampilkan playlist
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
    name.textContent = "🎵 " + song.name;

    const number = document.createElement("span");
    number.textContent = index === currentSong ? "▶" : "♪";

    item.append(name, number);

    item.addEventListener("click", () => {
      currentSong = index;
      loadSong(currentSong);
      playSong();
    });

    playlistElement.appendChild(item);
  });
}

// Memuat lagu
function loadSong(index) {
  if (!playlist[index]) return;

  audio.pause();
  audio.src = playlist[index].url;

  songTitle.textContent = playlist[index].name;
  artist.textContent = "Local Music";

  progress.value = 0;
  currentTime.textContent = "0:00";
  duration.textContent = "0:00";

  lyrics = [];
  activeLyric = -1;
  showLyrics();

  renderPlaylist();
  audio.load();
}

// Play
async function playSong() {
  if (!audio.src) {
    alert("Silakan upload musik terlebih dahulu!");
    return;
  }

  try {
    await audio.play();
    playBtn.textContent = "❚❚";
  } catch (error) {
    console.error(error);
    alert("Musik tidak dapat diputar.");
  }
}

// Play dan Pause
playBtn.addEventListener("click", () => {
  if (!audio.src) {
    alert("Silakan upload musik terlebih dahulu!");
    return;
  }

  if (audio.paused) {
    playSong();
  } else {
    audio.pause();
  }
});

audio.addEventListener("pause", () => {
  playBtn.textContent = "▶";
});

audio.addEventListener("play", () => {
  playBtn.textContent = "❚❚";
});

// Lagu berikutnya
nextBtn.addEventListener("click", () => {
  if (!playlist.length) return;

  currentSong = (currentSong + 1) % playlist.length;
  loadSong(currentSong);
  playSong();
});

// Lagu sebelumnya
prevBtn.addEventListener("click", () => {
  if (!playlist.length) return;

  currentSong =
    (currentSong - 1 + playlist.length) % playlist.length;

  loadSong(currentSong);
  playSong();
});

// Update progress
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  progress.value =
    (audio.currentTime / audio.duration) * 100;

  currentTime.textContent =
    formatTime(audio.currentTime);

  updateLyrics();
});

// Metadata
audio.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(audio.duration);
});

// Geser progress
progress.addEventListener("input", () => {
  if (!audio.duration) return;

  audio.currentTime =
    (progress.value / 100) * audio.duration;

  updateLyrics();
});

// Lagu selesai
audio.addEventListener("ended", () => {
  if (!playlist.length) return;

  currentSong = (currentSong + 1) % playlist.length;
  loadSong(currentSong);
  playSong();
});

// Upload lirik
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

// Membaca format LRC
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

    const time =
      min * 60 + sec + milliseconds / 1000;

    lyrics.push({
      time: time,
      text: match[4].trim()
    });
  });

  lyrics.sort((a, b) => a.time - b.time);
  activeLyric = -1;
}

// Menampilkan lirik
function showLyrics() {
  lyricsContent.innerHTML = "";

  if (!lyrics.length) {
    lyricsContent.innerHTML =
      "<p>Upload an LRC lyrics file.</p>";
    return;
  }

  lyrics.forEach((line, index) => {
    const p = document.createElement("p");
    p.textContent = line.text;
    p.dataset.index = index;

    if (index === activeLyric) {
      p.classList.add("active-lyric");
    }

    lyricsContent.appendChild(p);
  });
}

// Sinkronisasi lirik
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

console.log("G MUSIC v1.0 Ready!");
