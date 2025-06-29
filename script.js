import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js';

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
let hemiLight, dirLight;
let speed = 0, score = 0, wantedLevel = 0, playerHealth = 100;
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
// --- YENİ --- Julie'nin korku diyalogları
const julieScaredPhrases = ["Cok hizlisin!", "Dikkat et!", "Polisler pesimizde!", "Korkmaya basliyorum!", "Bizi yakalayacaklar!"].map(turkishToEnglish);


async function callGemini(prompt) {
    const isMissionPrompt = prompt.includes("görev hedefi oluştur");
    const apiKey = "";
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
        engine: new Howl({ src: ['https://github.com/atakancerrahoglu/Nice-city/raw/refs/heads/main/engine_sound.ogg'], loop: true, volume: ENGINE_VOL_MIN, html5: true }),
        crash: new Howl({ src: ['https://actions.google.com/sounds/v1/impacts/crash.ogg'], volume: 0.5 }),
        siren: new Howl({ src: ['https://github.com/atakancerrahoglu/Nice-city/raw/refs/heads/main/police_sound.ogg'], loop: true, volume: SIREN_VOLUME }),
        radio: new Howl({ src: ['https://github.com/atakancerrahoglu/Nice-city/raw/refs/heads/main/Vice%20City%20Geceleri.mp3'], loop: true, volume: MENU_VOLUME, html5: true }),
        heal_sound: new Howl({ src: ['https://actions.google.com/sounds/v1/fantasy/spell_heal.ogg'], volume: 0.7 })
    };
}

function loadAssets() {
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
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
            initializeGame();
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

function createPlayer() {
    player = new THREE.Group();

    const bodyCanvas = document.createElement('canvas');
    bodyCanvas.width = 256; bodyCanvas.height = 256;
    const bodyCtx = bodyCanvas.getContext('2d');
    bodyCtx.fillStyle = '#D40000';
    bodyCtx.fillRect(0, 0, 256, 256);
    bodyCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    bodyCtx.fillRect(108, 0, 40, 256);
    const bodyTexture = new THREE.CanvasTexture(bodyCanvas);

    const windowCanvas = document.createElement('canvas');
    windowCanvas.width = 64; windowCanvas.height = 64;
    const windowCtx = windowCanvas.getContext('2d');
    const gradient = windowCtx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, '#333');
    gradient.addColorStop(1, '#666');
    windowCtx.fillStyle = gradient;
    windowCtx.fillRect(0, 0, 64, 64);
    const windowTexture = new THREE.CanvasTexture(windowCanvas);
    
    const bodyMaterial = new THREE.MeshPhongMaterial({ map: bodyTexture, flatShading: true });
    const secondaryMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, flatShading: true });
    const windowMaterial = new THREE.MeshPhongMaterial({ map: windowTexture, transparent: true, opacity: 0.8, flatShading: true });

    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF88, emissive: 0xFFFF88, emissiveIntensity: 1.5 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 1.8 });
    
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

function createPoliceCarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#004d26';
    ctx.fillRect(0, 0, 128, 256);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 50, 128, 80);

    ctx.font = "bold 30px Arial";
    ctx.fillStyle = '#004d26';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("POLICE", 64, 90);

    ctx.fillStyle = '#111111';
    ctx.fillRect(10, 140, 108, 50); 
    
    return new THREE.CanvasTexture(canvas);
}


function createPoliceCar() {
    if (policeCar) return;
    policeCar = new THREE.Group();

    const policeTexture = createPoliceCarTexture();
    const bodyMaterial = new THREE.MeshPhongMaterial({ map: policeTexture, flatShading: true });
    
    const blackTrimMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, transparent: true, opacity: 0.7 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xbb0000, emissive: 0xbb0000, emissiveIntensity: 1.5 });
    
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
    sirenLightRed = new THREE.Mesh(sirenLightGeo, new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0 }));
    sirenLightRed.position.set(-0.3, 1.7, -0.3); policeCar.add(sirenLightRed);
    sirenLightBlue = new THREE.Mesh(sirenLightGeo, new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 0 }));
    sirenLightBlue.position.set(0.3, 1.7, -0.3); policeCar.add(sirenLightBlue);
    
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const createWheel = () => { 
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); 
        wheel.rotation.z = Math.PI / 2; return wheel; 
    };
    const wFL = createWheel(); wFL.position.set(-1.3, 0.4, -1.6); 
    const wFR = createWheel(); wFR.position.set(1.3, 0.4, -1.6);
    const wBL = createWheel(); wBL.position.set(-1.3, 0.4, 1.8); 
    const wBR = createWheel(); wBR.position.set(1.3, 0.4, 1.8); 
    policeCar.add(wFL, wFR, wBL, wBR);

    const policeHeadlight1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xFFFF88, emissive: 0xFFFF88, emissiveIntensity: 1.0 }));
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

function createGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;

    for(let i = 0; i < 128; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 128);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

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
        ctx.font = `bold ${type === 'hotel' ? '40px' : '48px'} 'Bebas Neue', sans-serif`;
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
    return detail;
}

function createAmbulance() {
    const ambulance = new THREE.Group();
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, flatShading: true });
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, flatShading: true });
    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, transparent: true, opacity: 0.8, flatShading: true });
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF88, emissive: 0xFFFF88, emissiveIntensity: 1.0 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 1.0 });

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
    const roofLightMaterialBlue = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 0 });
    const roofLightMaterialRed = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0 });
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
    const createWheel = () => { const w = new THREE.Mesh(wheelGeometry, wheelMaterial); w.rotation.z = Math.PI / 2; return w; };
    const wFL = createWheel(); wFL.position.set(-1.4, 0.5, -2.0);
    const wFR = createWheel(); wFR.position.set(1.4, 0.5, -2.0);
    const wBL = createWheel(); wBL.position.set(-1.4, 0.5, 2.0);
    const wBR = createWheel(); wBR.position.set(1.4, 0.5, 2.0);
    ambulance.add(wFL, wFR, wBL, wBR);

    ambulance.userData.type = 'ambulance';
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
        if(isAccelerating) { speed = Math.min(topSpeed, speed + 0.08); } 
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
    const turnSpeed = speed > 0.5 ? 0.25 : 0;
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
    
    const buildingTexture = createBuildingTexture(bW, bH, nF);
    buildingTexture.wrapS = THREE.RepeatWrapping;
    buildingTexture.wrapT = THREE.RepeatWrapping;
    buildingTexture.repeat.set(1, 1);

    const bG = new THREE.BoxGeometry(bW, bH, bDe);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        map: buildingTexture,
        flatShading: true 
    });

    const bMe = new THREE.Mesh(bG, buildingMaterial); bMe.castShadow = true; bMe.receiveShadow = true;
    const bGr = new THREE.Group(); bGr.add(bMe);
    if (Math.random() < 0.3) {
        const neonWidth = bW * (0.5 + Math.random() * 0.3); const neonHeight = bH * (0.05 + Math.random() * 0.1); const neonColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
        const nG = new THREE.BoxGeometry(neonWidth, neonHeight, 0.5); const nM = new THREE.MeshBasicMaterial({ color: neonColor, emissive: neonColor, emissiveIntensity: 1.0 });
        const n = new THREE.Mesh(nG, nM); n.position.set(0, Math.random() * (bH/2) - (bH/4), bDe/2 + 0.25); bGr.add(n);
        const pL = new THREE.PointLight(neonColor, 2, 40); pL.position.copy(n.position); bGr.add(pL);
    }
    
    bGr.position.set(x, bH / 2, z); buildings.push(bGr); scene.add(bGr);
}

function moveWorld(currentSpeed){
    [...buildings, ...palmTrees, ...guardRails, ...trafficCars, ...streetLights, ...statues, ...pedestrians, ...flyingDebris, ...parkedCars, ...beachDetails, ...cityDecorations].forEach(o=>{
        // --- YENİ --- Görev nesnelerinin hareket mantığı güncellendi
        if (o.userData.isJulie) return; // Julie her zaman sabit kalır (oluşturulduktan sonra)
        if (missionState.status === 'dropoffCinematic' && o === hotelSign) return; // Bırakma sinematiğinde otel sabit kalır

        o.position.z += currentSpeed;
        if(o.position.z > player.position.z + 200) o.position.z -= TOTAL_LENGTH + Math.random() * 200;
        else if(o.position.z < player.position.z - TOTAL_LENGTH - 100) o.position.z += TOTAL_LENGTH + Math.random() * 200;
    });
    road.children.forEach(c => { c.position.z += currentSpeed; if(c.position.z > player.position.z + SEGMENT_LENGTH/2) c.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; });
    sidewalkLeft.children.forEach(c => { c.position.z += currentSpeed; if(c.position.z > player.position.z + SEGMENT_LENGTH/2) c.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; });
    sidewalkRight.children.forEach(c => { c.position.z += currentSpeed; if(c.position.z > player.position.z + SEGMENT_LENGTH/2) c.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; });
    buildingGround.children.forEach(c => { c.position.z += currentSpeed; if(c.position.z > player.position.z + SEGMENT_LENGTH/2) c.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; });
    beach.children.forEach(c => { c.position.z += currentSpeed; if(c.position.z > player.position.z + SEGMENT_LENGTH/2) c.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; });
    ocean.children.forEach(c => { c.position.z += currentSpeed; if(c.position.z > player.position.z + SEGMENT_LENGTH/2) c.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; });
    roadLines.forEach(l => { 
        l.position.z += currentSpeed; 
        if (l.position.z > player.position.z + SEGMENT_LENGTH/2) l.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH; 
    });
}


function updatePoliceShooting(dT){
    if(wantedLevel < 2 || !policeCar || policeDisableTimer > 0) return;
    lastPoliceShotTime += dT; const shotInterval = 6 - wantedLevel * 0.8;
    if(lastPoliceShotTime > shotInterval){
        lastPoliceShotTime = 0; takeDamage(wantedLevel * 2); createBulletSparks(player);
        const hB = document.getElementById('health-bar'); hB.classList.add('damaged');
        setTimeout(() => hB.classList.remove('damaged'), 200); shakeCamera(0.2 + wantedLevel * 0.05);
    }
}

function takeDamage(amount, reason = "WASTED"){
    if (isGameOver) return;
    playerHealth -= amount; 
    updateHealth();
    if(playerHealth <= 0){ endGame(reason); }
}

function updateHealth() {
    playerHealth = Math.max(0, Math.min(100, playerHealth));
    const healthBar = document.getElementById('health-bar');
    if (healthBar) {
        healthBar.style.width = playerHealth + '%';
        if (playerHealth > 50) {
            healthBar.style.backgroundColor = '#4CAF50';
        } else if (playerHealth > 20) {
            healthBar.style.backgroundColor = '#FFC107';
        } else {
            healthBar.style.backgroundColor = '#f44336';
        }
    }
}

function updateTraffic(dT){
    if(trafficCars.length < 15 && Math.random() < 0.03 && hasPlayerMoved) createTrafficCar();
    for(let i = trafficCars.length - 1; i >= 0; i--){
        const car = trafficCars[i];
        if(car.userData.isHit){
            car.position.add(car.userData.velocity.clone().multiplyScalar(dT)); car.rotation.y += car.userData.spin * dT;
            car.userData.velocity.y -= 9.8 * dT; car.userData.life -= dT;
            if(car.userData.life <= 0){ scene.remove(car); trafficCars.splice(i, 1); }
        } else { car.position.z += car.userData.speed * 0.5; }
        if(car.position.z > player.position.z + 50 || car.position.z < player.position.z - 500){ scene.remove(car); trafficCars.splice(i, 1); }
    }
}

function checkRampJumps() {
    if (!player || player.userData.isJumping || isRampJumpingCinematic || missionState.status.includes('Cinematic')) return;

    const playerBox = new THREE.Box3().setFromObject(player);

    for (let i = trafficCars.length - 1; i >= 0; i--) {
        const car = trafficCars[i];
        if (car.userData.type !== 'ramp_truck') continue;
        
        const rampMesh = car.userData.rampMesh;
        if (!rampMesh) continue;

        const rampBox = new THREE.Box3().setFromObject(rampMesh);

        if (playerBox.intersectsBox(rampBox)) {
             if (speed > 2.5) {
                player.userData.isJumping = true; 
                player.userData.verticalVelocity = 25;
                score += 2500;
                showSpeechBubble('player', 'Hadi Ucalim!');
                
                isRampJumpingCinematic = true;
                rampJumpCinematicTimer = 2.0;
                cinematicRampCameraPos.set(player.position.x - 20, player.position.y + 10, player.position.z);

                return; 
            }
        }
    }
}


function checkCollisions(){
    if(!canBeCaught || !player || isRampJumpingCinematic || missionState.status.includes('Cinematic')) return;
    const playerBoundingBox = new THREE.Box3().setFromObject(player);
    for(let i = trafficCars.length - 1; i >= 0; i--){
        const trafficCar = trafficCars[i];
        if(trafficCar.userData.isHit || trafficCar.userData.type === 'ambulance' || trafficCar.userData.type === 'ramp_truck') continue;
        const carBoundingBox = new THREE.Box3().setFromObject(trafficCar);
        if(playerBoundingBox.intersectsBox(carBoundingBox)){
            if(!isCrashSoundPlaying){
                isCrashSoundPlaying = true; if(sounds && sounds.crash) sounds.crash.play();
                setTimeout(() => { isCrashSoundPlaying = false; }, 110);
            }
            createDebris(trafficCar.position); trafficCar.userData.isHit = true; trafficCar.userData.life = 2.0;
            const impactDirection = new THREE.Vector3().subVectors(trafficCar.position, player.position).normalize();
            trafficCar.userData.velocity = impactDirection.multiplyScalar(15 + speed).add(new THREE.Vector3(0, 3, 0));
            trafficCar.userData.spin = (Math.random() - 0.5) * 10;
            speed *= 0.2; takeDamage(4); cleanDrivingTime = 0; isBoostAvailable = false; updateBoostUI();
            lastPoliceShotTime = 0; shakeCamera(0.4); score += 500;
            if(wantedLevel < 5 && wantedLevelCooldown <= 0) { wantedLevel++; updateStarsUI(); wantedLevelCooldown = 3; }
            break;
        }
    }
}

function checkPoliceCollisions() {
    if (!policeCar) return;
    const policeBoundingBox = new THREE.Box3().setFromObject(policeCar);
    for (let i = trafficCars.length - 1; i >= 0; i--) {
        const trafficCar = trafficCars[i]; if (trafficCar.userData.isHit) continue; 
        const carBoundingBox = new THREE.Box3().setFromObject(trafficCar);
        if (policeBoundingBox.intersectsBox(carBoundingBox)) {
            policeCar.userData.health -= 10;
            const impactDirection = new THREE.Vector3().subVectors(trafficCar.position, policeCar.position).normalize();
            trafficCar.userData.velocity = impactDirection.multiplyScalar(10).add(new THREE.Vector3(0, 2, 0));
            trafficCar.userData.spin = (Math.random() - 0.5) * 5;
            trafficCar.userData.isHit = true; trafficCar.userData.life = 2.0;
            if (policeCar.userData.health <= 0) { scene.remove(policeCar); policeCar = null; return; }
            break; 
        }
    }
}

function checkDestructibleCollisions() {
    if (!player || isRampJumpingCinematic || missionState.status.includes('Cinematic')) return;
    const playerBox = new THREE.Box3().setFromObject(player);
    for (let i = statues.length - 1; i >= 0; i--) {
        const statue = statues[i];
        if (statue.userData.isHit) continue;
        const statueBox = new THREE.Box3().setFromObject(statue);
        if (playerBox.intersectsBox(statueBox)) {
            statue.userData.isHit = true;
            createDebris(statue.position);
            scene.remove(statue);
            statues.splice(i, 1);
            takeDamage(5); speed *= 0.8; score += 1000; shakeCamera(0.5);
            if(sounds && sounds.crash) sounds.crash.play();
            cleanDrivingTime = 0; isBoostAvailable = false; updateBoostUI();
        }
    }
    for (let i = streetLights.length - 1; i >= 0; i--) {
        const light = streetLights[i];
        if (light.userData.isHit) continue;
        const lightBox = new THREE.Box3().setFromObject(light.children[0]);
        lightBox.expandByVector(new THREE.Vector3(0,4,0));
        lightBox.applyMatrix4(light.matrixWorld);
        if (playerBox.intersectsBox(lightBox)) {
            light.userData.isHit = true;
            light.userData.isFalling = true;
            light.userData.fallRotation = 0;
            light.userData.fallAxis = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            takeDamage(10); speed *= 0.7; score += 250; shakeCamera(0.6);
            if(sounds && sounds.crash) sounds.crash.play();
            cleanDrivingTime = 0; isBoostAvailable = false; updateBoostUI();
        }
    }
}

function shakeCamera(intensity = 0.3){
    let shakeAmount = intensity;
    const shakeInterval = setInterval(() => {
        camera.position.x += (Math.random() - 0.5) * shakeAmount;
        camera.position.y += (Math.random() - 0.5) * shakeAmount;
        shakeAmount *= 0.8;
        if(shakeAmount < 0.05) { clearInterval(shakeInterval); }
    }, 20);
}

function endGame(reason){
    isGameOver = true;
    if (sounds && sounds.siren) sounds.siren.stop(); if (sounds && sounds.engine) sounds.engine.stop(); if (sounds && sounds.radio) sounds.radio.stop();
    const gameOverText = document.getElementById('game-over-text');
    const finalReason = reason === "YAKALANDIN" ? "YAKALANDIN" : "WASTED";
    gameOverText.innerText = turkishToEnglish(finalReason); 
    gameOverText.style.color = (finalReason === "WASTED") ? "#d9534f" : "#5bc0de";
    document.getElementById('game-over-screen').style.display = 'flex';
}

function createTrafficCar() { 
    const vehicleTypes = ['sedan', 'convertible', 'motorcycle', 'chopper', 'limousine', 'ramp_truck', 'ambulance'];
    const typeWeights =  [0.20, 0.15, 0.15, 0.15, 0.05, 0.15, 0.15]; 
    let randomValue = Math.random(); let chosenType; let cumulativeWeight = 0;
    for (let i = 0; i < vehicleTypes.length; i++) { cumulativeWeight += typeWeights[i]; if (randomValue < cumulativeWeight) { chosenType = vehicleTypes[i]; break; } }
    let vehicle;
    switch (chosenType) {
        case 'sedan': vehicle = createLuxurySedan(); break;
        case 'convertible': vehicle = createConvertible(); break;
        case 'motorcycle': vehicle = createMotorcycle(); break;
        case 'chopper': vehicle = createChopper(); break;
        case 'limousine': vehicle = createLimousine(); break;
        case 'ramp_truck': vehicle = createRampTruck(); break;
        case 'ambulance': vehicle = createAmbulance(); break;
    }

    if (chosenType === 'ramp_truck') {
        vehicle.position.x = ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 3;
    } else {
        const lanes = [-ROAD_WIDTH / 3, 0, ROAD_WIDTH / 3]; 
        vehicle.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    }
    
    vehicle.position.z = player.position.z - 300 - Math.random() * 400;
    
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF88, emissive: 0xFFFF88, emissiveIntensity: 1.0 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 1.0 });

    if (!vehicle.userData.lights) {
        const trafficHeadlight1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), headlightMaterial);
        trafficHeadlight1.position.set(-1.0, 0.7, -2.51); 
        const trafficHeadlight2 = trafficHeadlight1.clone(); 
        trafficHeadlight2.position.x = 1.0; 
        vehicle.add(trafficHeadlight1, trafficHeadlight2);

        const trafficTaillight1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.1), taillightMaterial);
        trafficTaillight1.position.set(-0.7, 0.7, 2.51); 
        const trafficTaillight2 = trafficTaillight1.clone(); 
        trafficTaillight2.position.x = 0.7; 
        vehicle.add(trafficTaillight1, trafficTaillight2);

        vehicle.userData.lights = { headlight1: trafficHeadlight1, headlight2: trafficHeadlight2, taillight1: trafficTaillight1, taillight2: trafficTaillight2 };
    }
    
    trafficCars.push(vehicle); scene.add(vehicle);
}

function createLuxurySedan() { 
    const car = new THREE.Group();
    
    const carColor = TRAFFIC_CAR_COLORS[Math.floor(Math.random() * TRAFFIC_CAR_COLORS.length)];
    const carTextureCanvas = document.createElement('canvas');
    carTextureCanvas.width = 128; carTextureCanvas.height = 128;
    const carCtx = carTextureCanvas.getContext('2d');
    carCtx.fillStyle = new THREE.Color(carColor).getStyle();
    carCtx.fillRect(0, 0, 128, 128);
    carCtx.fillStyle = '#222';
    carCtx.fillRect(10, 10, 108, 20);
    const carTexture = new THREE.CanvasTexture(carTextureCanvas);

    const material = new THREE.MeshPhongMaterial({ map: carTexture, flatShading: true });
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 5.5), material); body.position.y = 0.9; car.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 2.5), material); cabin.position.set(0, 1.65, -0.4); car.add(cabin);
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12); const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    function createWheel() { const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; return wheel; }
    const wFL = createWheel(); wFL.position.set(-1.2, 0.4, -1.8); const wFR = createWheel(); wFR.position.set(1.2, 0.4, -1.8);
    const wBL = createWheel(); wBL.position.set(-1.2, 0.4, 1.8); const wBR = createWheel(); wBR.position.set(1.2, 0.4, 1.8);
    car.add(wFL, wFR, wBL, wBR); car.userData.speed = 1.4 + Math.random() * 0.5; return car; 
}

function createConvertible() { 
    const car = new THREE.Group(); const material = new THREE.MeshPhongMaterial({ color: TRAFFIC_CAR_COLORS[Math.floor(Math.random() * TRAFFIC_CAR_COLORS.length)], flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 4.8), material); body.position.y = 0.75; car.add(body);
    const seatMaterial = new THREE.MeshPhongMaterial({ color: 0x552211 }); const seat1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.8), seatMaterial); seat1.position.set(0, 1.1, 0.5);
    const seat2 = seat1.clone(); seat2.position.z = -0.5; car.add(seat1, seat2);
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12); const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    function createWheel() { const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; return wheel; }
    const wFL = createWheel(); wFL.position.set(-1.2, 0.4, -1.5); const wFR = createWheel(); wFR.position.set(1.2, 0.4, -1.5);
    const wBL = createWheel(); wBL.position.set(-1.2, 0.4, 1.5); const wBR = createWheel(); wBR.position.set(1.2, 0.4, 1.5);
    car.add(wFL, wFR, wBL, wBR); car.userData.speed = 1.8 + Math.random() * 0.5; return car; 
}

function createMotorcycle() { 
    const bike = new THREE.Group(); const material = new THREE.MeshPhongMaterial({ color: TRAFFIC_CAR_COLORS[Math.floor(Math.random() * TRAFFIC_CAR_COLORS.length)], flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1.8), material); body.position.y = 0.7; bike.add(body);
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    const frontWheel = new THREE.Mesh(wheelGeometry, material); frontWheel.rotation.x = Math.PI / 2; frontWheel.position.set(0, 0.35, -0.9);
    const rearWheel = frontWheel.clone(); rearWheel.position.z = 0.9; bike.add(frontWheel, rearWheel);
    bike.userData.speed = 2.2 + Math.random() * 0.8; return bike; 
}

function createChopper() { 
    const bike = new THREE.Group(); const material = new THREE.MeshPhongMaterial({ color: TRAFFIC_CAR_COLORS[Math.floor(Math.random() * TRAFFIC_CAR_COLORS.length)], flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 2.2), material); body.position.y = 0.45; bike.add(body);
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), material); handleBar.position.set(0, 1.1, -0.8);
    const handleGrip1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), material); handleGrip1.position.set(-0.55, 1.2, -0.8);
    const handleGrip2 = handleGrip1.clone(); handleGrip2.position.x = 0.55; bike.add(handleBar, handleGrip1, handleGrip2);
    const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), material);
    rearWheel.rotation.x = Math.PI / 2; rearWheel.position.set(0, 0.3, 1.0); bike.add(rearWheel);
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12), material);
    frontWheel.rotation.x = Math.PI / 2; frontWheel.position.set(0, 0.3, -1.0); bike.add(frontWheel);
    bike.userData.speed = 2.0 + Math.random() * 0.5; return bike; 
}

function createLimousine() { 
    const limo = new THREE.Group(); const material = new THREE.MeshPhongMaterial({ color: TRAFFIC_CAR_COLORS[Math.floor(Math.random() * TRAFFIC_CAR_COLORS.length)], flatShading: true });
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 10.0), material); mainBody.position.y = 0.9; limo.add(mainBody);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 3.0), material); cabin.position.set(0, 1.7, -2.5); limo.add(cabin);
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12); const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    function createWheel() { const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; return wheel; }
    const wheelFL = createWheel(); wheelFL.position.set(-1.3, 0.4, -4.0); const wheelFR = createWheel(); wheelFR.position.set(1.3, 0.4, -4.0);
    const wheelBL = createWheel(); wheelBL.position.set(-1.3, 0.4, 4.0); const wheelBR = createWheel(); wheelBR.position.set(1.3, 0.4, 4.0);
    limo.add(wheelFL, wheelFR, wheelBL, wheelBR); limo.userData.speed = 1.2 + Math.random() * 0.3; return limo; 
}

function createRampTruck() {
    const truck = new THREE.Group();
    const cabMaterial = new THREE.MeshPhongMaterial({ color: 0x00A0B0, flatShading: true });
    const flatbedMaterial = new THREE.MeshPhongMaterial({ color: 0xFFC300, flatShading: true });
    const rampMaterial = new THREE.MeshPhongMaterial({ color: 0xFF5733, flatShading: true });

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 2.5), cabMaterial);
    cab.position.set(0, 1.1, -4.0);
    truck.add(cab);

    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, transparent: true, opacity: 0.7 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 0.1), windowMaterial);
    windshield.position.set(0, 1.5, -5.24);
    truck.add(windshield);

    const flatbed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 9), flatbedMaterial);
    flatbed.position.set(0, 0.6, 1);
    truck.add(flatbed);

    const rampGeometry = new THREE.BoxGeometry(2.4, 0.3, 7);
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(0, 1.0, 2);
    ramp.rotation.x = -Math.PI / 12;
    truck.add(ramp);

    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    function createWheel() { const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; return wheel; }
    const wheelFL = createWheel(); wheelFL.position.set(-1.3, 0.5, -3.5); 
    const wheelFR = createWheel(); wheelFR.position.set(1.3, 0.5, -3.5);
    const wheelBL1 = createWheel(); wheelBL1.position.set(-1.3, 0.5, 2.5); 
    const wheelBR1 = createWheel(); wheelBR1.position.set(1.3, 0.5, 2.5);
    const wheelBL2 = createWheel(); wheelBL2.position.set(-1.3, 0.5, 4.0); 
    const wheelBR2 = createWheel(); wheelBR2.position.set(1.3, 0.5, 4.0);
    truck.add(wheelFL, wheelFR, wheelBL1, wheelBR1, wheelBL2, wheelBR2);
    
    truck.userData.type = 'ramp_truck';
    truck.userData.speed = 1.0 + Math.random() * 0.2;
    truck.userData.rampMesh = ramp;
    return truck;
}

function createDebris(position){
    const debrisCount = 5 + Math.floor(Math.random() * 5);
    const debrisMaterial = new THREE.MeshBasicMaterial({color:0x555555});
    const debrisGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    for(let i = 0; i < debrisCount; i++){
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial.clone());
        debris.position.copy(position);
        debris.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5);
        debris.userData.life = 1.5;
        debrisParticles.push(debris);
        scene.add(debris);
    }
}

function updateDebris(deltaTime){
    for(let i = debrisParticles.length - 1; i >= 0; i--){
        const debris = debrisParticles[i]; debris.userData.life -= deltaTime * 1.5;
        if(debris.userData.life <= 0){ scene.remove(debris); debrisParticles.splice(i, 1);
        } else {
            debris.position.add(debris.userData.velocity.clone().multiplyScalar(deltaTime));
            debris.material.opacity = debris.userData.life; debris.material.transparent = true;
        }
    }
}

function createBulletSparks(targetObject) {
    const sparkCount = 3 + Math.floor(Math.random() * 3);
    const sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true });
    const sparkGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    const targetBox = new THREE.Box3().setFromObject(targetObject);
    const targetSize = targetBox.getSize(new THREE.Vector3());
    for (let i = 0; i < sparkCount; i++) {
        const spark = new THREE.Mesh(sparkGeometry, sparkMaterial.clone());
        const randomPos = new THREE.Vector3((Math.random() - 0.5) * targetSize.x, (Math.random() - 0.5) * targetSize.y, (Math.random() - 0.5) * targetSize.z);
        spark.position.copy(targetObject.position).add(randomPos); spark.userData.velocity = randomPos.normalize().multiplyScalar(2); spark.userData.life = 0.3;
        bulletSparks.push(spark); scene.add(spark);
    }
}

function updateBulletSparks(deltaTime) {
    for (let i = bulletSparks.length - 1; i >= 0; i--) {
        const spark = bulletSparks[i]; spark.userData.life -= deltaTime;
        if (spark.userData.life <= 0) { scene.remove(spark); bulletSparks.splice(i, 1);
        } else {
            spark.position.add(spark.userData.velocity.clone().multiplyScalar(deltaTime));
            spark.material.opacity = spark.userData.life / 0.3;
        }
    }
}

function updatePoliceAI(deltaTime) {
    if (!policeCar || !canBeCaught || isRampJumpingCinematic) return;
    if (policeDisableTimer > 0) {
        const targetZ = player.position.z + 150; 
        const targetPosition = new THREE.Vector3(player.position.x, policeCar.position.y, targetZ);
        policeCar.position.lerp(targetPosition, 0.02); return; 
    }
    policeCar.userData.aiTimer -= deltaTime;
    let targetZ, alpha = 0.08; 
    switch(policeCar.userData.aiState) {
        case 'following':
            targetZ = player.position.z + 15 + Math.sin(gameTime) * 3; alpha = 0.05;
            if (policeCar.userData.aiTimer <= 0) { policeCar.userData.aiState = 'preparing'; policeCar.userData.aiTimer = 1.5; }
            break;
        case 'preparing':
             targetZ = player.position.z + 25; alpha = 0.03;
             if (policeCar.userData.aiTimer <= 0) { policeCar.userData.aiState = 'ramming'; policeCar.userData.aiTimer = 2; }
            break;
        case 'ramming':
            targetZ = player.position.z + 3; alpha = 0.15;
            if (policeCar.userData.aiTimer <= 0) { policeCar.userData.aiState = 'following'; policeCar.userData.aiTimer = Math.random() * 4 + 5; }
            break;
    }
    const targetPosition = new THREE.Vector3(player.position.x, policeCar.position.y, targetZ);
    policeCar.position.lerp(targetPosition, alpha);
    const policeBoundingBox = new THREE.Box3().setFromObject(policeCar);
    const playerBoundingBox = new THREE.Box3().setFromObject(player);
    if (policeBoundingBox.intersectsBox(playerBoundingBox) && policeCar.position.z < player.position.z + 5) {
        if (clock.elapsedTime - lastPoliceHitTime > 1.0) {
            takeDamage(15, "YAKALANDIN"); 
            lastPoliceHitTime = clock.elapsedTime; shakeCamera(0.4); 
            player.position.z -= 0.5; policeCar.position.z += 1.0; speed *= 0.7;
            policeCar.userData.aiState = 'following'; policeCar.userData.aiTimer = Math.random() * 4 + 5;
        }
    }
}

function updateCamera(){ 
    if (!player || isIntroPlaying) return;

    if (missionState.status === 'pickupCinematic') {
        const targetPos = new THREE.Vector3(player.position.x, player.position.y + 3, player.position.z - 8);
        camera.position.lerp(targetPos, 0.05);
        if(julieNPC) camera.lookAt(julieNPC.position);
        return;
    }

    if (missionState.status === 'dropoffCinematic') {
        const targetPos = new THREE.Vector3(player.position.x - 25, player.position.y + 5, player.position.z);
        camera.position.lerp(targetPos, 0.05);
        if (hotelSign) camera.lookAt(hotelSign.position);
        else camera.lookAt(player.position);
        return;
    }

    if (isRampJumpingCinematic) {
        camera.position.lerp(cinematicRampCameraPos, 0.05);
        const lookAtTarget = new THREE.Vector3(player.position.x, player.position.y + 2.0, player.position.z);
        camera.lookAt(lookAtTarget);
        return;
    }

    const speedFactor = Math.min(speed / 5.5, 1.0); const cameraTarget = new THREE.Vector3();
    cameraTarget.x = player.position.x * 0.6; 
    cameraTarget.y = player.position.y + 12 - (speedFactor * 2); 
    cameraTarget.z = player.position.z + 25 - (speedFactor * 5);
    camera.position.lerp(cameraTarget, 0.08); 
    const lookAtTarget = new THREE.Vector3(player.position.x, player.position.y + 2.0, player.position.z);
    camera.lookAt(lookAtTarget);
}


function updateStarsUI(){ for(let i = 1; i <= 5; i++) document.getElementById(`star-${i}`).innerHTML = (i <= wantedLevel) ? STAR_FILLED_SVG : STAR_EMPTY_SVG; }

function updateBoostUI() {
    const accelBtn = document.getElementById('accel-btn');
    if (isBoostAvailable) { accelBtn.innerHTML = 'IVME'; accelBtn.style.fontSize = '18px'; } 
    else { accelBtn.innerHTML = '&uarr;'; accelBtn.style.fontSize = '38px'; }
}

function showSpeechBubble(character, message, custom_duration=2500) {
    const bubbleId = `${character}-speech-bubble`;
    const bubble = document.getElementById(bubbleId); 
    if (!bubble || bubble.classList.contains('visible')) return;
    
    let finalMessage = message;
    if (!finalMessage) {
        if (character === 'player') finalMessage = playerPhrases[Math.floor(Math.random() * playerPhrases.length)];
        else if (character === 'police') finalMessage = policePhrases[Math.floor(Math.random() * policePhrases.length)];
        else if (character === 'julie') finalMessage = julieScaredPhrases[Math.floor(Math.random() * julieScaredPhrases.length)];
    }
    
    bubble.innerHTML = turkishToEnglish(finalMessage).replace('?', '&#x1F618;');
    bubble.style.display = 'block'; 
    setTimeout(() => bubble.classList.add('visible'), 10);
    
    setTimeout(() => { 
        bubble.classList.remove('visible'); 
        setTimeout(() => bubble.style.display = 'none', 300); 
    }, custom_duration);
}

function showSubtitle(text, duration) {
    const subtitleBar = document.getElementById('subtitle-bar');
    if (!subtitleBar) return;
    if (subtitleTimeout) clearTimeout(subtitleTimeout);

    subtitleBar.innerText = turkishToEnglish(text);
    subtitleBar.classList.add('visible');

    subtitleTimeout = setTimeout(() => {
        subtitleBar.classList.remove('visible');
    }, duration);
}

function setupControls(){
    const accelBtn = document.getElementById('accel-btn');
    const brakeBtn = document.getElementById('brake-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    const triggerBoost = () => {
         if (isBoostAvailable) {
            isBoosting = true; isBoostAvailable = false; boostTimeRemaining = BOOST_DURATION;
            policeDisableTimer = POLICE_BOOST_DISABLE_DURATION; cleanDrivingTime = 0; updateBoostUI();
        }
    }
    
    const onKeyDown = e => { 
        if (isIntroPlaying || missionState.status.includes('Cinematic')) return;
        if(e.code === 'ArrowUp') {
            if(!isAccelerating && clock){
                const now = clock.getElapsedTime();
                if (now - lastKeyUpTime < 0.3) { triggerBoost(); }
            }
            isAccelerating = true;
        }
        if(e.code === 'ArrowDown') isBraking = true; 
        if(e.code === 'ArrowLeft') isTurningLeft = true; 
        if(e.code === 'ArrowRight') isTurningRight = true; 
    };
    const onKeyUp = e => { 
        if (isIntroPlaying || missionState.status.includes('Cinematic')) return;
        if(e.code === 'ArrowUp') {
            isAccelerating = false;
            if(clock) lastKeyUpTime = clock.getElapsedTime();
        }
        if(e.code === 'ArrowDown') isBraking = false; 
        if(e.code === 'ArrowLeft') isTurningLeft = false; 
        if(e.code === 'ArrowRight') isTurningRight = false; 
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const handleAccelStart = () => {
        if (isIntroPlaying || missionState.status.includes('Cinematic')) return;
        isAccelerating = true; if (!clock) return; const now = clock.getElapsedTime();
        if (now - lastAccelTapTime < 0.3) { triggerBoost(); } 
        lastAccelTapTime = now;
    };
    const handleAccelEnd = () => { 
        if (isIntroPlaying || missionState.status.includes('Cinematic')) return;
        isAccelerating = false; lastAccelTapTime = clock.getElapsedTime(); 
    };

    const addTouchListeners = (element, startCallback, endCallback) => {
        const onStart = e => { e.preventDefault(); if (isIntroPlaying || missionState.status.includes('Cinematic')) return; startCallback(); };
        const onEnd = e => { e.preventDefault(); if (isIntroPlaying || missionState.status.includes('Cinematic')) return; endCallback(); };
        element.addEventListener('touchstart', onStart, { passive: false });
        element.addEventListener('touchend', onEnd);
        element.addEventListener('mousedown', onStart); 
        element.addEventListener('mouseup', onEnd); 
        element.addEventListener('mouseleave', onEnd);
    };

    addTouchListeners(accelBtn, handleAccelStart, handleAccelEnd);
    addTouchListeners(brakeBtn, () => isBraking = true, () => isBraking = false);
    addTouchListeners(leftBtn, () => isTurningLeft = true, () => isTurningLeft = false);
    addTouchListeners(rightBtn, () => isTurningRight = true, () => isTurningRight = false);
}

async function generateMission() {
    if (missionHideTimeout) clearTimeout(missionHideTimeout);
    const missionContainer = document.getElementById('mission-container');
    const missionText = document.getElementById('mission-text');
    const missionBtn = document.getElementById('generate-mission-btn');
    missionBtn.disabled = true; 
    missionText.innerText = turkishToEnglish("Yeni görev oluşturuluyor...");
    missionBtn.innerHTML = turkishToEnglish('✨ Bekleyin...');
    const prompt = `Vice City benzeri bir şehirde geçen bir polis kovalamaca oyunu için kısa ve heyecan verici bir görev hedefi oluştur. Oyuncu kaçan kişidir. Görev tek bir cümle olmalı ve Türkçe olmalı. Yıkılabilir heykeller veya aydınlatma direkleri gibi yeni oyun mekaniklerini de içerebilir.
    Örnekler:
    - 2 dakikadan az sürede 50.000 dolarlık mülk hasarı ver.
    - Canın %50'nin altına düşmeden Şehir Merkezi'ne ulaş.
    - Şehirdeki 3 heykeli yok et.
    - 5 aydınlatma direğini devir.
    - Polis arabasını 5 başka araca çarptırarak büyük bir kaza yaptır.
    Şimdi yeni ve benzersiz bir görev oluştur:`;
    const newMission = await callGemini(prompt);
    missionText.innerText = turkishToEnglish(newMission);
    missionBtn.disabled = false;
    missionBtn.innerHTML = turkishToEnglish('✨ Yeni Görev Al');
    if (!missionContainer.classList.contains('visible')) {
         missionContainer.style.display = 'flex';
         setTimeout(() => missionContainer.classList.add('visible'), 10);
    }
    missionHideTimeout = setTimeout(() => {
        missionContainer.classList.remove('visible');
        missionContainer.addEventListener('transitionend', () => { if (!missionContainer.classList.contains('visible')) missionContainer.style.display = 'none' }, { once: true });
    }, 4000);
}

async function generateRadioChatter() {
    const tickerBar = document.getElementById('radio-ticker-bar');
    const tickerText = document.getElementById('radio-ticker-text');
    if (!tickerBar || !tickerText || !player || tickerBar.classList.contains('visible')) return;
    const locations = ["Ocean Drive", "Downtown", "Little Havana", "Starfish Island", "Viceport"];
    const currentLocation = locations[Math.floor(Math.random() * locations.length)];
    const speedKph = Math.floor(speed * 30);
    const prompt = `Bir araba kovalamaca oyunu için kısa ve gerçekçi bir polis telsizi anonsu oluştur. Mesaj Türkçe olmalı ve en fazla iki kısa cümleden oluşmalı.
    Bağlam: Aranma seviyesi: ${wantedLevel} yıldız. Hız: yaklaşık ${speedKph} km/s. Konum: ${currentLocation}. Araç: Kırmızı spor araba.
    Örnek: "Merkez, şüpheli ${currentLocation} bölgesinde güneye ilerliyor. Teyit edildi, takipteyiz."
    Yeni bir anons oluştur:`;
    const chatter = await callGemini(prompt);
    tickerText.innerText = `[TELSIZ]: ${turkishToEnglish(chatter)}`;
    tickerBar.classList.add('visible');
    tickerText.style.animation = 'none';
    tickerText.offsetHeight; 
    tickerText.style.animation = 'ticker-scroll 15s linear';
    setTimeout(() => { tickerBar.classList.remove('visible'); }, 14500);
}

function createStatue() {
    const statue = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    statue.add(base);
    const bodyGeo = new THREE.BoxGeometry(1, 4, 1);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xAAAAAA, shininess: 100 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.25;
    statue.add(body);
    statue.castShadow = true;
    statue.userData.isStatue = true;
    statue.userData.isHit = false;
    return statue;
}

function updateFallingObjects(deltaTime) {
    for (let i = streetLights.length - 1; i >= 0; i--) {
        const light = streetLights[i];
        if (light.userData.isFalling && light.userData.fallRotation < Math.PI / 2) {
            light.userData.fallRotation += deltaTime * 2;
            light.rotation.x = light.userData.fallRotation;
            if(policeCar) {
                 const polePart = light.children[0];
                 const poleBox = new THREE.Box3().setFromObject(polePart);
                 poleBox.applyMatrix4(light.matrixWorld);
                 const policeBox = new THREE.Box3().setFromObject(policeCar);
                 if(poleBox.intersectsBox(policeBox)) {
                     if(!light.userData.hasDamagedPolice) {
                        policeCar.userData.health -= 35;
                        createBulletSparks(policeCar);
                        light.userData.hasDamagedPolice = true;
                        if(policeCar.userData.health <= 0) {
                            createDebris(policeCar.position);
                            scene.remove(policeCar); policeCar = null;
                        }
                     }
                 }
            }
        }
    }
}

function updateDayCycle(deltaTime) {
    currentCycleTime = (currentCycleTime + deltaTime) % dayCycleTime;
    const currentPhaseIndex = Math.floor(currentCycleTime / phaseDuration);
    const nextPhaseIndex = (currentPhaseIndex + 1) % dayCyclePhases.length;
    const alpha = (currentCycleTime % phaseDuration) / phaseDuration;
    const currentParams = dayCycleParameters[dayCyclePhases[currentPhaseIndex]];
    const nextParams = dayCycleParameters[dayCyclePhases[nextPhaseIndex]];
    scene.background.lerpColors(currentParams.background, nextParams.background, alpha);
    scene.fog.color.lerpColors(currentParams.fog, nextParams.fog, alpha);
    scene.fog.near = THREE.MathUtils.lerp(currentParams.fogNear, nextParams.fogNear, alpha);
    scene.fog.far = THREE.MathUtils.lerp(currentParams.fogFar, nextParams.fogFar, alpha);
    hemiLight.color.lerpColors(currentParams.hemiSky, nextParams.hemiSky, alpha);
    hemiLight.groundColor.lerpColors(currentParams.hemiGround, nextParams.hemiGround, alpha);
    dirLight.color.lerpColors(currentParams.dirLight, nextParams.dirLight, alpha);
    dirLight.intensity = THREE.MathUtils.lerp(currentParams.dirIntensity, nextParams.dirIntensity, alpha);
    let normalizedDayBrightness = (dirLight.intensity - 0.6) / (1.2 - 0.6);
    normalizedDayBrightness = Math.max(0, Math.min(1, normalizedDayBrightness));
    const streetLightGlowFactor = 1.0 - normalizedDayBrightness;
    streetLights.forEach(lightGroup => {
        if(lightGroup.userData.isHit) return;
        const isNightTime = dayCyclePhases[currentPhaseIndex] === 'NIGHT' || dayCyclePhases[currentPhaseIndex] === 'EVENING';
        const bulb = lightGroup.children.find(child => child instanceof THREE.PointLight); 
        const emissiveBulb = lightGroup.children.find(child => child.material && child.material.emissive);
        if (bulb) bulb.intensity = isNightTime ? streetLightGlowFactor * 1.5 : 0;
        if(emissiveBulb) emissiveBulb.material.emissiveIntensity = isNightTime ? streetLightGlowFactor : 0;
    });

    const isNight = dayCyclePhases[currentPhaseIndex] === 'NIGHT' || dayCyclePhases[currentPhaseIndex] === 'EVENING';

    if (player && player.userData.lights) {
        player.userData.lights.headlight1.visible = isNight;
        player.userData.lights.headlight2.visible = isNight;
        player.userData.lights.taillight1.material.emissiveIntensity = isNight ? 1.8 : 0.2;
        player.userData.lights.taillight2.material.emissiveIntensity = isNight ? 1.8 : 0.2;
    }

    if (policeCar && policeCar.userData.lights) {
        policeCar.userData.lights.headlight1.visible = isNight;
        policeCar.userData.lights.headlight2.visible = isNight;
        policeCar.userData.lights.taillight1.material.emissiveIntensity = isNight ? 1.5 : 0.2;
        policeCar.userData.lights.taillight2.material.emissiveIntensity = isNight ? 1.5 : 0.2;
    }

    trafficCars.forEach(car => {
        if (car.userData.lights) {
            if (car.userData.type === 'ambulance') {
                const time = clock.getElapsedTime() * 5; 
                car.userData.lights.roofLight1.material.emissiveIntensity = Math.sin(time) > 0 ? 1.0 : 0.0; 
                car.userData.lights.roofLight2.material.emissiveIntensity = Math.sin(time) < 0 ? 1.0 : 0.0;
                car.userData.lights.roofLight1.visible = isNight;
                car.userData.lights.roofLight2.visible = isNight;
            }

            car.userData.lights.headlight1.visible = isNight;
            car.userData.lights.headlight2.visible = isNight;
            car.userData.lights.taillight1.material.emissiveIntensity = isNight ? 1.0 : 0.2;
            car.userData.lights.taillight2.material.emissiveIntensity = isNight ? 1.0 : 0.2;
        }
    });
}

function createRoadAndSidewalks() { 
    road = new THREE.Group();
    const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 20 }); 
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
    const sidewalkMaterial = new THREE.MeshPhongMaterial({color:0xd2b48c});
    const beachMaterial = new THREE.MeshPhongMaterial({color:0xf2d16b});
    const oceanMaterial = new THREE.MeshPhongMaterial({color:0x0066cc, transparent:true, opacity:0.8});
    
    const groundTexture = createGroundTexture();
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ map: groundTexture });

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

    for (let i = 0; i < 40; i++) createBuilding(ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 10 + Math.random() * 50, Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2);
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
        const carTexture = createParkedCarTexture();
        const carMat = new THREE.MeshBasicMaterial({ map: carTexture, transparent: true });
        const carGeo = new THREE.PlaneGeometry(5, 2.5);
        const parkedCar = new THREE.Mesh(carGeo, carMat);
        
        const xPos = ROAD_WIDTH / 2 + SIDEWALK_WIDTH * 0.7;
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        parkedCar.position.set(xPos, 1.2, zPos);
        parkedCar.rotation.y = -Math.PI / 2;
        parkedCars.push(parkedCar);
        scene.add(parkedCar);
    }

    for (let i = 0; i < 40; i++) {
        const towel = createBeachDetail('towel');
        const xPos = -ROAD_WIDTH / 2 - SIDEWALK_WIDTH - Math.random() * 90;
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        towel.position.set(xPos, 0.1, zPos);
        beachDetails.push(towel);
        scene.add(towel);
    }
}

function createPalmTree(x, z) {
    const palm = new THREE.Group();
    const trunkHeight = 12 + Math.random() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, trunkHeight, 8), new THREE.MeshPhongMaterial({ color: 0x4a3728, flatShading: true }));
    trunk.position.y = trunkHeight / 2; trunk.castShadow = true; palm.add(trunk);
    const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x0f8a5f, flatShading: true, side: THREE.DoubleSide });
    for (let i = 0; i < 10; i++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5, 1, 1), leafMaterial);
        leaf.castShadow = true; leaf.position.y = trunkHeight;
        leaf.rotation.y = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
        leaf.rotation.x = Math.PI / 4 + Math.random() * 0.2;
        palm.add(leaf);
    }
    palm.position.set(x, 0, z); palmTrees.push(palm); scene.add(palm);
}

function createStreetLights() {
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.0 });
    const spacing = 150;
    for (let i = 0; i < TOTAL_LENGTH / spacing; i++) {
        [-1, 1].forEach(side => {
            const lightGroup = new THREE.Group();
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8), poleMaterial);
            pole.position.y = 4;
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4), bulbMaterial.clone());
            const light = new THREE.PointLight(0xffd700, 1, 30, 2);
            bulb.position.y = 8.2;
            light.position.y = 8;
            lightGroup.add(pole, bulb, light);
            lightGroup.position.set((ROAD_WIDTH / 2 + 2) * side, 0, i * spacing - TOTAL_LENGTH / 2);
            lightGroup.castShadow = true;
            lightGroup.userData = { isStreetlight: true, isHit: false, isFalling: false };
            streetLights.push(lightGroup); scene.add(lightGroup);
        });
    }
}

function createRain() {
    const vertices = [];
    for (let i = 0; i < 15000; i++) vertices.push(THREE.MathUtils.randFloatSpread(50), THREE.MathUtils.randFloat(0, 50), THREE.MathUtils.randFloatSpread(50));
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    rain = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.1, transparent: true }));
    rain.visible = false; scene.add(rain);
}

function toggleRain(state) {
    isRaining = state; rain.visible = state;
    const wetRoadColor = new THREE.Color(0x222222); const dryRoadColor = new THREE.Color(0x808080);
    road.children.forEach(segment => {
        segment.material.color = state ? wetRoadColor : dryRoadColor;
        segment.material.shininess = state ? 80 : 10;
        segment.material.needsUpdate = true;
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

// --- GÖREV SİSTEMİ FONKSİYONLARI (Yeniden Düzenlendi) ---

function setupMission1Objects() {
    // --- DEĞİŞİKLİK --- Sadece otel tabelası başlangıçta oluşturulur.
    // Diğer nesneler görev başladığında dinamik olarak oluşturulacak.
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
    missionState.cinematicTimer = 6; // Sinematik süresi
    showSubtitle("General'in kizi tehlikede! Onu kurtar!", 4000);

    // Polisleri temizle ve müziği değiştir
    if(policeCar) scene.remove(policeCar);
    policeCar = null;
    if(sounds.siren && sounds.siren.playing()) sounds.siren.stop();
    // İstersen burada görev müziği başlatabilirsin.

    // --- YENİ --- Julie'yi dinamik olarak oyuncunun önüne oluştur
    julieNPC = createPedestrian(true);
    const julieX = player.position.x > 0 ? (ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2) : (-ROAD_WIDTH / 2 - SIDEWALK_WIDTH / 2);
    julieNPC.position.set(julieX, 1.2, player.position.z - 60);
    pedestrians.push(julieNPC);
    scene.add(julieNPC);

    // Sinematik hedefi ayarla (arabanın duracağı yer)
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
            // Aracı otomatik olarak Julie'nin yanına sür
            player.position.lerp(missionState.cinematicTarget, 0.02);
            speed = Math.max(0, speed * 0.98); // Yavaşça durdur

            missionState.cinematicTimer -= deltaTime;
            if (missionState.cinematicTimer <= 2 && julieNPC && julieNPC.parent === scene) {
                scene.remove(julieNPC); 
                pedestrians = pedestrians.filter(p => !p.userData.isJulie);
                julieNPC = null;
            }
            if (missionState.cinematicTimer <= 0) {
                missionState.status = 'drivingWithJulie';
                missionState.julieChatterTimer = 5; // İlk konuşma 5 sn sonra
                showSubtitle("Onu 10000 skora ulasana kadar koru!", 5000);

                // Polis takibini başlat
                canBeCaught = true;
                wantedLevel = 2;
                updateStarsUI();
            }
            break;

        case 'drivingWithJulie':
            // Julie'nin periyodik konuşmaları
            missionState.julieChatterTimer -= deltaTime;
            if(missionState.julieChatterTimer <= 0){
                showSpeechBubble('julie', ''); // Rastgele korku ifadesi secer
                missionState.julieChatterTimer = 8 + Math.random() * 5; // 8-13 saniye arasi tekrar konus
            }
            
            // Görev bitişini kontrol et
            if(score >= 10000){
                missionState.status = 'dropoffCinematic';
                missionState.cinematicTimer = 8;
                showSubtitle("Otel! Burasi guvenli olmali.", 4000);
                // En yakın otelin önüne gitmek için hedefi ayarla
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
                wantedLevel = 0; // Polis takibini bitir
                updateStarsUI();
            }
            break;
    }
}

function initializeGame() { 
    try {
        clock = new THREE.Clock(); scene = new THREE.Scene();
        
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000); 
        isIntroPlaying = true;
        cinematicCameraTarget = new THREE.Vector3();

        renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true }); 
        renderer.setSize(window.innerWidth, window.innerHeight); renderer.shadowMap.enabled = true;
        scene.background = dayCycleParameters.NIGHT.background.clone();
        scene.fog = new THREE.Fog(dayCycleParameters.NIGHT.fog.clone(), dayCycleParameters.NIGHT.fogNear, dayCycleParameters.NIGHT.fogFar);
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
        updateHealth();

        camera.position.set(player.position.x + 10, player.position.y + 4, player.position.z + 10);
        camera.lookAt(player.position);

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

    // Görev mantığını her frame'de güncelle
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
            light.visible = Math.sin(clock.getElapsedTime() * 8) > 0;
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
                playerHealth = Math.min(100, playerHealth + 10);
                car.userData.healedPlayer = true;
                updateHealth();
                showSpeechBubble('player', '+10 Can!');
                if (sounds.heal_sound) sounds.heal_sound.play();
            }
        }
    });

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

window.addEventListener('DOMContentLoaded', () => { 
    loadSounds();
    loadAssets(); 
    setupGameStart(); 
});
