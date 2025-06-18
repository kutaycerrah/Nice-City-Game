import * as THREE from 'three';

function turkishToEnglish(text) {
    if (typeof text !== 'string') return text;
    const map = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
    };
    return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, m => map[m] || m);
}
const SPEECH_BUBBLE_INTERVAL = 15;
const ROAD_WIDTH = 20, SIDEWALK_WIDTH = 5, SEGMENT_LENGTH = 1000, SEGMENT_COUNT = 3, TOTAL_LENGTH = 3 * SEGMENT_LENGTH;
const POLICE_BOOST_DISABLE_DURATION = 20;
const POLICE_RAM_COOLDOWN = 10;
const STAR_EMPTY_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;
const STAR_FILLED_SVG = `<svg viewBox="0 0 24 24" fill="#FFC700" stroke="#FDB813" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;
const FALLBACK_MISSIONS = [ "Polise yakalanmadan 2 dakika boyunca hayatta kal.", "Canin %50'nin altina dusmeden Sehir Merkezi'ne ulas.", "Sehirdeki 3 heykeli yok et.", "Trafikteki 5 araca carparak kaos yarat.", "Polis arabasini 3 baska araca carptirarak buyuk bir kaza yaptir.", "Okyanus Kenari yolunda 30 saniye boyunca son surat ilerle." ].map(turkishToEnglish);
const FALLBACK_CHATTER = [ "Merkez, supheli Ocean Drive'da guneye dogru ilerliyor.", "Tum birimlere: Kirmizi spor araba takibe alindi, destek bekleniyor.", "Supheli Downtown bolgesinde goruldu, asiri hiz yapiyor.", "Dikkat, supheli tehlikeli manevralar yapiyor. Dikkatli yaklasin.", "Takip devam ediyor, supheli Starfish Adasi'na yoneldi." ].map(turkishToEnglish);
const BUILDING_TYPES = [ { type: 'shop', minFloors: 1, maxFloors: 2 }, { type: 'apartment', minFloors: 3, maxFloors: 8 }, { type: 'hotel', minFloors: 9, maxFloors: 15 } ];
const NEON_COLORS = [0xff00ff, 0x00ffff, 0x54fcfd, 0xf72119, 0x00ff7f, 0xff89f3];
const WINDOW_LIGHT_COLORS = [0xffffee, 0xffd8b1, 0xcce4ff];
const TRAFFIC_CAR_COLORS = [0xAAAAAA, 0xDDDDDD, 0x333333, 0x800000, 0x003300, 0xC0C0C0, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFA500, 0x800080, 0x008080, 0xFF4500, 0xDA70D6, 0x4B0082, 0xADFF2F, 0x00FFFF];
const VICE_CITY_COLORS = [0x69d2e7, 0xa7dbd8, 0xe0e4cc, 0xf38630, 0xfa6900, 0xff4e50, 0xf9d423, 0xf8b195, 0xc06c84];
const dayCycleParameters = { NIGHT:     { background: new THREE.Color(0x1a2a4a), fog: new THREE.Color(0x3a4a6a), hemiSky: new THREE.Color(0xcceeff), hemiGround: new THREE.Color(0x556688), dirLight: new THREE.Color(0xffffff), dirIntensity: 0.6, fogNear: 500, fogFar: 2500 }, MORNING:   { background: new THREE.Color(0xf7b267), fog: new THREE.Color(0xe5989b), hemiSky: new THREE.Color(0xf7b267), hemiGround: new THREE.Color(0xc06c84), dirLight: new THREE.Color(0xffaa00), dirIntensity: 0.8, fogNear: 450, fogFar: 2000 }, PRE_NOON:  { background: new THREE.Color(0x87ceeb), fog: new THREE.Color(0xa0dae9), hemiSky: new THREE.Color(0xadd8e6), hemiGround: new THREE.Color(0xa9a9a9), dirLight: new THREE.Color(0xffffff), dirIntensity: 1.0, fogNear: 400, fogFar: 1600 }, NOON:      { background: new THREE.Color(0x87ceeb), fog: new THREE.Color(0xa0dae9), hemiSky: new THREE.Color(0xffffff), hemiGround: new THREE.Color(0xcccccc), dirLight: new THREE.Color(0xffffff), dirIntensity: 1.2, fogNear: 350, fogFar: 1500 }, AFTERNOON: { background: new THREE.Color(0xa0d8e9), fog: new THREE.Color(0xb0c7db), hemiSky: new THREE.Color(0xf5f5dc), hemiGround: new THREE.Color(0xb0c7db), dirLight: new THREE.Color(0xffdd88), dirIntensity: 0.9, fogNear: 400, fogFar: 1800 }, EVENING:   { background: new THREE.Color(0xff4e50), fog: new THREE.Color(0xff8c42), hemiSky: new THREE.Color(0xff6f61), hemiGround: new THREE.Color(0x6b5b95), dirLight: new THREE.Color(0xff6600), dirIntensity: 0.7, fogNear: 480, fogFar: 2200 } };
const dayCyclePhases = ['NIGHT', 'MORNING', 'PRE_NOON', 'NOON', 'AFTERNOON', 'EVENING'];
const dayCycleTime = 120; const phaseDuration = dayCycleTime / dayCyclePhases.length;
let currentCycleTime = 0; const MENU_VOLUME = 0.6; const RADIO_VOL_MAX = 0.6; const RADIO_VOL_MIN = 0.3; const ENGINE_VOL_MAX = 0.4; const ENGINE_VOL_MIN = 0.1; const SIREN_VOLUME = 0.5;
let scene, camera, renderer, clock; let player, policeCar = null, sirenLightRed, sirenLightBlue, road; let sounds;
let roadLines = [], buildings = [], palmTrees = [], guardRails = [], trafficCars = [], streetLights = [], statues = [], debrisParticles = [], rain, bulletSparks = [];
let hemiLight, dirLight; let speed = 0, score = 0, wantedLevel = 0, playerHealth = 100, trafficDifficultyLevel = 0;
let isGameOver = false, canBeCaught = false, isRaining = false, isRadioPlaying = false;
let isAccelerating = false, isBraking = false, isTurningLeft = false, isTurningRight = false;
let lastPoliceShotTime = 0, wantedLevelCooldown = 0, lastPoliceHitTime = 0, isCrashSoundPlaying = false;
let beach, ocean, sidewalkLeft, sidewalkRight, buildingGround; let pedestrians = [];
const PEDESTRIAN_SKIN_COLORS = ['#f2d5b1', '#c68642', '#8d5524', '#f5cba7', '#a16e4b'];
const PEDESTRIAN_SHIRT_COLORS = [0x69d2e7, 0xa7dbd8, 0xf38630, 0xfa6900, 0xff4e50, 0xf9d423, 0xf8b195, 0xc06c84, 0xffffff, 0x333333];
const PEDESTRIAN_PANTS_COLORS = [0x004d80, 0x333333, 'beige', 0x654321, 0x444444];
let flyingDebris = []; let parkedCars = [], beachDetails = [], cityDecorations = [];
let isIntroPlaying = true; let cinematicCameraTarget; let isRampJumpingCinematic = false; let rampJumpCinematicTimer = 0;
let cinematicRampCameraPos = new THREE.Vector3();
let missionState = { status: 'inactive', cinematicTimer: 0, julieChatterTimer: 0, cinematicTarget: null };
let julieNPC; let hotelSign; let subtitleTimeout = null;
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
    const apiKey = "";
    if (!apiKey) {
        console.warn("Gemini API anahtarı ayarlanmamış. Yedek metinler kullanılacak.");
        return isMissionPrompt ? FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)] : FALLBACK_CHATTER[Math.floor(Math.random() * FALLBACK_CHATTER.length)];
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { throw new Error(`API call failed with status: ${response.status}`); }
        const result = await response.json();
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
            return result.candidates[0].content.parts[0].text.trim();
        } else {
            throw new Error("API yanıtında geçerli bir aday bulunamadı.");
        }
    } catch (error) {
        console.error("Gemini API çağrı hatası:", error.message);
        return isMissionPrompt ? FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)] : FALLBACK_CHATTER[Math.floor(Math.random() * FALLBACK_CHATTER.length)];
    }
}

function displayError(e) {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
        errorDisplay.style.display = 'flex';
        errorDisplay.innerHTML = `<h1>OYUN HATASI!</h1><p>Üzgünüz, oyunda beklenmedik bir hata oluştu.</p><p><strong>Hata Adı:</strong> ${e.name}</p><p><strong>Mesaj:</strong> ${e.message}</p><hr><p><strong>Teknik Detay (Stack Trace):</strong></p><pre>${e.stack}</pre>`;
    }
}

function loadSounds() {
    sounds = {
        engine: new Howl({ src: ['sound/engine_sound.ogg'], loop: true, volume: ENGINE_VOL_MIN, html5: true }),
        crash: new Howl({ src: ['sound/crash.ogg'], volume: 0.5 }),
        siren: new Howl({ src: ['sound/police_sound.ogg'], loop: true, volume: SIREN_VOLUME }),
        radio: new Howl({ src: ['sound/Vice City Geceleri.mp3'], loop: true, volume: MENU_VOLUME, html5: true }),
        heal_sound: new Howl({ src: ['sound/spell_heal.ogg'], volume: 0.7 })
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
            sounds.radio.play();
            isRadioPlaying = true;
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

function onWindowResize() { if (camera) { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); } if (renderer) { renderer.setSize(window.innerWidth, window.innerHeight); } }
function createWorld() { createRoadAndSidewalks(); createRoadLines(); createStreetLights(); createPlayer(); createRain(); createScenery(); }

function createPlayer() {
    player = new THREE.Group();
    const bodyCanvas = document.createElement('canvas');
    bodyCanvas.width = 256;
    bodyCanvas.height = 256;
    const bodyCtx = bodyCanvas.getContext('2d');
    bodyCtx.fillStyle = '#D40000';
    bodyCtx.fillRect(0, 0, 256, 256);
    bodyCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    bodyCtx.fillRect(108, 0, 40, 256);
    const bodyTexture = new THREE.CanvasTexture(bodyCanvas);
    const windowCanvas = document.createElement('canvas');
    windowCanvas.width = 64;
    windowCanvas.height = 64;
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
    mainBody.position.y = 0.6;
    mainBody.castShadow = true;
    player.add(mainBody);
    const frontHood = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 2.0), bodyMaterial);
    frontHood.position.set(0, 0.7, -3.0);
    player.add(frontHood);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.5), bodyMaterial);
    cabin.position.set(0, 1.0, 0.5);
    player.add(cabin);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.1), windowMaterial);
    windshield.position.set(0, 1.2, -0.7);
    player.add(windshield);
    const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.1), windowMaterial);
    rearWindow.position.set(0, 1.2, 1.7);
    player.add(rearWindow);
    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 2.0), bodyMaterial);
    rearDeck.position.set(0, 0.7, 3.0);
    player.add(rearDeck);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.6), secondaryMaterial);
    spoiler.position.set(0, 1.0, 4.2);
    player.add(spoiler);
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 0.2), secondaryMaterial);
    diffuser.position.set(0, 0.2, 3.0);
    player.add(diffuser);
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
    mainBody.position.y = 0.7;
    policeCar.add(mainBody);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.6, 2.5), bodyMaterial);
    cabin.position.set(0, 1.3, -0.3);
    policeCar.add(cabin);
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.65), windowMaterial);
    windshield.position.set(0, 1.3, -1.55);
    windshield.rotation.x = -Math.PI / 8;
    policeCar.add(windshield);
    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.65), windowMaterial);
    rearWindow.position.set(0, 1.3, 0.95);
    rearWindow.rotation.x = Math.PI / 9;
    policeCar.add(rearWindow);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.0), bodyMaterial);
    hood.position.set(0, 0.65, -2.2);
    policeCar.add(hood);
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1.5), bodyMaterial);
    trunk.position.set(0, 0.6, 2.0);
    policeCar.add(trunk);
    const taillightGeo = new THREE.BoxGeometry(1.2, 0.35, 0.1);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMaterial);
    leftTaillight.position.set(-0.65, 0.7, 2.75);
    policeCar.add(leftTaillight);
    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMaterial);
    rightTaillight.position.set(0.65, 0.7, 2.75);
    policeCar.add(rightTaillight);
    const sirenBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.5), blackTrimMaterial);
    sirenBase.position.set(0, 1.6, -0.3);
    policeCar.add(sirenBase);
    const sirenLightGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    sirenLightRed = new THREE.Mesh(sirenLightGeo, new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0 }));
    sirenLightRed.position.set(-0.3, 1.7, -0.3);
    policeCar.add(sirenLightRed);
    sirenLightBlue = new THREE.Mesh(sirenLightGeo, new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 0 }));
    sirenLightBlue.position.set(0.3, 1.7, -0.3);
    policeCar.add(sirenLightBlue);
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, flatShading: true });
    const createWheel = () => { const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial); wheel.rotation.z = Math.PI / 2; return wheel; };
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
    policeCar.position.set(player.position.x, 0, player.position.z + 50);
    policeCar.rotation.y = Math.PI;
    policeCar.userData.health = 100;
    policeCar.userData.aiState = 'following';
    policeCar.userData.aiTimer = Math.random()
