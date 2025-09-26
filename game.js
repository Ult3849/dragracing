/*
 Single-file drag racing game (HTML + JS)
 No styling, all logic in this file.
 Saved data -> localStorage under 'dr_game_v1'
 const GAME_VERSION = "1.12"; // ubah setiap kali kamu edit upah/fitur
*/

// ---------- Utilities ----------
const GAME_VERSION = "1.12"; // ganti setiap kali update data

function q(id){ return document.getElementById(id); }
function el(tag, text){ const e = document.createElement(tag); if(text!==undefined) e.textContent = text; return e; }
function saveState(){ localStorage.setItem('dr_game_v1', JSON.stringify(state)); }

function link(text, onClick){
  const a = document.createElement('a');
  a.textContent = text;
  a.href = "#";
  a.style.cursor = "pointer";
  a.onclick = (e)=> {
    e.preventDefault();
    if(onClick) onClick();
  };
  return a;
}

function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem('dr_game_v1'));
    // cek versi
    if(s && s._version === GAME_VERSION) {
      return s;
    }
  }catch(e){}
  return null;
}
function now(){ return Date.now(); }


function getCarImage(car){
  // jika ada properti `img` gunakan itu, atau default
  if(car.img) return car.img;

  // fallback: default PNG online atau lokal
  return 'images/default_car.png';
}


// ---------- Initial game data ----------
const defaultCars = [
  {id:'car01', name:'Speedster', price:1000, img:'images/car01.png', stats:{engine:30,speed:30,power:30,weight:20,grip:20}},
  {id:'car02', name:'Cruiser', price:800, img:'images/car02.png', stats:{engine:25,speed:28,power:27,weight:22,grip:23}},
  {id:'car03', name:'Blazer', price:1200, img:'images/car03.png', stats:{engine:35,speed:32,power:33,weight:18,grip:19}},
  {id:'car04', name:'Raven', price:1500, img:'images/car04.png', stats:{engine:38,speed:36,power:34,weight:17,grip:20}},
  {id:'car05', name:'Comet', price:900, img:'images/car05.png', stats:{engine:28,speed:29,power:26,weight:21,grip:24}},
  {id:'car06', name:'Vortex', price:1100, img:'images/car06.png', stats:{engine:33,speed:31,power:32,weight:19,grip:18}},
  {id:'car07', name:'Bullet', price:1300, img:'images/car07.png', stats:{engine:36,speed:34,power:35,weight:16,grip:18}},
  {id:'car08', name:'Phantom', price:1400, img:'images/car08.png', stats:{engine:37,speed:35,power:33,weight:16,grip:19}},
  {id:'car09', name:'Glide', price:700, img:'images/car09.png', stats:{engine:22,speed:26,power:24,weight:24,grip:25}},
  {id:'car10', name:'Titan', price:2000, img:'images/car10.png', stats:{engine:45,speed:40,power:42,weight:15,grip:20}},
  {id:'car11', name:'Nova', price:950, img:'images/car11.png', stats:{engine:29,speed:28,power:27,weight:22,grip:23}},
  {id:'car12', name:'Zephyr', price:980, img:'images/car12.png', stats:{engine:30,speed:29,power:28,weight:21,grip:24}}
];

const jobsList = [
  // durations in seconds for demo (change to minutes * 60 if desired)
  {id:'job1', name:'Delivery Driver', duration:10, wage:1180, imgColor:'#cfc'},
  {id:'job2', name:'Mechanic Helper', duration:15, wage:1120, imgColor:'#ccf'},
  {id:'job3', name:'Promo Flyer', duration:8, wage:1150, imgColor:'#fcc'}
];

const chaptersTemplate = [
  {id:'c1', name:'Bab 1', unlocked:true},
  {id:'c2', name:'Bab 2', unlocked:false},
  {id:'c3', name:'Bab 3', unlocked:false},
  {id:'c4', name:'Bab 4', unlocked:false},
  {id:'c5', name:'Bab 5', unlocked:false}
];

const bossNames = {
  'c1': 'Andi',
  'c2': 'Tiara',
  'c3': 'Reza',
  'c4': 'Siska',
  'c5': 'Black Cobra'
};

// create enemies per chapter
function makeChapters(){
  return chaptersTemplate.map((ch,ci) => {
    const trackLength = (ci < 3 ? 402 : 804);
    const enemies = [];

    for(let i=1;i<=4;i++){
      enemies.push({
        id: `${ch.id}_e${i}`,
        name: `Anonymous`,
        type: 'mook',
        car: defaultCars[(ci*2 + i) % defaultCars.length],
      });
    }

    // daftar pre & post dialog unik per bos
    const bossPreDialogs = {
      'c1': "Aku adalah raja jalanan di bab 1. Siap kalah?",
      'c2': "Hanya yang tercepat bisa melewati bab ini!",
      'c3': "Aku tidak pernah kalah di bab 3. Cobalah buktikan!",
      'c4': "Kamu sudah sejauh ini, tapi aku penghalangmu di bab 4.",
      'c5': "Ini final! Aku adalah tantangan terakhirmu!"
    };

    const bossPostDialogs = {
      'c1': "Hmph... kamu terlalu cepat di bab ini!",
      'c2': "Tidak mungkin! Aku harus melatih mobilku lagi...",
      'c3': "Kamu mengalahkanku, tapi masih ada bab berikutnya!",
      'c4': "Aku kalah... tapi aku akan kembali lebih kuat!",
      'c5': "Luar biasa... kamu benar-benar raja drag race!"
    };

    enemies.push({
      id: `${ch.id}_boss`,
      name: bossNames[ch.id],
      type: 'boss',
      car: defaultCars[(ci+5) % defaultCars.length],
      preDialog: bossPreDialogs[ch.id] || "Saya bos misterius. Siap kalah?",
      postDialog: bossPostDialogs[ch.id] || "Kalahkan aku lain kali..."
    });

    return {...ch, enemies, trackLength};
  });
}

// ---------- Race calculation ----------
function calcRaceScore(car, trackLength){
  const effectivePower = car.stats.power - Math.floor(car.stats.weight/100) * 7;

  let powerWeight, speedWeight;
  if(trackLength <= 400){ // 1/4 mile
    powerWeight = 0.7;
    speedWeight = 0.3;
  } else if(trackLength <= 800){ // 1/2 mile
    powerWeight = 0.5;
    speedWeight = 0.5;
  } else {
    powerWeight = 0.3;
    speedWeight = 0.7;
  }

  return (effectivePower * powerWeight) + (car.stats.speed * speedWeight);
}

// ---------- Helpers ----------
function loadState() {
  try {
    return JSON.parse(localStorage.getItem("dr_game_v1"));
  } catch (e) {
    return null;
  }
}

function makeChapters() {
  return [
    { id: 1, name: "Chapter 1", unlocked: true },
    { id: 2, name: "Chapter 2", unlocked: false }
  ];
}

// ---------- State ----------
let state = loadState() || {
  _version: GAME_VERSION,   // simpan versi
  money: 500,
  fuel: 100,
  maxFuel: 100,
  fuelLastTick: now(),
  player: {
    name: 'Player',
    avatarColor: '#88aaff',
    wins:0,
    losses:0
  },
  garage: [],
  currentCarId: null,
  ownedCars: [],
  chapters: makeChapters(),
  defeatedBosses: {},
  jobs: jobsList,
  currentJob: null,
  careerPrologSeen: false,
  careerPrologIndex: 0,
  careerProgress: {},
  fuelAutoRegenIntervalMs: 600000,
  lastFuelRegen: now(),
  rivalsSeen: [],
  bossDialogsSeen: {},
};

// if player has no car, give starter car
if(state.ownedCars.length===0){
  const starter = Object.assign({}, defaultCars[0]);
  state.ownedCars.push(starter);
  state.currentCarId = starter.id;
  state.garage = [starter.id];
}

// ensure garage contains car ids
function getCarById(id){
  return state.ownedCars.concat(defaultCars).find(c=>c.id===id);
}

// ---------- Fuel regen ----------
function regenFuelIfNeeded(){
  // add +10 every 10 minutes elapsed since lastFuelRegen
  const nowTime = now();
  const interval = state.fuelAutoRegenIntervalMs;
  const elapsed = nowTime - state.lastFuelRegen;
  if(elapsed >= interval){
    const steps = Math.floor(elapsed / interval);
    state.fuel = Math.min(state.maxFuel, state.fuel + 10*steps);
    state.lastFuelRegen += steps * interval;
    saveState();
  }
}
// setup interval to regen every minute check (but actual addition only per 10min)
setInterval(()=>{
  regenFuelIfNeeded();
}, 10000); // check every 10s for demo responsiveness

// ---------- UI Rendering ----------
const root = document.getElementById('app');

function clearRoot(){ root.innerHTML=''; }

function renderHeader(){
  const wrapper = el('div');

  const hdr = el('div');
  hdr.className = 'header';
  hdr.appendChild(el('div', `Money: $${state.money} | Fuel: ${state.fuel}/${state.maxFuel}`));

  wrapper.appendChild(hdr);

  const hr = document.createElement('hr');
  wrapper.appendChild(hr);

  return wrapper;
}


function renderMainMenu(){
  clearRoot();
  root.appendChild(renderHeader());
  const menu = el('div');
  menu.className = 'main-menu menu';
  menu.appendChild(el('h2','Menu Utama'));

  const buttons = ['Karir','Dealer','Kerja','Garasi','Rival','Profile'];
  buttons.forEach(b=>{
    const link = el('a', b);  
    link.href = "#";       
    link.onclick = (e)=> {
      e.preventDefault();
      switch(b){
         case 'Karir':
           if (state.careerPrologSeen) {
             renderCareerChapters();
           } else {
             renderCareerStart();
           }
           break;
         case 'Dealer': renderDealer(1); break;
         case 'Kerja': renderJobs(); break;
         case 'Garasi': renderGarage(); break;
         case 'Rival': renderRivals(); break;
         case 'Profile': renderProfile(); break;
      }
    };
    menu.appendChild(link);
menu.appendChild(el('br'));
  });

  root.appendChild(menu);
}

// ---------- Career Flow ----------
const prologTexts = [
  "Prolog 1: Kamu memulai perjalanan menjadi raja drag racing.",
  "Prolog 2: Latih mobilmu, dapatkan uang, dan kalahkan bos tiap bab.",
  "Prolog 3: Jalan masih panjang — semoga beruntung!"
];

function renderCareerStart(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Mode Karir - Prolog'));
  const p = el('div', prologTexts[state.careerPrologIndex] || '');
  container.appendChild(p);
  const next = el('button', 'Next');
  next.onclick = ()=>{
    state.careerPrologIndex++;
    if(state.careerPrologIndex >= prologTexts.length){
      state.careerPrologSeen = true;
      state.careerPrologIndex = prologTexts.length-1;
      renderCareerChapters();
    } else {
      renderCareerStart();
    }
    saveState();
  };
  container.appendChild(next);
  const back = el('button', 'Kembali ke Menu');
  back.onclick = ()=>{ renderMainMenu(); };
  container.appendChild(el('br'));
  container.appendChild(back);
  root.appendChild(container);
}

function renderCareerChapters(){
  clearRoot();
  regenFuelIfNeeded();
  root.appendChild(renderHeader());

  const container = el('div');
  container.appendChild(el('h2','Karir'));

  state.chapters.forEach((ch, idx)=>{
    const row = el('div');
    row.className = 'chapter-row';

    if(ch.unlocked){
      
      const lnk = link(ch.name, ()=> renderChapterDetail(idx));
      row.appendChild(lnk);
    } else {
      
      row.appendChild(el('span', ch.name + ' (Terkunci)'));
    }

    // status boss
    const boss = ch.enemies.find(e => e.type==='boss');
    row.appendChild(el('span', state.defeatedBosses[boss.id] ? ' (Selesai)' : ''));

    container.appendChild(row);
  });

  const back = link('Kembali', ()=> renderMainMenu());
  container.appendChild(el('br'));
  container.appendChild(back);

  root.appendChild(container);
}


function renderBossDialog(boss, text, onNext){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Dialog Bos'));
  container.appendChild(el('div', text));
  const btn = el('button','Lanjut');
  btn.onclick = ()=>{
    if(onNext) onNext();
  };
  container.appendChild(el('br'));
  container.appendChild(btn);
  root.appendChild(container);
}

function renderEnding(){
  clearRoot();
  root.appendChild(renderHeader());

  const container = el('div');
  container.appendChild(el('h2','ENDING'));
  container.appendChild(el('p','Selamat! Kamu telah mengalahkan semua bos dan menjadi Raja Drag Race!'));
  container.appendChild(el('p','Terima kasih telah bermain.'));

  const back = el('button','Kembali ke Menu Utama');
  back.onclick = ()=> renderMainMenu();
  container.appendChild(back);

  root.appendChild(container);
}

function renderChapterDetail(idx){
  clearRoot();
  root.appendChild(renderHeader());

  const ch = state.chapters[idx];
  const container = el('div');
  container.appendChild(el('h2', ch.name));
  const progress = state.careerProgress[ch.id] ?? -1;

  ch.enemies.forEach((e, i)=>{
    // aturan unlock: musuh pertama langsung terbuka, berikutnya hanya setelah yang sebelumnya kalah
    const unlocked = (i === 0) || (progress >= i-1) || state.defeatedBosses[e.id];
    if(unlocked){
      const a = document.createElement('a');
      a.textContent = e.name
      a.href = "#";
      a.style.cursor = "pointer";
      a.onclick = (ev)=>{
        ev.preventDefault();
        startBattleWith(e);
      };
      container.appendChild(a);
    } else {
      container.appendChild(el('span', e.name + ' (Terkunci)'));
    }
    container.appendChild(el('br'));
  });

  const back = document.createElement('a');
  back.textContent = 'Kembali';
  back.href = "#";
  back.style.cursor = "pointer";
  back.onclick = (ev)=>{
    ev.preventDefault();
    renderCareerChapters();
  };
  container.appendChild(el('br'));
  container.appendChild(back);

  root.appendChild(container);
}

// ---------- Battle Screen ----------
function startBattleWith(enemy, onWinCallback){
  const chIdx = state.chapters.findIndex(ch => 
    ch.enemies.some(e => e.id === enemy.id)
  );
  clearRoot();
  regenFuelIfNeeded();
  root.appendChild(renderHeader());

  // cari jarak trek dari bab musuh
  const trackLength = state.chapters.find(ch => 
    ch.enemies.some(e => e.id === enemy.id)
  )?.trackLength || 400; // default 400m kalau tidak ketemu
  const playerCar = getCarById(state.currentCarId);
  const enemyCar = enemy.car;
  const container = el('div');
  container.className = 'battle-container';

  // --- Baris nama ---
  const namesRow = el('div');
  namesRow.className = 'battle-names';
  namesRow.appendChild(el('div', state.player.name));
  namesRow.appendChild(el('div', enemy.name));
  container.appendChild(namesRow);

// container avatar
const avatarsRow = el('div');
avatarsRow.style.position = 'relative';
avatarsRow.style.width = '100%';
avatarsRow.style.height = '120px';
avatarsRow.style.margin = '0';
avatarsRow.style.padding = '0';
avatarsRow.style.boxSizing = 'border-box';

// avatar pemain kiri
const playerAvatar = el('img');
playerAvatar.src = getAvatarImage(state.player.name, 'player');
playerAvatar.width = 120;
playerAvatar.style.position = 'absolute';
playerAvatar.style.left = '0';
playerAvatar.style.top = '0';
playerAvatar.style.margin = '0';
playerAvatar.style.padding = '0';
playerAvatar.style.display = 'block';
avatarsRow.appendChild(playerAvatar);

// avatar musuh kanan
const enemyAvatar = el('img');
enemyAvatar.src = getAvatarImage(enemy.name, enemy.type);
enemyAvatar.width = 120;
enemyAvatar.style.position = 'absolute';
enemyAvatar.style.right = '0';
enemyAvatar.style.top = '0';
enemyAvatar.style.margin = '0';
enemyAvatar.style.padding = '0';
enemyAvatar.style.display = 'block';
avatarsRow.appendChild(enemyAvatar);

container.appendChild(avatarsRow);

// Mobil pemain
const playerCarImg = el('img');
playerCarImg.src = getCarImage(playerCar);
playerCarImg.width = 240;
playerCarImg.className = 'battle-car';
container.appendChild(playerCarImg);

// --- Link Race di tengah ---
const raceWrapper = el('div');   // container baru
raceWrapper.style.textAlign = 'center'; // posisikan tengah
const raceLink = link('Race', ()=>{
  if(state.fuel < 10){
    alert('Bahan bakar tidak cukup (butuh 10).');
    return;
  }
  state.fuel -= 10;
  saveState();

  const ps = playerCar ? calcRaceScore(playerCar, trackLength) : 50;
  const es = enemyCar ? calcRaceScore(enemyCar, trackLength) : 50;
  const pFinal = ps + (Math.random()*20 - 10);
  const eFinal = es + (Math.random()*20 - 10);
  const won = pFinal >= eFinal;

  if(won){
    const reward = Math.floor((enemyCar.price || 200) * 0.2);
    state.money += reward;
    state.player.wins++;
    alert('Menang! Dapat $' + reward);

    // update progres bab untuk musuh biasa
    if(enemy.type !== 'boss'){
      const chapter = state.chapters[chIdx];
      const enemyIndex = chapter.enemies.indexOf(enemy);
      if(!state.careerProgress[chapter.id]) state.careerProgress[chapter.id] = -1;
      if(enemyIndex > state.careerProgress[chapter.id]){
        state.careerProgress[chapter.id] = enemyIndex;
      }
    }

    if(enemy.type==='boss'){
      state.defeatedBosses[enemy.id] = true;
      if(chIdx+1 < state.chapters.length){
        state.chapters[chIdx+1].unlocked = true;
      }

      if(enemy.postDialog && !state.bossDialogsSeen[enemy.id+'_post']){
        state.bossDialogsSeen[enemy.id+'_post'] = true;
        saveState();
        return renderBossDialog(enemy, enemy.postDialog, ()=> {
          if(onWinCallback) onWinCallback();
          if(enemy.id === 'c5_boss'){
            renderEnding();
          } else {
            renderChapterDetail(chIdx);
          }
        });
      }
    }

    saveState();
    if(onWinCallback) onWinCallback();
    renderChapterDetail(chIdx);
  } else {
    const loss = Math.floor((enemyCar.price || 200) * 0.05);
    state.money = Math.max(0, state.money - loss);
    state.player.losses++;
    alert('Kalah! Kehilangan $' + loss);
    saveState();
    renderChapterDetail(chIdx);
  }
});

raceWrapper.appendChild(raceLink);
container.appendChild(raceWrapper);
container.appendChild(el('br'));

// Mobil musuh
const enemyCarImg = el('img');
enemyCarImg.src = getCarImage(enemy.car);
enemyCarImg.width = 240;
enemyCarImg.className = 'battle-car';
container.appendChild(enemyCarImg);

// --- Link Kembali ---
  const backLink = link('Kembali ke Menu', ()=> renderMainMenu());
  container.appendChild(backLink);

  root.appendChild(container);
}

// ---------- Dealer ----------
function renderDealer(page=1){
  clearRoot();
  root.appendChild(renderHeader());
  const perPage = 10;
  const start = (page-1)*perPage;
  const pageCars = defaultCars.slice(start, start+perPage);
  const container = el('div');
  container.appendChild(el('h2','Dealer'));

  pageCars.forEach(c=>{
    const row = el('div');
    row.appendChild(el('div', 'Nama: ' + c.name));
    row.appendChild(el('div', 'Harga: $' + c.price));
    const img = el('img'); 
img.src = getCarImage(c);
img.width = 240;
row.appendChild(img);

    // <-- statistik dihilangkan: tidak menambahkan statDiv ke DOM -->

    const buyLink = link('Beli', ()=>{
  if(state.money < c.price){
    alert('Uang tidak cukup');
    return;
  }
  state.money -= c.price;
  // add copy of car to owned
  const copy = JSON.parse(JSON.stringify(c));
  copy.id = copy.id + '_' + Math.floor(Math.random()*10000);
  if(!copy.upgrades) copy.upgrades = {};
  state.ownedCars.push(copy);
  state.garage.push(copy.id);
  saveState();
  alert('Terbeli: ' + copy.name);
  renderDealer(page);
});
row.appendChild(buyLink);
    container.appendChild(row);
  });

  // pagination
  if(defaultCars.length > perPage){
    const nextLink = link('Next Page', ()=> renderDealer(page+1));
container.appendChild(nextLink);
  }
 const back = link('Kembali', ()=> renderMainMenu());
container.appendChild(el('br'));
container.appendChild(back);
  root.appendChild(container);
}

// ---------- Jobs (Kerja) ----------
function renderJobs(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Kerja'));

  // tampilkan semua pekerjaan
  state.jobs.forEach(job=>{
    const row = el('div');
    row.appendChild(el('div', job.name));
    row.appendChild(el('div', 'Durasi: ' + job.duration + ' detik'));
    row.appendChild(el('div', 'Upah: $' + job.wage));
    const linkBtn = link('Kerja', ()=>{
  if(state.currentJob){
    alert('Sedang ada pekerjaan lain sedang berlangsung.');
    return;
  }
  const endTime = now() + job.duration*1000;
  state.currentJob = {jobId: job.id, endTime: endTime, jobData: job};
  saveState();
  renderJobs(); // refresh tampilan
});
row.appendChild(linkBtn);
    container.appendChild(row);
  });

  container.appendChild(el('hr'));

  // status pekerjaan saat ini
  if(state.currentJob){
    const cur = state.currentJob;
    const jd = cur.jobData;
    const remaining = Math.max(0, Math.ceil((cur.endTime - now())/1000));
    container.appendChild(el('div','Sedang berlangsung...'));
    container.appendChild(el('div','Pekerjaan: ' + jd.name));
    container.appendChild(el('div','Durasi tersisa: ' + remaining + ' detik'));
    const cancel = link('Batal', ()=>{
  state.currentJob = null;
  saveState();
  renderJobs();
});
container.appendChild(cancel);

    if(remaining <= 0){
      state.money += jd.wage;
      alert('Pekerjaan selesai. Anda menerima $' + jd.wage);
      state.currentJob = null;
      saveState();
      renderJobs();
      return;
    } else {
      setTimeout(()=> renderJobs(), 1000);
    }
  } else {
    container.appendChild(el('div','Tidak ada pekerjaan sedang berlangsung.'));
  }

  const back = link('Kembali', ()=> renderMainMenu());
container.appendChild(el('br')); 
container.appendChild(back);
  root.appendChild(container);
}

// ---------- Garage ----------
function renderGarage(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
container.className = 'garage-container';

const img = el('img');
img.className = 'car-img';
  container.appendChild(el('h2','Garasi'));
  const currentCar = getCarById(state.currentCarId);
  container.appendChild(el('div', 'Mobil digunakan: ' + (currentCar ? currentCar.name : 'Tidak ada')));
  if(currentCar){
  const img = el('img'); 
  img.src = getCarImage(currentCar);
  img.width = 300;
  container.appendChild(img);
}
    // stats bars text
    const statsDiv = el('div');
    if(currentCar){
statsDiv.appendChild(el('div', `Speed: ${currentCar.stats.speed} KM/H`));
statsDiv.appendChild(el('div', `Power: ${currentCar.stats.power} HP`));
statsDiv.appendChild(el('div', `Weight: ${currentCar.stats.weight} KG`));
container.appendChild(statsDiv);
  }
  // menu within garage
const ops = ['upgrade','Semua mobil','Bahan bakar'];
ops.forEach(op=>{
  const linkEl = link(op, ()=>{
    switch(op){
      case 'upgrade': renderUpgrade(); break;
      case 'Semua mobil': renderAllCarsInGarage(); break;
      case 'Bahan bakar': renderFuelShop(); break;
    }
  });
  container.appendChild(linkEl);
  container.appendChild(el('br')); // optional, beri jarak antar link
});

  const back = link('Kembali', ()=> renderMainMenu());
  container.appendChild(el('br'));
  container.appendChild(back);
  root.appendChild(container);
}

function renderAllCarsInGarage(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Semua Mobil (Garasi)'));
  state.ownedCars.forEach(c=>{
    const row = el('div');
    row.appendChild(el('div', c.name));
    row.appendChild(el('div', '$' + (c.price || 0)));
    const img = el('img'); 
img.src = getCarImage(c);
img.width = 240;
row.appendChild(img);
    const useLink = link('Gunakan', ()=> {
  state.currentCarId = c.id;
  saveState();
  alert('Mobil sekarang: ' + c.name);
  renderGarage();
});
row.appendChild(useLink);
    container.appendChild(row);
  });
  const back = link('Kembali', ()=> renderGarage());
container.appendChild(el('br'));
container.appendChild(back);
  root.appendChild(container);
}

function getAvatarImage(name, type) {
  if (type === 'player') return 'images/player.png';
  if (name === 'Anonymous') return 'images/anonymous.png';

  // mapping untuk bos
  const bossImages = {
    'Andi': 'images/andi.png',
    'Tiara': 'images/tiara.png',
    'Reza': 'images/reza.png',
    'Siska': 'images/siska.png',
    'Black Cobra': 'images/blackcobra.png'
  };

  return bossImages[name] || 'images/anonymous.png';
}

function renderUpgrade(){
  clearRoot();
  root.appendChild(renderHeader());
  const car = getCarById(state.currentCarId);
  if(!car){ 
    alert('Tidak ada mobil dipilih'); 
    renderGarage(); 
    return; 
  }
  const container = el('div');
  container.appendChild(el('h2','Upgrade - ' + car.name));

  // pastikan ada slot upgrades
  if(!car.upgrades) car.upgrades = {};

  ["speed","power","weight"].forEach(k=>{
    const row = el('div');
    

    // tampilkan label dan value
    let label = '';
    if(k==="speed") label = `Speed: ${car.stats.speed} KM/H`;
    if(k==="power") label = `Power: ${car.stats.power} HP`;
    if(k==="weight") label = `Weight: ${car.stats.weight} KG`;

    const span = el('span', label);
    row.appendChild(span);

    // upgrade info
    const upgradesDone = car.upgrades[k] || 0;
    const maxUpgrades = 5;
    const cost = 200; 

    if(upgradesDone < maxUpgrades){
      const upgradeLink = el('a', 'Upgrade');
      upgradeLink.href = "#";
      upgradeLink.style.marginLeft = '10px';
      upgradeLink.onclick = (e)=>{
        e.preventDefault();
        if(state.money < cost){ 
          alert('Uang tidak cukup'); 
          return; 
        }
        state.money -= cost;

        // logika upgrade
        if(k==="speed") car.stats.speed += 7;
        if(k==="power") car.stats.power += 8;
        if(k==="weight") car.stats.weight -= 70;

        car.upgrades[k] = upgradesDone + 1;
        saveState();
        renderUpgrade();
      };

      // teks biaya biasa
      const costSpan = el('span', ` (Biaya: ${cost})`);
      row.appendChild(upgradeLink);
      row.appendChild(costSpan);
    } else {
      // tampilkan "Max" saja
      const maxSpan = el('span', ' (MAX)');
      maxSpan.style.marginLeft = '10px';
      row.appendChild(maxSpan);
    }

    container.appendChild(row);
  });

  const back = link('Kembali', ()=> renderGarage());
  container.appendChild(el('br'));
  container.appendChild(back);

  root.appendChild(container);
}


function renderPaint(){
  clearRoot();
  root.appendChild(renderHeader());
  const car = getCarById(state.currentCarId);
  if(!car){ alert('Tidak ada mobil dipilih'); renderGarage(); return; }
  const container = el('div');
  container.appendChild(el('h2','Paint - ' + car.name));
  container.appendChild(el('div','Warna saat ini: ' + car.color));
  container.appendChild(el('img',)); // placeholder
  const colors = ['#ff4444','#44aaee','#ffaa00','#88cc66','#7744ff','#dd1155','#333300'];
  colors.forEach(c=>{
    const box = el('button');
    box.textContent = c;
    box.style.marginRight='4px';
    box.onclick = ()=>{
      const cost = 50;
      if(state.money < cost){ alert('Uang tidak cukup'); return; }
      state.money -= cost;
      car.color = c;
      saveState();
      renderPaint();
    };
    container.appendChild(box);
  });
  const back = el('button','Kembali');
  back.onclick = ()=> renderGarage();
  container.appendChild(el('br'));
  container.appendChild(back);
  root.appendChild(container);
}

function renderVinylEditor(){
  clearRoot();
  root.appendChild(renderHeader());
  const car = getCarById(state.currentCarId);
  if(!car){ alert('Tidak ada mobil dipilih'); renderGarage(); return; }
  const container = el('div');
  container.appendChild(el('h2','Vinyl Editor - ' + car.name));
  container.appendChild(el('div','Pixel-art sederhana (8x4). Klik kotak untuk toggle. Biaya simpan: $100'));
  const grid = el('div');
  const cols = 8, rows = 4;
  const pixels = [];
  for(let r=0;r<rows;r++){
    const row = el('div');
    for(let c=0;c<cols;c++){
      const cell = el('button');
      cell.textContent = ' ';
      cell.style.width='20px'; cell.style.height='20px'; cell.style.margin='1px';
      cell.dataset.on = '0';
      cell.onclick = ()=> {
        cell.dataset.on = cell.dataset.on==='0' ? '1' : '0';
        cell.style.background = cell.dataset.on==='1' ? '#000' : '#fff';
      };
      row.appendChild(cell);
      pixels.push(cell);
    }
    grid.appendChild(row);
  }
  container.appendChild(grid);
  const save = el('button','Simpan Vinyl ($100)');
  save.onclick = ()=>{
    const cost = 100;
    if(state.money < cost){ alert('Uang tidak cukup'); return; }
    state.money -= cost;
    // For simplicity we'll add a flag to car saying it has vinyl
    car.vinyl = pixels.map(p=>p.dataset.on).join('');
    saveState();
    alert('Vinyl disimpan.');
    renderGarage();
  };
  const back = el('button','Kembali');
  back.onclick = ()=> renderGarage();
  container.appendChild(save);
  container.appendChild(el('br'));
  container.appendChild(back);
  root.appendChild(container);
}

function renderFuelShop(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Bahan Bakar'));
  container.appendChild(el('div', `Fuel: ${state.fuel}/${state.maxFuel}`));
  const full = link('Beli Full Bahan Bakar ($50)', ()=>{
  const cost = 50;
  if(state.money < cost){ alert('Uang tidak cukup'); return; }
  state.money -= cost;
  state.fuel = state.maxFuel;
  saveState();
  alert('Bahan bakar penuh.');
  renderGarage();
});
container.appendChild(full);
container.appendChild(el('br'));

const back = link('Kembali', ()=> renderGarage());
container.appendChild(back);
  root.appendChild(container);
}

const bossBios = {
  'Andi': "<b>Bio:</b> Andi adalah pembalap jalanan muda.<br><b>Kepribadian:</b> Ambisius dan keras kepala.<br><b>Motivasi:</b> Ingin membuktikan dirinya di dunia balap.",
  'Tiara': "<b>Bio:</b> Tiara dikenal elegan namun mematikan.<br><b>Kepribadian:</b> Percaya diri.<br><b>Motivasi:</b> Membawa nama baik timnya ke puncak.",
  'Reza': "<b>Bio:</b> Reza si teknisi mesin.<br><b>Kepribadian:</b> Tenang, analitis.<br><b>Motivasi:</b> Menjadi legenda dengan mengandalkan strategi.",
  'Siska': "<b>Bio:</b> Siska penuh kejutan.<br><b>Kepribadian:</b> Karismatik tapi agresif.<br><b>Motivasi:</b> Membuktikan bahwa perempuan bisa jadi juara sejati.",
  'Black Cobra': "<b>Bio:</b> Bos final misterius.<br><b>Kepribadian:</b> Dinginnya seperti ular.<br><b>Motivasi:</b> Menguasai dunia balap jalanan."
};

// ---------- Rival ----------
function renderRivals(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Rival'));
  const bosses = [];
  state.chapters.forEach(ch=>{
    const boss = ch.enemies.find(e=>e.type==='boss');
    if(boss) bosses.push(boss);
  });
  bosses.forEach(b=>{
    if(state.defeatedBosses[b.id]){
      const row = el('div');
row.className = 'rival-row';
      row.appendChild(el('div', b.name));
      const img = el('img'); img.src = getAvatarImage(b.name, b.type); img.width=120;
      row.appendChild(img);
      const bioDiv = document.createElement('div');
bioDiv.innerHTML = bossBios[b.name] || "<b>Bio:</b><br><b>Kepribadian:</b><br><b>Motivasi:</b>";
row.appendChild(bioDiv);
      container.appendChild(row);
    }
  });
  const back = link('Kembali', ()=> renderMainMenu());
container.appendChild(el('br')); 
container.appendChild(back);
  root.appendChild(container);
}

// ---------- Profile ----------
function renderProfile(){
  clearRoot();
  root.appendChild(renderHeader());
  const container = el('div');
  container.appendChild(el('h2','Profile'));
  const img = el('img'); img.src = getAvatarImage(state.player.name, 'player');
  img.width=120;
  container.appendChild(img);
  container.appendChild(el('div', 'Nama: ' + state.player.name));
  container.appendChild(el('div', 'Wins: ' + state.player.wins));
  container.appendChild(el('div', 'Losses: ' + state.player.losses));
  const back = link('Kembali', ()=> renderMainMenu());
  container.appendChild(el('br'));
  container.appendChild(back);

  root.appendChild(container);
}


// ---------- Generic app render ----------
function renderApp(){
  // called often
  renderMainMenu();
}

// initialize and render
saveState();

// Also ensure if there's an active job that finishes while away, it is processed when app loads
function checkJobOnLoad(){
  if(state.currentJob){
    if(now() >= state.currentJob.endTime){
      state.money += state.currentJob.jobData.wage;
      alert('Pekerjaan selesai saat Anda kembali. Menerima $' + state.currentJob.jobData.wage);
      state.currentJob = null;
      saveState();
    }
  }
}
checkJobOnLoad();

// expose for debugging on console
window._dr_game_state = state;