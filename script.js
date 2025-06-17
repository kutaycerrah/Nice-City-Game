// YEREL KÜTÜPHANE YÜKLENDİ
import * as THREE from './three.module.js';
// FontLoader'ı doğru göreceli yoldan import et
// three.module.js ile aynı seviyede 'addons' klasörünün içinde olduğunu varsayarız.
import { FontLoader } from './addons/loaders/FontLoader.js'; 


// --- YARDIMCI FONKSİYON ---
function turkishToEnglish(text) {
    if (typeof text !== 'string') return text;
    const map = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };
    return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, m => map[m] || m);
}

// --- SABİTLER ---
const SPEECH_BUBBLE_INTERVAL = 15;
const ROAD_WIDTH = 20, SIDEWALK_WIDTH = 5, SEGMENT_LENGTH = 1000, SEGMENT_COUNT = 3, TOTAL_LENGTH = 3 * SEGMENT_LENGTH;
const POLICE_BOOST_DISABLE_DURATION = 20;
const POLICE_RAM_COOLDOWN = 10;
const STAR_EMPTY_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;
const STAR_FILLED_SVG = `<svg viewBox="0 0 24 24" fill="#FFC700" stroke="#FDB813" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;

const FALLBACK_MISSIONS = [
    "Polise yakalanmadan 2 dakika boyunca hayatta kal.", "Canin %50'nin altina dusmeden Sehir Merkezi'ne ulas.", "Sehirdeki 3 heykeli yok et.",
    "Trafikteki 5 araca carparak kaos yarat.", "Polis arabasini 3 baska araca carptirarak buyuk bir kaza yaptir.", "Okyanus Kenari yolunda 30 saniye boyunca son surat ilerle."
].map(turkishToEnglish);
const FALLBACK_CHATTER = [
    "Merkez, supheli Ocean Drive'da guneye dogru ilerliyor.", "Tum birimlere: Kirmizi spor araba takibe alindi, destek bekleniyor.", "Supheli Downtown bolgesinde goruldu, asiri hiz yapiyor.",
    "Dikkat, supheli tehlikeli manevralar yapiyor. Dikkatli yaklasin.", "Takip devam ediyor, supheli Starfish Adasi'na yoneldi."
].map(turkishToEnglish);

const BUILDING_TYPES = [ { type: 'shop', minFloors: 1, maxFloors: 2 }, { type: 'apartment', minFloors: 3, maxFloors: 8 }, { type: 'hotel', minFloors: 9, maxFloors: 15 } ];
const NEON_COLORS = [0xff00ff, 0x00ffff, 0x54fcfd, 0xf72119, 0x00ff7f, 0xff89f3];
const WINDOW_LIGHT_COLORS = [0xffffee, 0xffd8b1, 0xcce4ff];
const TRAFFIC_CAR_COLORS = [0xAAAAAA, 0xDDDDDD, 0x333333, 0x800000, 0x003300, 0xC0C0C0, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFA500, 0x800080, 0x008080, 0xFF4500, 0xDA70D6, 0x4B0082, 0xADFF2F, 0x00FFFF];
const VICE_CITY_COLORS = [0x69d2e7, 0xa7dbd8, 0xe0e4cc, 0xf38630, 0xfa6900, 0xff4e50, 0xf9d423, 0xf8b195, 0xc06c84];
const dayCycleParameters = {
    NIGHT:     { background: new THREE.Color(0x1a2a4a), fog: new THREE.Color(0x3a4a6a), hemiSky: new THREE.Color(0xcceeff), hemiGround: new THREE.Color(0x556688), dirLight: new THREE.Color(0xffffff), dirIntensity: 0.6, fogNear: 500, fogFar: 2500 },
    MORNING:   { background: new THREE.Color(0xf7b267), fog: new THREE.Color(0xe5989b), hemiSky: new THREE.Color(0xf7b267), hemiGround: new THREE.Color(0xc06c84), dirLight: new THREE.Color(0xffaa00), dirIntensity: 0.8, fogNear: 450, fogFar: 2000 },
    PRE_NOON:  { background: new THREE.Color(0x87ceeb), fog: new THREE.Color(0xa0dae9), hemiSky: new THREE.Color(0xadd8e6), hemiGround: new THREE.Color(0xa9a9a9), dirLight: new THREE.Color(0xffffff), dirIntensity: 1.0, fogNear: 400, fogFar: 1600 },
    NOON:      { background: new THREE.Color(0x87ceeb), fog: new THREE.Color(0xa0dae9), hemiSky: new THREE.Color(0xffffff), hemiGround: new THREE.Color(0xcccccc), dirLight: new THREE.Color(0xffffff), dirIntensity: 1.2, fogNear: 350, fogFar: 1500 },
    AFTERNOON: { background: new THREE.Color(0xa0d8e9), fog: new THREE.Color(0xb0c7db), hemiSky: new THREE.Color(0xf5f5dc), hemiGround: new THREE.Color(0xb0c7db), dirLight: new THREE.Color(0xffdd88), dirIntensity: 0.9, fogNear: 400, fogFar: 1800 },
    EVENING:   { background: new THREE.Color(0xff4e50), fog: new THREE.Color(0xff8c42), hemiSky: new THREE.Color(0xff6f61), hemiGround: new THREE.Color(0x6b5b95), dirLight: new THREE.Color(0xff6600), dirIntensity: 0.7, fogNear: 480, fogFar: 2200 }
};
const dayCyclePhases = ['NIGHT', 'MORNING', 'PRE_NOON', 'NOON', 'AFTERNOON', 'EVENING'];
const dayCycleTime = 120; const phaseDuration = dayCycleTime / dayCyclePhases.length; let currentCycleTime = 0;

// --- SES SABİTLERİ ---
const MENU_VOLUME = 0.6; const RADIO_VOL_MAX = 0.6; const RADIO_VOL_MIN = 0.3;
const ENGINE_VOL_MAX = 0.4; const ENGINE_VOL_MIN = 0.1; const SIREN_VOLUME = 0.5;

// --- GLOBAL DEĞİŞKENLER ---
let scene, camera, renderer, clock;
let player, policeCar = null, sirenLightRed, sirenLightBlue, road;
let sounds;
let roadLines = [], buildings = [], palmTrees = [], guardRails = [], trafficCars = [], streetLights = [], statues = [], debrisParticles = [], rain, bulletSparks = [];
let trafficCarPool = [];
const MAX_DEBRIS_PARTICLES = 100;
const MAX_BULLET_SPARKS = 50;
let hemiLight, dirLight;
let speed = 0, score = 0, wantedLevel = 0, playerHealth = 100, trafficDifficultyLevel = 0;
let isGameOver = false, canBeCaught = false, isRaining = false, isRadioPlaying = false;
let isAccelerating = false, isBraking = false, isTurningLeft = false, isTurningRight = false;
let lastPoliceShotTime = 0, wantedLevelCooldown = 0, lastPoliceHitTime = 0, isCrashSoundPlaying = false;
let beach, ocean, sidewalkLeft, sidewalkRight, buildingGround;
let pedestrians = [];
const PEDESTRIAN_SKIN_COLORS = ['#f2d5b1', '#c68642', '#8d5524', '#f5cba7', '#a16e4b'];
const PEDESTRIAN_SHIRT_COLORS = [0x69d2e7, 0xa7dbd8, 0xf38630, 0xfa6900, 0xff4e50, 0xf9d423, 0xf8b195, 0xc06c84, 0xffffff, 0x333333];
const PEDESTRIAN_PANTS_COLORS = [0x004d80, 0x333333, 'beige', 0x654321, 0x444444];
let flyingDebris = [];
let parkedCars = [], beachDetails = [], cityDecorations = [];
let cityWall;
let horizonHill;
let niceCitySign;

// --- SİNEMATİK DEĞİŞKENLERİ ---
let isIntroPlaying = true;
let cinematicCameraTarget;
let isRampJumpingCinematic = false;
let rampJumpCinematicTimer = 0;
let cinematicRampCameraPos = new THREE.Vector3();

// --- GÖREV SİSTEMİ DEĞİŞKENLERİ ---
let missionState = { status: 'inactive', cinematicTimer: 0, julieChatterTimer: 0, cinematicTarget: null };
let julieNPC;
let hotelSign;
let subtitleTimeout = null;

const BOOST_CHARGE_TIME = 20, BOOST_DURATION = 3.5, BOOST_SPEED_MULTIPLIER = 1.6;
let cleanDrivingTime = 0, isBoostAvailable = false, isBoosting = false, boostTimeRemaining = 0, lastAccelTapTime = 0, policeDisableTimer = 0;
let hasPlayerMoved = false, policeSpawnTimer = -1, areHazardLightsOn = false, gameTime = 0;
let nextChatterTime = 20, nextMissionPromptTime = 30, nextSpeechBubbleTime = 0; 
const CHATTER_INTERVAL = 25, MISSION_PROMPT_INTERVAL = 45;
let missionHideTimeout = null, lastKeyUpTime = 0;
const policePhrases = ["Dur! Saga cek!", "Kacabilecegini mi sandin?", "Bu is burada bitti!", "Teslim ol!", "Daha fazla zorluk cikarma!"].map(turkishToEnglish);
const playerPhrases = ["Haha, cok beklersin!", "Sikiysa yakala!", "Tozumu yut bakalim!", "Beni asla yakalayamazsiniz!", "Bu sehir benim!"].map(turkishToEnglish);
const julieScaredPhrases = ["Cok hizlisin!", "Dikkat et!", "Polisler pesimizde!", "Korkmaya basliyorum!", "Bizi yakalayacaklar!"].map(turkishToEnglish);


async function callGemini(prompt) {
    const isMissionPrompt = prompt.includes("görev hedefi oluştur");
    // API anahtarınızın güvenliği için bu kısmı sunucu tarafında yönetmek en doğrusudur.
    // Şimdilik boş bırakıyoruz, oyun yedek metinlerle çalışacaktır.
    const apiKey = ""; 
    if (!apiKey) {
        console.warn("Gemini API anahtarı ayarlanmamış. Yedek metinler kullanılacak.");
        return isMissionPrompt
            ? FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)]
            : FALLBACK_CHATTER[Math.floor(Math.random() * FALLBACK_CHATTER.length)];
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!response.ok) { throw new Error(`API call failed with status: ${response.status}`); }
        const result = await response.json();
        if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
            return result.candidates[0].content.parts[0].text.trim();
        } else { throw new Error("API yanıtında geçerli bir aday bulunamadı."); }
    } catch (error) {
        console.error("Gemini API çağrı hatası:", error.message);
        return isMissionPrompt
            ? FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)]
            : FALLBACK_CHATTER[Math.floor(Math.random() * FALLBACK_CHATTER.length)];
    }
}

function displayError(e) {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
        errorDisplay.style.display = 'block';
        errorDisplay.innerHTML = `<h1>OYUN HATASI!</h1><p>Uzgunuz, oyunda beklenmedik bir hata olustu.</p><p><strong>Hata Adi:</strong> ${e.name}</p><p><strong>Mesaj:</strong> ${e.message}</p><hr><p><strong>Teknik Detay (Stack Trace):</strong></p><pre>${e.stack}</pre>`;
    }
}

function loadSounds() {
    sounds = {
        // YEREL SES DOSYASI YOLLARI
        engine: new Howl({ src: ['sounds/engine_sound.ogg'], loop: true, volume: ENGINE_VOL_MIN, html5: true }),
        // crash.ogg dosyası hata verdiği için devre dışı bırakıldı. Eğer dosya varsa ve kullanmak isterseniz bu satırı etkinleştirin:
        // crash: new Howl({ src: ['sounds/crash.ogg'], volume: 0.5 }), 
        // spell_heal.ogg dosyası hata verdiği için devre dışı bırakıldı. Eğer dosya varsa ve kullanmak isterseniz bu satırı etkinleştirin:
        // heal_sound: new Howl({ src: ['sounds/spell_heal.ogg'], volume: 0.7 }),
        siren: new Howl({ src: ['sounds/police_sound.mp3'], loop: true, volume: SIREN_VOLUME }), 
        radio: new Howl({ src: ['sounds/Vice City Geceleri.mp3'], loop: true, volume: MENU_VOLUME, html5: true })
    }
    // howler.min.js:2 HTML5 Audio pool exhausted hatası için:
    // Bu, tarayıcının aynı anda çok fazla ses çalmaya çalıştığını veya ses kaynaklarının yetersiz olduğunu gösterebilir.
    // Sesleri sadece ihtiyaç duyulduğunda çalmaya ve işi bitince durdurmaya özen gösterin.
    // howler.js'in en son versiyonunu kullandığınızdan emin olun.
}


function loadAssets() {
    // Bu fonksiyon, oyun başlatma sürecinin görsel ilerlemesini göstermek için kullanılabilir.
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5; // Daha hızlı ilerlemesi için
        if(progress > 100) progress = 100;
        loadingBar.style.width = progress + '%';
        loadingPercentage.innerText = Math.round(progress) + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loading-screen').style.opacity = '0';
                const nameEntryScreen = document.getElementById('name-entry-screen');
                nameEntryScreen.style.display = 'flex';
                setTimeout(() => nameEntryScreen.classList.add('visible'), 50);
                nameEntryScreen.addEventListener('transitionend', () => {
                    document.getElementById('loading-screen').style.display = 'none';
                }, { once: true });
            }, 500);
        }
    }, 50);
}

function setupGameStart() {
    const startGameButton = document.getElementById('start-game-button');
    const nameEntryScreen = document.getElementById('name-entry-screen');
    const playerNameInput = document.getElementById('player-name-input');
    playerNameInput.addEventListener('focus', () => {
        if (!isRadioPlaying && sounds?.radio) {
            sounds.radio.play(); isRadioPlaying = true;
        }
    }, { once: true });
    startGameButton.addEventListener('click', () => {
        if (isRadioPlaying && sounds?.radio) {
            sounds.radio.fade(MENU_VOLUME, RADIO_VOL_MAX, 1000);
        }
        nameEntryScreen.classList.remove('visible');
        setTimeout(() => {
            nameEntryScreen.style.display = 'none';
            initializeGame(); // Oyun başlatma doğrudan çağrılıyor
        }, 1000);
    });
}

function onWindowResize() { 
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix(); 
    }
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function createWorld() { 
    createRoadAndSidewalks(); 
    createRoadLines(); 
    createStreetLights(); 
    createPlayer();
    createRain();
    createScenery(); 
}

// Oyuncu araba gövdesi için CanvasTexture oluşturma
function createPlayerCarBodyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#D40000'; // Kırmızı araba
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Beyaz şerit
    ctx.fillRect(108, 0, 40, 256);
    return new THREE.CanvasTexture(canvas);
}

// Oyuncu araba camları için CanvasTexture oluşturma
function createPlayerCarWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, '#333');
    gradient.addColorStop(1, '#666');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

function createPlayer() {
    player = new THREE.Group();

    // CanvasTexture ile oyuncu araba gövdesi dokusu
    const bodyTexture = createPlayerCarBodyTexture();
    const bodyMaterial = new THREE.MeshPhongMaterial({ map: bodyTexture, flatShading: true });
    
    // CanvasTexture ile pencere dokusu
    const windowTexture = createPlayerCarWindowTexture();
    const windowMaterial = new THREE.MeshPhongMaterial({ map: windowTexture, transparent: true, opacity: 0.8, flatShading: true });

    const secondaryMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, flatShading: true });
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.6, 6.0), bodyMaterial);
    mainBody.position.y = 0.6; mainBody.castShadow = true; player.add(mainBody);
    const frontHood = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 2.0), bodyMaterial);
    frontHood.position.set(0, 0.7, -3.0); player.add(frontHood);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.5), bodyMaterial);
    cabin.position.set(0, 1.0, 0.5); player.add(cabin);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.1), windowMaterial);
    windshield.position.set(0, 1.2, -0.7); player.add(windshield);
    const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.1), windowMaterial);
    rearWindow.position.set(0, 1.2, 1.7); player.add(rearWindow);
    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 2.0), bodyMaterial);
    rearDeck.position.set(0, 0.7, 3.0); player.add(rearDeck);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.6), secondaryMaterial);
    spoiler.position.set(0, 1.0, 4.2); player.add(spoiler);
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 0.2), secondaryMaterial);
    diffuser.position.set(0, 0.2, 3.0); player.add(diffuser);

    const headlight1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), lightMaterial);
    headlight1.position.set(-1.2, 0.6, -3.01); 
    const headlight2 = headlight1.clone(); 
    headlight2.position.x = 1.2; 
    player.add(headlight1, headlight2);

    const taillight1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.1), taillightMaterial);
    taillight1.position.set(-0.6, 0.6, 4.01); 
    const taillight2 = taillight1.clone(); 
    taillight2.position.x = 0.6; 
    player.add(taillight1, taillight2);

    const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const createWheel = () => { const w = new THREE.Mesh(wheelGeom, wheelMaterial); w.rotation.z = Math.PI / 2; return w; };
    const wFL = createWheel(); wFL.position.set(-1.6, 0.5, -2.0);
    const wFR = createWheel(); wFR.position.set(1.6, 0.5, -2.0);
    const wBL = createWheel(); wBL.position.set(-1.6, 0.5, 2.0);
    const wBR = createWheel(); wBR.position.set(1.6, 0.5, 2.0);
    player.add(wFL, wFR, wBL, wBR);
    
    player.position.set(ROAD_WIDTH / 2 - 2, 0, 5); 
    player.rotation.y = -Math.PI / 16; 

    player.userData.lights = {headlight1, headlight2, taillight1, taillight2};
    player.userData.isJumping = false;
    player.userData.verticalVelocity = 0;
    scene.add(player);
}

// Polis araba gövdesi için CanvasTexture oluşturma
function createPoliceCarBodyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#004d26'; // Yeşil polis arabası
    ctx.fillRect(0, 0, 128, 256);
    
    ctx.fillStyle = '#ffffff'; // Beyaz şerit
    ctx.fillRect(0, 50, 128, 80);

    ctx.font = "bold 30px Arial";
    ctx.fillStyle = '#004d26';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("POLICE", 64, 90);

    ctx.fillStyle = '#111111'; // Alt kısım
    ctx.fillRect(10, 140, 108, 50); 
    
    return new THREE.CanvasTexture(canvas);
}

function createPoliceCar() {
    if (policeCar) return;
    policeCar = new THREE.Group();

    // CanvasTexture ile polis araba gövdesi dokusu
    const policeTexture = createPoliceCarBodyTexture();
    const bodyMaterial = new THREE.MeshPhongMaterial({ map: policeTexture, flatShading: true });
    
    const blackTrimMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, transparent: true, opacity: 0.7 });
    // OPTİMİZASYON: emissive ve emissiveIntensity kaldırıldı
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xbb0000 });
    
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 5.4), bodyMaterial);
    mainBody.position.y = 0.7; policeCar.add(mainBody);
    
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.6, 2.5), bodyMaterial);
    cabin.position.set(0, 1.3, -0.3); policeCar.add(cabin);

    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.65), windowMaterial);
    windshield.position.set(0, 1.3, -1.55); windshield.rotation.x = -Math.PI / 8; policeCar.add(windshield);
    
    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.65), windowMaterial);
    rearWindow.position.set(0, 1.3, 0.95); rearWindow.rotation.x = Math.PI / 9; policeCar.add(rearWindow);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.0), bodyMaterial);
    hood.position.set(0, 0.65, -2.2); policeCar.add(hood);
    
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1.5), bodyMaterial);
    trunk.position.set(0, 0.6, 2.0); policeCar.add(trunk);
    
    const taillightGeo = new THREE.BoxGeometry(1.2, 0.35, 0.1);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMaterial);
    leftTaillight.position.set(-0.65, 0.7, 2.75); policeCar.add(leftTaillight);
    
    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMaterial);
    rightTaillight.position.set(0.65, 0.7, 2.75); policeCar.add(rightTaillight);
    
    const sirenBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.5), blackTrimMaterial);
    sirenBase.position.set(0, 1.6, -0.3); policeCar.add(sirenBase);
    const sirenLightGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    // emissiveIntensity updateDayCycle'da kontrol ediliyor
    sirenLightRed = new THREE.Mesh(sirenLightGeo, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    sirenLightRed.position.set(-0.3, 1.7, -0.3); policeCar.add(sirenLightRed);
    sirenLightBlue = new THREE.Mesh(sirenLightGeo, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    sirenLightBlue.position.set(0.3, 1.7, -0.3); policeCar.add(sirenLightBlue);
    
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const createWheel = () => { 
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); 
        wheel.rotation.z = Math.PI / 2; return w; };
    const wFL = createWheel(); wFL.position.set(-1.3, 0.4, -1.6); 
    const wFR = createWheel(); wFR.position.set(1.3, 0.4, -1.6);
    const wBL = createWheel(); wBL.position.set(-1.3, 0.4, 1.8); 
    const wBR = createWheel(); wBR.position.set(1.3, 0.4, 1.8); 
    policeCar.add(wFL, wFR, wBL, wBR);

    // OPTİMİZASYON: emissive ve emissiveIntensity kaldırıldı
    const policeHeadlight1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xFFFF88 }));
    policeHeadlight1.position.set(-1.0, 0.7, -2.51); 
    const policeHeadlight2 = policeHeadlight1.clone(); 
    policeHeadlight2.position.x = 1.0; 
    policeCar.add(policeHeadlight1, policeHeadlight2);

    policeCar.position.set(player.position.x, 0, player.position.z + 50); policeCar.rotation.y = Math.PI; policeCar.userData.health = 100;
    policeCar.userData.aiState = 'following';
    policeCar.userData.aiTimer = Math.random() * 3 + 4;
    policeCar.userData.lights = { headlight1: policeHeadlight1, headlight2: policeHeadlight2, taillight1: leftTaillight, taillight2: rightTaillight };
    scene.add(policeCar);
}

function createPedestrianTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = config.skinColor;
    ctx.fillRect(22, 0, 20, 20);
    ctx.fillRect(12, 20, 40, 50);
    ctx.fillRect(12, 70, 18, 58);
    ctx.fillRect(34, 70, 18, 58);

    ctx.fillStyle = '#222';
    ctx.fillRect(22, 0, 20, 8);

    ctx.fillStyle = new THREE.Color(config.shirtColor).getStyle();
    ctx.fillRect(12, 22, 40, 35);

    ctx.fillStyle = new THREE.Color(config.pantsColor).getStyle();
    ctx.fillRect(12, 70, 40, 40);

    return new THREE.CanvasTexture(canvas);
}

function createPedestrian(isJulie = false) {
    const config = {
        skinColor: isJulie ? '#f5cba7' : PEDESTRIAN_SKIN_COLORS[Math.floor(Math.random() * PEDESTRIAN_SKIN_COLORS.length)],
        shirtColor: isJulie ? 0xf721d4 : PEDESTRIAN_SHIRT_COLORS[Math.floor(Math.random() * PEDESTRIAN_SHIRT_COLORS.length)],
        pantsColor: isJulie ? 0x111111 : PEDESTRIAN_PANTS_COLORS[Math.floor(Math.random() * PEDESTRIAN_PANTS_COLORS.length)]
    };

    const texture = createPedestrianTexture(config);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(1.2, 2.4);
    const pedestrian = new THREE.Mesh(geometry, material);
    pedestrian.position.y = 1.2;
    pedestrian.userData.isJulie = isJulie;
    pedestrian.userData.isStaticObject = true; 
    return pedestrian;
}

function createFlyingDebris() {
    const debrisMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const debrisGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);

    debris.userData.velocity = new THREE.Vector3( (Math.random() - 0.5) * 0.1, Math.random() * 0.05 + 0.02, (Math.random() - 0.5) * 0.1 );
    debris.userData.rotationSpeed = new THREE.Vector3( (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1 );
    return debris;
}

// CanvasTexture ile bina dokusu (içsel olarak oluşturulur)
function createBuildingTexture(width, height, floors) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 128 * (height / width);
    const ctx = canvas.getContext('2d');

    const wallColors = ['#4a4a4a', '#5f5f5f', '#3d3d3d', '#6b5b95'];
    ctx.fillStyle = wallColors[Math.floor(Math.random() * wallColors.length)];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const windowWidth = 10;
    const windowHeight = 15;
    const horizontalSpacing = 15;
    const verticalSpacing = 25;
    const numCols = Math.floor(canvas.width / horizontalSpacing) - 1;

    for (let f = 0; f < floors * 2; f++) {
        for (let i = 0; i < numCols; i++) {
            const x = (i * horizontalSpacing) + 10;
            const y = (f * verticalSpacing) + 15;

            if (Math.random() > 0.4) {
                const isNight = ['NIGHT', 'EVENING'].includes(dayCyclePhases[Math.floor(currentCycleTime / phaseDuration)]);
                ctx.fillStyle = isNight && Math.random() > 0.5 ? '#ffff88' : '#222244';
            } else {
                ctx.fillStyle = '#222244';
            }
            ctx.fillRect(x, y, windowWidth, windowHeight);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// CanvasTexture ile park edilmiş araba dokusu
function createParkedCarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const carColor = TRAFFIC_CAR_COLORS[Math.floor(Math.random() * TRAFFIC_CAR_COLORS.length)];
    ctx.fillStyle = new THREE.Color(carColor).getStyle();
    
    ctx.beginPath();
    ctx.moveTo(5, 50);
    ctx.lineTo(123, 50);
    ctx.lineTo(110, 30);
    ctx.lineTo(20, 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#55aaff';
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(90, 30);
    ctx.lineTo(80, 15);
    ctx.lineTo(40, 15);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function createCityDecoration(type, text = "MALIBU CLUB") {
    const canvas = document.createElement('canvas');
    const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
    let geometry;

    if (type === 'nightclub' || type === 'hotel') {
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        // 'Bebas Neue' fontu sistemde yüklü değilse varsayılan fonta düşer.
        // Bu yüzden, daha evrensel bir font kullanmak daha iyi olabilir veya fontu CSS ile import etmek.
        // Şimdilik 'sans-serif' kullanılıyor.
        ctx.font = `bold ${type === 'hotel' ? '40px' : '48px'} sans-serif`; 
        ctx.fillStyle = type === 'hotel' ? '#00ffff' : '#ff00ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 20;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        geometry = new THREE.PlaneGeometry(12, 6);
    }
    
    material.map = new THREE.CanvasTexture(canvas);
    const decoration = new THREE.Mesh(geometry, material);
    decoration.position.y = 10;
    decoration.userData.isStaticObject = true; 
    return decoration;
}

function createBeachDetail(type) {
    const canvas = document.createElement('canvas');
    const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
    let geometry;

    if (type === 'towel') {
        canvas.width = 64; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = VICE_CITY_COLORS[Math.floor(Math.random() * VICE_CITY_COLORS.length)];
        ctx.fillRect(0,0,64,128);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(0,10,64,10);
        ctx.fillRect(0,108,64,10);
        geometry = new THREE.PlaneGeometry(2, 4);
    }
    
    material.map = new THREE.CanvasTexture(canvas);
    const detail = new THREE.Mesh(geometry, material);
    detail.rotation.x = -Math.PI / 2;
    detail.userData.isStaticObject = true; 
    return detail;
}

function createAmbulance() {
    const ambulance = new THREE.Group();
    ambulance.userData.type = 'ambulance'; 
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, flatShading: true });
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, flatShading: true });
    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, transparent: true, opacity: 0.8, flatShading: true });
    // OPTİMİZASYON: emissive ve emissiveIntensity kaldırıldı
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 6.5), bodyMaterial);
    mainBody.position.y = 1.6 / 2 + 0.1;
    ambulance.add(mainBody);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 2.0), bodyMaterial);
    cab.position.set(0, 1.6 + 1.4 / 2 - 0.2, -2.25);
    ambulance.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.1), windowMaterial);
    windshield.position.set(0, 1.6 + 1.4 - 0.2, -3.2);
    ambulance.add(windshield);

    const sideStripeGeo = new THREE.BoxGeometry(0.1, 0.4, 5.0);
    const leftStripe = new THREE.Mesh(sideStripeGeo, stripeMaterial);
    leftStripe.position.set(-1.41, 1.0, 0); 
    ambulance.add(leftStripe);
    const rightStripe = leftStripe.clone();
    rightStripe.position.x = 1.41; 
    ambulance.add(rightStripe);

    const roofLightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.5);
    // emissiveIntensity updateDayCycle'da kontrol ediliyor
    const roofLightMaterialBlue = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const roofLightMaterialRed = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const roofLight1 = new THREE.Mesh(roofLightGeo, roofLightMaterialBlue);
    roofLight1.position.set(-0.4, 1.6 + 1.6 - 0.1, 0);
    ambulance.add(roofLight1);
    const roofLight2 = new THREE.Mesh(roofLightGeo, roofLightMaterialRed);
    roofLight2.position.set(0.4, 1.6 + 1.6 - 0.1, 0);
    ambulance.add(roofLight2);
    
    const headlight1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), headlightMaterial);
    headlight1.position.set(-1.0, 1.2, -3.21); 
    const headlight2 = headlight1.clone(); 
    headlight2.position.x = 1.0; 
    ambulance.add(headlight1, headlight2);

    const taillight1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.1), taillightMaterial);
    taillight1.position.set(-0.6, 1.2, 3.21); 
    const taillight2 = taillight1.clone(); 
    taillight2.position.x = 0.6; 
    ambulance.add(taillight1, taillight2);

    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const createWheel = () => { 
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); 
        wheel.rotation.z = Math.PI / 2; return w; };
    const wFL = createWheel(); wFL.position.set(-1.4, 0.5, -2.0);
    const wFR = createWheel(); wFR.position.set(1.4, 0.5, -2.0);
    const wBL = createWheel(); wBL.position.set(-1.4, 0.5, 2.0);
    const wBR = createWheel(); wBR.position.set(1.4, 0.5, 2.0);
    ambulance.add(wFL, wFR, wBL, wBR);

    ambulance.userData.speed = 1.0 + Math.random() * 0.2; 
    ambulance.userData.healedPlayer = false; 
    ambulance.userData.lights = { headlight1, headlight2, taillight1, taillight2, roofLight1, roofLight2 };
    return ambulance;
}

function updatePlayerMovement() {
    if (isIntroPlaying || isRampJumpingCinematic || missionState.status.includes('Cinematic')) return;

    const topSpeed = 5.5;
    if (isBoosting) {
        const boostTargetSpeed = topSpeed * BOOST_SPEED_MULTIPLIER;
        speed = Math.min(boostTargetSpeed, speed + 0.25);
    } else {
        if(isAccelerating) { speed = Math.min(topSpeed, speed + 0.11); }
        else if(isBraking) { speed = Math.max(0, speed - 0.1); } 
        else { speed *= 0.99; }
    }
    if (!hasPlayerMoved && speed > 0.1) {
        hasPlayerMoved = true;
        areHazardLightsOn = false;
        if (missionState.status === 'inactive') {
            policeSpawnTimer = 10;
        }
    }
    const turnSpeed = speed > 0.5 ? 0.35 : 0;
    const limitLeft = -ROAD_WIDTH / 2 - SIDEWALK_WIDTH + 1.7;
    const limitRight = ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 1.7;
    if(isTurningLeft) player.position.x = Math.max(limitLeft, player.position.x - turnSpeed);
    if(isTurningRight) player.position.x = Math.min(limitRight, player.position.x + turnSpeed);
    
    let targetTilt = 0;
    if (isTurningLeft) targetTilt = 0.1;
    else if (isTurningRight) targetTilt = -0.1;
    player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, targetTilt, 0.08);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, 0, 0.05);
}

function startGame() { 
    wantedLevel = 1; updateStarsUI(); lastPoliceShotTime = 0; lastPoliceHitTime = 0; canBeCaught = true; 
    if(sounds.siren && !sounds.siren.playing()) sounds.siren.play();
    setTimeout(() => { showSpeechBubble('police', 'Dur! Sağa çek!'); }, 1500);
    setTimeout(() => { showSpeechBubble('player', 'Haha, çok beklersin!'); }, 3000);
    nextSpeechBubbleTime = clock.getElapsedTime() + SPEECH_BUBBLE_INTERVAL;
}

function createRoadLines() { 
    // Road çizgileri için basit bir renk materyali veya kanvas doku
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const lineGeometry = new THREE.PlaneGeometry(0.5, SEGMENT_LENGTH);
    const laneOffset = ROAD_WIDTH / 6;

    for (let i = 0; i < SEGMENT_COUNT; i++) {
        const segmentZ = i * SEGMENT_LENGTH - TOTAL_LENGTH / 2 + SEGMENT_LENGTH / 2;

        const lineLeft = new THREE.Mesh(lineGeometry, lineMaterial);
        lineLeft.rotation.x = -Math.PI / 2;
        lineLeft.position.set(-laneOffset, 0.02, segmentZ);
        roadLines.push(lineLeft);
        road.add(lineLeft);

        const lineRight = new THREE.Mesh(lineGeometry, lineMaterial);
        lineRight.rotation.x = -Math.PI / 2;
        lineRight.position.set(laneOffset, 0.02, segmentZ);
        roadLines.push(lineRight);
        road.add(lineRight);
    }
}

function createBuilding(x, z) {
    const bD = BUILDING_TYPES[Math.floor(Math.random() * BUILDING_TYPES.length)];
    const nF = bD.minFloors + Math.floor(Math.random() * (bD.maxFloors - bD.minFloors + 1));
    const bH = nF * 5; const bW = 15 + Math.random() * 5; const bDe = 15 + Math.random() * 5;
    
    // CanvasTexture ile bina dokusu (içsel olarak oluşturulur)
    const buildingTexture = createBuildingTexture(bW, bH, nF);
    buildingTexture.wrapS = THREE.RepeatWrapping;
    buildingTexture.wrapT = THREE.RepeatWrapping;
    buildingTexture.repeat.set(1, 1); // CanvasTexture için repeat doğrudan piksel bazında olabilir

    const bG = new THREE.BoxGeometry(bW, bH, bDe);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        map: buildingTexture,
        flatShading: true 
    });

    const bMe = new THREE.Mesh(bG, buildingMaterial); bMe.castShadow = true; bMe.receiveShadow = true;
    const bGr = new THREE.Group(); bGr.add(bMe);
    bGr.userData.isStaticObject = true; // Dünya ile birlikte kayması için
    if (Math.random() < 0.3) {
        const neonWidth = bW * (0.5 + Math.random() * 0.3); const neonHeight = bH * (0.05 + Math.random() * 0.1); const neonColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
        const nG = new THREE.BoxGeometry(neonWidth, neonHeight, 0.5); 
        // OPTİMİZASYON: emissive ve emissiveIntensity kaldırıldı
        const nM = new THREE.MeshBasicMaterial({ color: neonColor });
        const n = new THREE.Mesh(nG, nM); n.position.set(0, Math.random() * (bH/2) - (bH/4), bDe/2 + 0.25); bGr.add(n);
        const pL = new THREE.PointLight(neonColor, 2, 40); pL.position.copy(n.position); bGr.add(pL);
    }
    
    bGr.position.set(x, bH / 2, z); buildings.push(bGr); scene.add(bGr);
}

function createRoadAndSidewalks() { 
    road = new THREE.Group();
    // Yol için temel renk veya basit bir çizgi deseni oluşturan CanvasTexture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 128; roadCanvas.height = 128;
    const roadCtx = roadCanvas.getContext('2d');
    roadCtx.fillStyle = '#808080'; // Gri yol
    roadCtx.fillRect(0,0,128,128);
    roadCtx.strokeStyle = '#606060'; // Hafif doku için çizgiler
    roadCtx.lineWidth = 2;
    for(let i=0; i<128; i+=16) { roadCtx.beginPath(); roadCtx.moveTo(i,0); roadCtx.lineTo(i,128); roadCtx.stroke(); }
    const roadTexture = new THREE.CanvasTexture(roadCanvas);
    roadTexture.wrapS = THREE.RepeatWrapping; roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, SEGMENT_LENGTH / 10); 
    const roadMaterial = new THREE.MeshPhongMaterial({ map: roadTexture, shininess: 20 }); 

    for (let i = 0; i < SEGMENT_COUNT; i++) {
        const segment = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH), roadMaterial);
        segment.rotation.x = -Math.PI / 2; segment.position.z = i * SEGMENT_LENGTH - TOTAL_LENGTH / 2;
        segment.receiveShadow = true; road.add(segment);
    }
    scene.add(road);
}

function createScenery(){ 
    sidewalkLeft = new THREE.Group(); sidewalkRight = new THREE.Group(); beach = new THREE.Group(); 
    ocean = new THREE.Group(); buildingGround = new THREE.Group();
    
    // Kaldırım için basit renk
    const sidewalkMaterial = new THREE.MeshPhongMaterial({color:0xd2b48c}); // Bej

    // Plaj için basit renk
    const beachMaterial = new THREE.MeshPhongMaterial({color:0xf2d16b}); // Kum rengi

    // Deniz için basit renk ve şeffaflık
    const oceanMaterial = new THREE.MeshPhongMaterial({color:0x0066cc, transparent:true, opacity:0.8});
    
    // Bina zemini için temel renk
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 }); 

    for(let i = 0; i < SEGMENT_COUNT; i++){
        const zPosition = i * SEGMENT_LENGTH - TOTAL_LENGTH / 2;
        const sidewalkL = new THREE.Mesh(new THREE.PlaneGeometry(SIDEWALK_WIDTH, SEGMENT_LENGTH), sidewalkMaterial);
        sidewalkL.rotation.x = -Math.PI / 2; sidewalkL.position.set(-ROAD_WIDTH/2 - SIDEWALK_WIDTH/2, 0.1, zPosition); sidewalkL.receiveShadow = true; sidewalkLeft.add(sidewalkL);
        const sidewalkR = new THREE.Mesh(new THREE.PlaneGeometry(SIDEWALK_WIDTH, SEGMENT_LENGTH), sidewalkMaterial);
        sidewalkR.rotation.x = -Math.PI / 2; sidewalkR.position.set(ROAD_WIDTH/2 + SIDEWALK_WIDTH/2, 0.1, zPosition); sidewalkR.receiveShadow = true; sidewalkRight.add(sidewalkR);
        const groundR = new THREE.Mesh(new THREE.PlaneGeometry(200, SEGMENT_LENGTH), groundMaterial);
        groundR.rotation.x = -Math.PI / 2; groundR.position.set(ROAD_WIDTH/2 + SIDEWALK_WIDTH + 100, 0.05, zPosition); groundR.receiveShadow = true; buildingGround.add(groundR);
        const beachSegment = new THREE.Mesh(new THREE.PlaneGeometry(100, SEGMENT_LENGTH), beachMaterial);
        beachSegment.rotation.x = -Math.PI / 2; beachSegment.position.set(-ROAD_WIDTH/2 - SIDEWALK_WIDTH - 50, 0, zPosition); beach.add(beachSegment);
        const oceanSegment = new THREE.Mesh(new THREE.PlaneGeometry(200, SEGMENT_LENGTH), oceanMaterial);
        oceanSegment.rotation.x = -Math.PI / 2; oceanSegment.position.set(-ROAD_WIDTH/2 - SIDEWALK_WIDTH - 150, -0.1, zPosition); ocean.add(oceanSegment);
    } 
    scene.add(sidewalkLeft, sidewalkRight, beach, ocean, buildingGround);

    // Yeni: Daha düzenli bina oluşturma
    const BUILDING_ROW_COUNT = 3; 
    const BUILDINGS_PER_ROW_SEGMENT = 5; 
    const BUILDING_ROW_SPACING_Z = SEGMENT_LENGTH / BUILDINGS_PER_ROW_SEGMENT; 
    const BUILDING_LANE_OFFSET_X = [ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 10, ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 30, ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 50]; 

    for (let r = 0; r < BUILDING_ROW_COUNT; r++) {
        const startX = BUILDING_LANE_OFFSET_X[r];
        for (let seg = 0; seg < SEGMENT_COUNT; seg++) { 
            for (let i = 0; i < BUILDINGS_PER_ROW_SEGMENT; i++) { 
                const zPos = (seg * SEGMENT_LENGTH) + (i * BUILDING_ROW_SPACING_Z) - (TOTAL_LENGTH / 2) + (BUILDING_ROW_SPACING_Z / 2);
                createBuilding(startX + (Math.random() - 0.5) * 5, zPos); 
            }
        }
    }


    for(let i = 0; i < 100; i++) createPalmTree(-ROAD_WIDTH / 2 - SIDEWALK_WIDTH - Math.random() * 95, Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2);
    for (let i = 0; i < 20; i++) {
        const statue = createStatue(); const side = Math.random() < 0.5 ? 1 : -1;
        const xPos = side * (ROAD_WIDTH / 2 + SIDEWALK_WIDTH * 0.5 + Math.random() - 0.5);
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        statue.position.set(xPos, 0.25, zPos); statues.push(statue); scene.add(statue);
    }

    for (let i = 0; i < 80; i++) {
        const pedestrian = createPedestrian();
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        if (Math.random() < 0.5) {
            const xPos = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 2 + Math.random() * 50;
            pedestrian.position.set(xPos, 1.2, zPos);
        } else {
            const xPos = -ROAD_WIDTH / 2 - SIDEWALK_WIDTH - Math.random() * 95;
            pedestrian.position.set(xPos, 1.2, zPos);
        }
        pedestrians.push(pedestrian);
        scene.add(pedestrian);
    }
    
    setupMission1Objects();

    for (let i = 0; i < 30; i++) {
        const debris = createFlyingDebris();
        const xPos = Math.random() * (ROAD_WIDTH + SIDEWALK_WIDTH * 2) - (ROAD_WIDTH / 2 + SIDEWALK_WIDTH);
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        debris.position.set(xPos, Math.random() * 5, zPos);
        flyingDebris.push(debris);
        scene.add(debris);
    }

    for (let i = 0; i < 15; i++) {
        // CanvasTexture ile park edilmiş araba dokusu
        const carTexture = createParkedCarTexture();
        const carMat = new THREE.MeshBasicMaterial({ map: carTexture, transparent: true });
        const carGeo = new THREE.PlaneGeometry(5, 2.5);
        const parkedCar = new THREE.Mesh(carGeo, carMat);
        parkedCar.userData.isStaticObject = true; 
        
        const xPos = ROAD_WIDTH / 2 + SIDEWALK_WIDTH * 0.7;
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        parkedCar.position.set(xPos, 1.2, zPos);
        parkedCar.rotation.y = -Math.PI / 2;
        parkedCars.push(parkedCar);
        scene.add(parkedCar);
    }

    for (let i = 0; i < 40; i++) {
        const towel = createBeachDetail('towel');
        towel.userData.isStaticObject = true; 
        const xPos = -ROAD_WIDTH / 2 - SIDEWALK_WIDTH - Math.random() * 90;
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        towel.position.set(xPos, 0.1, zPos);
        beachDetails.push(towel);
        scene.add(towel);
    }

    // YENİ: Şehir duvarı ve neon tabelalar
    createCityWall(); 
    // YENİ: Ufuk tepesi
    createHorizonHill();
    // YENİ: NICE CITY yazısı
    createNiceCitySign();
}

// YENİ FONKSİYON: Şehir duvarı
function createCityWall() {
    cityWall = new THREE.Group();
    cityWall.userData.isStaticObject = true; 
    // Duvarın temel materyali (basit renk)
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true }); 

    const WALL_SEGMENT_WIDTH = 20; 
    const WALL_SEGMENT_COUNT_PER_SEGMENT = SEGMENT_LENGTH / WALL_SEGMENT_WIDTH; 
    const WALL_OFFSET_X = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 80; 

    for (let seg = 0; seg < SEGMENT_COUNT; seg++) { 
        for (let i = 0; i < WALL_SEGMENT_COUNT_PER_SEGMENT; i++) { 
            const minWallHeight = 30; 
            const maxWallHeight = 70; 
            const wallHeight = minWallHeight + Math.random() * (maxWallHeight - minWallHeight);

            const wallGeometry = new THREE.BoxGeometry(WALL_SEGMENT_WIDTH, wallHeight, 2); 
            
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.set(WALL_OFFSET_X, wallHeight / 2, (seg * SEGMENT_LENGTH) + (i * WALL_SEGMENT_WIDTH) - (TOTAL_LENGTH / 2));
            wallMesh.receiveShadow = true;
            wallMesh.castShadow = true;
            cityWall.add(wallMesh);

            // VICE CITY TEMALI 2D DOKU VE NEON IŞIKLAR (CanvasTexture ile)
            if (Math.random() < 0.6) { 
                const signType = Math.random() < 0.5 ? 'nightclub' : 'hotel'; 
                const neonSign = createCityDecoration(signType, signType.toUpperCase() + ' ' + Math.floor(Math.random()*100)); 
                
                neonSign.position.set(
                    WALL_OFFSET_X + 1, 
                    wallHeight * (0.5 + Math.random() * 0.4), 
                    wallMesh.position.z + (Math.random() - 0.5) * (WALL_SEGMENT_WIDTH * 0.8) 
                );
                neonSign.rotation.y = -Math.PI / 2; 
                cityWall.add(neonSign);

                const neonColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
                const neonLight = new THREE.PointLight(neonColor, 3, 50); 
                neonLight.position.copy(neonSign.position);
                neonLight.position.x += 2; 
                cityWall.add(neonLight);
            }
        }
    }
    scene.add(cityWall);
}

// YENİ FONKSİYON: Ufuk tepesi
function createHorizonHill() {
    const hillWidth = ROAD_WIDTH * 2;
    const hillHeight = 150;
    const hillLength = 200; 
    const hillGeometry = new THREE.CylinderGeometry(hillWidth / 2, hillWidth * 1.5, hillHeight, 32, 1, false); 
    const hillMaterial = new THREE.MeshPhongMaterial({ color: 0x556B2F }); // Koyu yeşil renk
    horizonHill = new THREE.Mesh(hillGeometry, hillMaterial);
    horizonHill.position.set(0, -1 + hillHeight / 2, TOTAL_LENGTH * 0.4); 
    horizonHill.rotation.x = -Math.PI / 2; 
    horizonHill.receiveShadow = true;
    horizonHill.castShadow = true;
    scene.add(horizonHill);
}

// YENİ FONKSİYON: NICE CITY tabelası
function createNiceCitySign() {
    niceCitySign = new THREE.Group();
    const textColor = 0xFFFFFF;
    const letterHeight = 20;
    const letterSpacing = 5;
    const text = "NICE CITY";
    let currentX = 0;

    // Font yükleyiciyi kullan
    const fontLoader = new FontLoader(); 
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        for (let i = 0; i < text.length; i++) {
            const letter = text.charAt(i);
            const textGeometry = new THREE.TextGeometry(letter, {
                font: font,
                size: letterHeight,
                height: 2,
                curveSegments: 4,
                bevelEnabled: false,
            });
            const textMaterial = new THREE.MeshPhongMaterial({ color: textColor });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(currentX, horizonHill.position.y + horizonHill.geometry.parameters.height / 2 + letterHeight / 2 + 5, horizonHill.position.z); 
            textMesh.castShadow = true;
            niceCitySign.add(textMesh);
            
            if (letter !== ' ') {
                textGeometry.computeBoundingBox();
                const letterWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                currentX += letterWidth + letterSpacing;
            } else {
                currentX += letterSpacing * 2; 
            }
        }
        const totalWidth = currentX - letterSpacing;
        niceCitySign.position.x -= totalWidth / 2;

        // Alttan Işıklandırma
        const lightColor = 0xFFFF00; 
        niceCitySign.children.forEach(letterMesh => {
            if (letterMesh.isMesh) { 
                const light = new THREE.PointLight(lightColor, 2, 50);
                light.position.set(letterMesh.position.x, letterMesh.position.y - letterHeight / 2 - 5, letterMesh.position.z);
                niceCitySign.add(light);
            }
        });

        scene.add(niceCitySign);
    },
    // Progress callback (isteğe bağlı)
    undefined,
    // Error callback: Font yüklenemezse ne olacağını belirtin.
    function ( err ) {
        console.error( 'Font yüklenirken bir hata oluştu. FontLoader için doğru yol veya dosya eksik olabilir.', err );
        // Font yüklenemezse, NICE CITY yazısını oluşturmamak veya basit 3D kutular kullanmak gibi bir yedek çözüm uygulayabilirsiniz.
        // Örneğin:
        const FALLBACK_LETTER_SIZE = 5; // Yedek harf boyutu
        const FALLBACK_LETTER_SPACING = 3; // Yedek harf aralığı
        let fallbackCurrentX = 0;
        const fallbackMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

        for (let i = 0; i < text.length; i++) {
            const letter = text.charAt(i);
            if (letter === ' ') {
                fallbackCurrentX += FALLBACK_LETTER_SPACING * 2;
                continue;
            }
            const boxGeometry = new THREE.BoxGeometry(FALLBACK_LETTER_SIZE * 0.8, FALLBACK_LETTER_SIZE, FALLBACK_LETTER_SIZE * 0.2);
            const boxMesh = new THREE.Mesh(boxGeometry, fallbackMaterial);
            boxMesh.position.set(fallbackCurrentX, horizonHill.position.y + horizonHill.geometry.parameters.height / 2 + FALLBACK_LETTER_SIZE / 2 + 5, horizonHill.position.z);
            niceCitySign.add(boxMesh);
            fallbackCurrentX += FALLBACK_LETTER_SIZE * 0.8 + FALLBACK_LETTER_SPACING;
        }
        niceCitySign.position.x -= fallbackCurrentX / 2; // Ortala
        scene.add(niceCitySign); // Yedek tabelayı ekle
    }
    ); // FontLoader.load fonksiyonu kapanışı
}

// CanvasTexture ile palmiye gövde dokusu
function createPalmTrunkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a3728'; // Kahverengi
    ctx.fillRect(0,0,32,128);
    ctx.strokeStyle = '#3a2718'; // Daha koyu kahverengi
    ctx.lineWidth = 2;
    for(let i=0; i<128; i+=10) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(32,i); ctx.stroke(); }
    return new THREE.CanvasTexture(canvas);
}

// CanvasTexture ile palmiye yaprak dokusu
function createPalmLeavesTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f8a5f'; // Koyu yeşil
    ctx.fillRect(0,0,64,32);
    ctx.strokeStyle = '#0a6a4f';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,16); ctx.lineTo(64,16); ctx.stroke(); // Orta damar
    return new THREE.CanvasTexture(canvas);
}

function createPalmTree(x, z) {
    const palm = new THREE.Group();
    palm.userData.isStaticObject = true; 
    const trunkHeight = 12 + Math.random() * 4;
    
    // CanvasTexture ile gövde dokusu
    const trunkTexture = createPalmTrunkTexture();
    trunkTexture.wrapT = THREE.RepeatWrapping;
    trunkTexture.repeat.set(1, trunkHeight / 5); 
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, trunkHeight, 8), new THREE.MeshPhongMaterial({ map: trunkTexture, flatShading: true }));
    trunk.position.y = trunkHeight / 2; trunk.castShadow = true; palm.add(trunk);
    
    // CanvasTexture ile yaprak dokusu
    const leafTexture = createPalmLeavesTexture();
    const leafMaterial = new THREE.MeshPhongMaterial({ map: leafTexture, flatShading: true, side: THREE.DoubleSide });
    for (let i = 0; i < 10; i++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5, 1, 1), leafMaterial);
        leaf.castShadow = true; leaf.position.y = trunkHeight;
        leaf.rotation.y = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
        leaf.rotation.x = Math.PI / 4 + Math.random() * 0.2;
        palm.add(leaf);
    }
    palm.position.set(x, 0, z); palmTrees.push(palm); scene.add(palm);
}

// CanvasTexture ile heykel dokusu
function createStatueTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#C0C0C0'; // Gümüş/Mermer tonu
    ctx.fillRect(0,0,64,128);
    ctx.strokeStyle = '#A0A0A0'; // Gölgeler
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(10,128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(54,0); ctx.lineTo(54,128); ctx.stroke();
    return new THREE.CanvasTexture(canvas);
}

function createStatue() {
    const statue = new THREE.Group();
    statue.userData.isStaticObject = true; 
    const baseGeo = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    statue.add(base);
    const bodyGeo = new THREE.BoxGeometry(1, 4, 1);
    // CanvasTexture ile heykel dokusu
    const statueTexture = createStatueTexture();
    const bodyMat = new THREE.MeshPhongMaterial({ map: statueTexture, shininess: 100 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.25;
    statue.add(body);
    statue.castShadow = true;
    statue.userData.isStatue = true;
    statue.userData.isHit = false;
    return statue;
}

// CanvasTexture ile direk dokusu
function createStreetLightPoleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#444444'; // Koyu gri
    ctx.fillRect(0,0,32,128);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(16,128); ctx.stroke();
    return new THREE.CanvasTexture(canvas);
}

// CanvasTexture ile ampul dokusu (basit sarı daire)
function createStreetLightBulbTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffd700'; // Ampul rengi (sarı)
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2, false); // Daire çiz
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

function createStreetLights() {
    // Direk dokusu
    const poleTexture = createStreetLightPoleTexture();
    poleTexture.wrapT = THREE.RepeatWrapping;
    poleTexture.repeat.set(1, 8 / 2); 
    const poleMaterial = new THREE.MeshPhongMaterial({ map: poleTexture });
    
    // Ampul dokusu
    const bulbTexture = createStreetLightBulbTexture(); 
    const bulbMaterial = new THREE.MeshBasicMaterial({ map: bulbTexture, transparent: true });

    const spacing = 150;
    for (let i = 0; i < TOTAL_LENGTH / spacing; i++) {
        [-1, 1].forEach(side => {
            const lightGroup = new THREE.Group();
            lightGroup.userData.isStaticObject = true; 
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8), poleMaterial);
            pole.position.y = 4;
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4), bulbMaterial.clone());
            const light = new THREE.PointLight(0xffd700, 1, 30, 2);
            bulb.position.y = 8.2;
            light.position.y = 8;
            lightGroup.add(pole, bulb, light);
            lightGroup.position.set((ROAD_WIDTH / 2 + 2) * side, 0, i * spacing - TOTAL_LENGTH / 2);
            lightGroup.castShadow = true;
            lightGroup.userData = { isStreetlight: true, isHit: false, isFalling: false, isStaticObject: true };
            streetLights.push(lightGroup); scene.add(lightGroup);
        });
    }
}

// CanvasTexture ile yağmur damlası dokusu
function createRainParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.arc(8, 8, 7, 0, Math.PI * 2, false);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

function createRain() {
    const vertices = [];
    for (let i = 0; i < 15000; i++) vertices.push(THREE.MathUtils.randFloatSpread(50), THREE.MathUtils.randFloat(0, 50), THREE.MathUtils.randFloatSpread(50));
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // Yağmur partikülü dokusu
    const rainParticleTexture = createRainParticleTexture();
    const rainParticleMaterial = new THREE.PointsMaterial({ 
        map: rainParticleTexture, 
        color: 0xaaaaaa, 
        size: 0.5, 
        transparent: true,
        blending: THREE.AdditiveBlending 
    });
    rain = new THREE.Points(geometry, rainParticleMaterial);
    rain.visible = false; scene.add(rain);
}

function toggleRain(state) {
    isRaining = state; rain.visible = state;
    const wetRoadColor = new THREE.Color(0x222222); const dryRoadColor = new THREE.Color(0x808080);
    road.children.forEach(segment => {
        const currentMaterial = segment.material;
        currentMaterial.color = state ? wetRoadColor : dryRoadColor;
        currentMaterial.shininess = state ? 80 : 10;
        currentMaterial.needsUpdate = true;
    });
}

function updateRain(deltaTime) {
    if (!rain) return; const positions = rain.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 20 * deltaTime;
        if (positions[i] < -5) positions[i] = 50;
    }
    rain.geometry.attributes.position.needsUpdate = true;
    if (player) { rain.position.x = player.position.x; rain.position.z = player.position.z; }
}

function updatePedestrians() {
    [...pedestrians, ...cityDecorations].forEach(p => {
        if(p === hotelSign) return;
        p.rotation.y = Math.atan2( ( camera.position.x - p.position.x ), ( camera.position.z - p.position.z ) );
    });
     parkedCars.forEach(p => {
        p.rotation.y = -Math.PI/2 + Math.atan2( ( camera.position.x - p.position.x ), ( camera.position.z - p.position.z ) );
    });
}

function updateFlyingDebris(deltaTime) {
    flyingDebris.forEach(debris => {
        debris.position.add(debris.userData.velocity);
        debris.rotation.x += debris.userData.rotationSpeed.x;
        debris.rotation.y += debris.userData.rotationSpeed.y;
        debris.rotation.z += debris.userData.rotationSpeed.z;

        if (debris.position.y > 10) {
            debris.userData.velocity.y = -0.02;
        }
        if (debris.position.y < 0.2) {
            debris.userData.velocity.y = Math.random() * 0.05 + 0.02;
        }
    });
}

function setupMission1Objects() {
    const hotelX = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 15;
    const hotelZ = -1500;
    
    hotelSign = createCityDecoration('hotel', "HOTEL");
    hotelSign.position.set(hotelX, 15, hotelZ);
    hotelSign.rotation.y = -Math.PI / 2;
    cityDecorations.push(hotelSign);
    scene.add(hotelSign);
}

function startMission1() {
    if (missionState.status !== 'inactive') return;
    
    missionState.status = 'pickupCinematic';
    missionState.cinematicTimer = 6;
    showSubtitle("General'in kizi tehlikede! Onu kurtar!", 4000);

    if(policeCar) scene.remove(policeCar);
    policeCar = null;
    if(sounds.siren && sounds.siren.playing()) sounds.siren.stop();

    julieNPC = createPedestrian(true);
    const julieX = player.position.x > 0 ? (ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2) : (-ROAD_WIDTH / 2 - SIDEWALK_WIDTH / 2);
    julieNPC.position.set(julieX, 1.2, player.position.z - 60);
    pedestrians.push(julieNPC);
    scene.add(julieNPC);

    missionState.cinematicTarget = new THREE.Vector3(julieX - 3, 0, julieNPC.position.z + 5);
}

function updateMission(deltaTime) {
    if (missionState.status === 'inactive') {
        if (score >= 5000) {
            startMission1();
        }
        return;
    }

    switch(missionState.status) {
        case 'pickupCinematic':
            player.position.lerp(missionState.cinematicTarget, 0.02);
            speed = Math.max(0, speed * 0.98);

            missionState.cinematicTimer -= deltaTime;
            if (missionState.cinematicTimer <= 2 && julieNPC && julieNPC.parent === scene) {
                scene.remove(julieNPC); 
                pedestrians = pedestrians.filter(p => !p.userData.isJulie);
                julieNPC = null;
            }
            if (missionState.cinematicTimer <= 0) {
                missionState.status = 'drivingWithJulie';
                missionState.julieChatterTimer = 5; 
                showSubtitle("Onu 10000 skora ulasana kadar koru!", 5000);

                canBeCaught = true;
                wantedLevel = 2;
                updateStarsUI();
            }
            break;

        case 'drivingWithJulie':
            missionState.julieChatterTimer -= deltaTime;
            if(missionState.julieChatterTimer <= 0){
                showSpeechBubble('julie', ''); 
                missionState.julieChatterTimer = 8 + Math.random() * 5; 
            }
            
            if(score >= 10000){
                missionState.status = 'dropoffCinematic';
                missionState.cinematicTimer = 8;
                showSubtitle("Otel! Burasi guvenli olmali.", 4000);
                missionState.cinematicTarget = new THREE.Vector3(hotelSign.position.x - 3, 0, hotelSign.position.z + 5);
            }
            break;

        case 'dropoffCinematic':
            player.position.lerp(missionState.cinematicTarget, 0.02);
            speed = Math.max(0, speed * 0.98);
            
            missionState.cinematicTimer -= deltaTime;

            if(missionState.cinematicTimer <= 6 && !document.getElementById('julie-speech-bubble').classList.contains('visible')) {
                showSpeechBubble('julie', 'tesekkurler yakisikli ?', 3000);
            }
            if(missionState.cinematicTimer <= 3 && !document.getElementById('player-speech-bubble').classList.contains('visible')) {
                showSpeechBubble('player', 'tekrar goruseriz bebek', 3000);
            }

            if (missionState.cinematicTimer <= 0) {
                missionState.status = 'completed';
                showSubtitle("Gorev Tamamlandi! +20000 SKOR", 5000);
                score += 20000;
                wantedLevel = 0;
                updateStarsUI();
            }
            break;
    }
}

function initializeGame() { 
    try {
        clock = new THREE.Clock(); scene = new THREE.Scene();
        
        // Gökyüzü için basit bir renk veya gradyan arka plan
        scene.background = dayCycleParameters.NIGHT.background.clone(); 
        
        // Hafif sis
        scene.fog = new THREE.Fog(0xcce0ff, TOTAL_LENGTH * 0.6, TOTAL_LENGTH); 

        hemiLight = new THREE.HemisphereLight(dayCycleParameters.NIGHT.hemiSky, dayCycleParameters.NIGHT.hemiGround, dayCycleParameters.NIGHT.dirIntensity);
        scene.add(hemiLight);
        dirLight = new THREE.DirectionalLight(dayCycleParameters.NIGHT.dirLight, dayCycleParameters.NIGHT.dirIntensity);
        dirLight.position.set(-50, 40, 20); dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5; dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -100; dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100; dirLight.shadow.camera.bottom = -100;
        scene.add(dirLight); 
        
        createWorld(); 
        
        // OPTİMİZASYON: Trafik arabası havuzunu oluştur
        for(let i = 0; i < 25; i++) { 
            const car = createTrafficCarInternal(); 
            car.visible = false; 
            trafficCarPool.push(car);
            scene.add(car); 
        }

        updateHealth();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000); 
        isIntroPlaying = true;
        cinematicCameraTarget = new THREE.Vector3();
        camera.position.set(player.position.x + 10, player.position.y + 4, player.position.z + 10);
        camera.lookAt(player.position);

        renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true }); 
        renderer.setSize(window.innerWidth, window.innerHeight); renderer.shadowMap.enabled = true;
        
        setupControls(); 
        areHazardLightsOn = true;
        
        animate(); 
        
        window.addEventListener('resize', onWindowResize, false);
        document.getElementById('game').classList.add('visible');
        
        setTimeout(() => {
            showSpeechBubble('player', 'Hmm, guzel araba... Artik benim.');
        }, 1500);

        document.getElementById('mission-container').style.display = 'none';

        if (sounds?.engine) sounds.engine.play();
    } catch(e) {
        displayError(e);
    }
}

function animate() { 
    requestAnimationFrame(animate); 
    if (isGameOver) return;
    const deltaTime = clock.getDelta();
    
    let effectiveDeltaTime = deltaTime;
    let currentSpeed = speed;

    if (isIntroPlaying) {
        cinematicCameraTarget.set(
            player.position.x * 0.6,
            player.position.y + 12 - (speed / 5.5 * 2),
            player.position.z + 25 - (speed / 5.5 * 5)
        );
        camera.position.lerp(cinematicCameraTarget, deltaTime * 0.6);
        const lookAtTarget = new THREE.Vector3(player.position.x, player.position.y + 2.0, player.position.z);
        camera.lookAt(lookAtTarget);
        if (camera.position.distanceTo(cinematicCameraTarget) < 1.0) {
            isIntroPlaying = false;
            document.getElementById('ui-container').classList.add('visible');
            if (window.innerWidth <= 768) {
                document.getElementById('mobile-controls').classList.add('visible');
            }
        }
        renderer.render(scene, camera);
        return;
    }

    updateMission(deltaTime);

    if (isRampJumpingCinematic) {
        effectiveDeltaTime *= 0.3; 
        currentSpeed *= 0.3;

        rampJumpCinematicTimer -= deltaTime;
        if (rampJumpCinematicTimer <= 0) {
            isRampJumpingCinematic = false;
            shakeCamera(0.4);
        }
    } else if (!missionState.status.includes('Cinematic')) {
        updatePlayerMovement();
        if (canBeCaught) {
            updatePoliceAI(deltaTime);
            checkPoliceCollisions();
        }
        checkDestructibleCollisions();
        checkCollisions();
    }
    
    checkRampJumps();
    
    if (player.userData.isJumping) {
        player.position.y += player.userData.verticalVelocity * effectiveDeltaTime;
        player.userData.verticalVelocity -= 25 * effectiveDeltaTime;
        if (player.position.y <= 0) { 
            player.position.y = 0; 
            player.userData.isJumping = false;
            player.userData.verticalVelocity = 0;
            if(!isRampJumpingCinematic) shakeCamera(0.2);
        }
    }

    const topSpeed = 5.5;
    if (isRadioPlaying && sounds.radio && sounds.engine) {
        const normalizedSpeed = Math.min(speed / topSpeed, 1.0);
        const targetRadioVol = RADIO_VOL_MAX - (normalizedSpeed * (RADIO_VOL_MAX - RADIO_VOL_MIN));
        const targetEngineVol = ENGINE_VOL_MIN + (normalizedSpeed * (ENGINE_VOL_MAX - ENGINE_VOL_MIN));
        sounds.radio.volume(THREE.MathUtils.lerp(sounds.radio.volume(), targetRadioVol, 0.05));
        sounds.engine.volume(THREE.MathUtils.lerp(sounds.engine.volume(), targetEngineVol, 0.05));
    }
    if (policeDisableTimer > 0) policeDisableTimer -= deltaTime;
    if(hasPlayerMoved) gameTime += deltaTime;
    if (areHazardLightsOn) { if(player && player.userData.lights) Object.values(player.userData.lights).forEach(light => {
        if (light.isMesh) {
            light.material.color.setHex(Math.sin(clock.getElapsedTime() * 8) > 0 ? 0xFFFF88 : 0xAAAA00); 
        } else if (light instanceof THREE.PointLight) {
            light.intensity = Math.sin(clock.getElapsedTime() * 8) > 0 ? 1.5 : 0;
        }
    }); }
    if (policeSpawnTimer > 0) { policeSpawnTimer -= deltaTime; if (policeSpawnTimer <= 0) { createPoliceCar(); startGame(); } }
    if (hasPlayerMoved && !isBoosting) { if (cleanDrivingTime < BOOST_CHARGE_TIME) cleanDrivingTime += deltaTime; else if (!isBoostAvailable) { isBoostAvailable = true; updateBoostUI(); } }
    if (isBoosting) { boostTimeRemaining -= deltaTime; if (boostTimeRemaining <= 0) isBoosting = false; }
    if (hasPlayerMoved && wantedLevel > 0 && gameTime > nextChatterTime) { generateRadioChatter(); nextChatterTime = gameTime + CHATTER_INTERVAL + Math.random() * 10; }
    if (hasPlayerMoved && gameTime > nextMissionPromptTime) {
        const missionContainer = document.getElementById('mission-container');
        if (missionContainer && !missionContainer.classList.contains('visible') && missionState.status === 'completed') {
            if (missionHideTimeout) clearTimeout(missionHideTimeout);
            document.getElementById('mission-text').innerText = turkishToEnglish("Yeni bir görev almak icin dugmeye bas!");
            document.getElementById('generate-mission-btn').disabled = false;
            document.getElementById('generate-mission-btn').innerHTML = turkishToEnglish('✨ Yeni Görev Al');
            missionContainer.style.display = 'flex';
            setTimeout(() => missionContainer.classList.add('visible'), 10);
            missionHideTimeout = setTimeout(() => {
                missionContainer.classList.remove('visible');
                missionContainer.addEventListener('transitionend', () => {
                    if (!missionContainer.classList.contains('visible')) { missionContainer.style.display = 'none'; }
                }, { once: true });
            }, 3000);
        }
        nextMissionPromptTime = gameTime + MISSION_PROMPT_INTERVAL + Math.random() * 15;
    }

    trafficCars.forEach(car => {
        if (car.userData.type === 'ambulance' && !car.userData.healedPlayer) {
            const distance = player.position.distanceTo(car.position);
            const proximityThreshold = 15;
            if (distance < proximityThreshold) {
                playerHealth = Math.min(100, playerHealth + 5); 
                car.userData.healedPlayer = true;
                updateHealth();
                showSpeechBubble('player', '+5 Can!'); 
                // Eğer spell_heal.ogg dosyası yoksa, bu ses çalmayacaktır.
                // if (sounds.heal_sound) sounds.heal_sound.play();
            }
        }
    });

    const newDifficultyLevel = Math.floor(score / 20000);
    if (newDifficultyLevel > trafficDifficultyLevel) {
        trafficDifficultyLevel = newDifficultyLevel;
    }

    updateDayCycle(deltaTime);
    if (canBeCaught && !isGameOver && clock.getElapsedTime() > nextSpeechBubbleTime && missionState.status !== 'drivingWithJulie') {
        if (Math.random() < 0.5) { showSpeechBubble('police'); } else { showSpeechBubble('player'); }
        nextSpeechBubbleTime = clock.getElapsedTime() + SPEECH_BUBBLE_INTERVAL + (Math.random() * 4 - 2);
    }
    if (wantedLevel > 0 && wantedLevelCooldown > 0) { wantedLevelCooldown -= deltaTime; if (wantedLevelCooldown <= 0) { wantedLevel--; updateStarsUI(); if (wantedLevel > 0) wantedLevelCooldown = 5; } }
    
    updateTraffic(effectiveDeltaTime); 
    if(canBeCaught) updatePoliceShooting(effectiveDeltaTime); 
    updateDebris(effectiveDeltaTime); 
    updateBulletSparks(effectiveDeltaTime); 
    if (isRaining) updateRain(effectiveDeltaTime);
    updateFallingObjects(effectiveDeltaTime); 
    updateCamera(); 
    moveWorld(currentSpeed); 
    updatePedestrians();
    updateFlyingDebris(effectiveDeltaTime);

    const time = clock.getElapsedTime() * 5; 
    if (policeCar && sirenLightRed) sirenLightRed.material.emissiveIntensity = Math.sin(time) > 0 ? 1.0 : 0.0; 
    if (policeCar && sirenLightBlue) sirenLightBlue.material.emissiveIntensity = Math.sin(time) < 0 ? 1.0 : 0.0; 
    score += missionState.status.includes('Cinematic') ? 0 : speed;
    document.getElementById('score').innerText = `SKOR: ${Math.floor(score)}`;
    
    if (!policeCar && canBeCaught && wantedLevel > 0 && hasPlayerMoved && !isGameOver) { createPoliceCar(); }
    renderer.render(scene, camera);
}

// OYUNU BAŞLAT
window.addEventListener('DOMContentLoaded', () => { 
    loadSounds();
    loadAssets(); 
    setupGameStart(); 
});
