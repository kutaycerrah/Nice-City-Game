// YEREL KÜTÜPHANE YÜKLENDİ
import * as THREE from './three.module.js';

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
let textureLoader; // YENİ: Doku yükleyici
let loadedTextures = {}; // YENİ: Yüklenen dokuları tutacak obje
let cityWall; // YENİ: Şehir duvarı
let horizonHill; // YENİ: Ufuk tepesi
let niceCitySign; // YENİ: NICE CITY tabelası

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
        errorDisplay.innerHTML = `<h1>OYUN HATASI!</h1><p>Uzgunuz, oyunda beklenmedik bir hata olustu.</p><p><strong>Hata Adi:</strong> ${e.name}</p><p><strong>Mesaj:</strong> <span class="math-inline">\{e\.message\}</p\><hr\><p\><strong\>Teknik Detay \(Stack Trace\)\:</strong\></p\><pre\></span>{e.stack}</pre>`;
    }
}

function loadSounds() {
    sounds = {
        // YEREL SES DOSYASI YOLLARI
        engine: new Howl({ src: ['sounds/engine_sound.ogg'], loop: true, volume: ENGINE_VOL_MIN, html5: true }),
        crash: new Howl({ src: ['sounds/crash.ogg'], volume: 0.5 }),
        siren: new Howl({ src: ['sounds/police_sound.mp3'], loop: true, volume: SIREN_VOLUME }), // DÜZELTİLDİ: .ogg yerine .mp3
        radio: new Howl({ src: ['sounds/Vice City Geceleri.mp3'], loop: true, volume: MENU_VOLUME, html5: true }),
        heal_sound: new Howl({ src: ['sounds/spell_heal.ogg'], volume: 0.7 }) // Bu dosyayı yüklediğinizden emin olun!
    }
}

// YENİ FONKSİYON: Tüm dokuları yükler
function loadGameTextures(callback) {
    const texturesToLoad = {
        player_car_body: 'textures/player_car_body.png',
        player_car_window: 'textures/player_car_window.png',
        car_body_police: 'textures/police_car_body.png',
        road: 'textures/road_asphalt.png',
        sidewalk: 'textures/sidewalk_concrete.png',
        beach: 'textures/sand_beach.png',
        ocean: 'textures/ocean_water.png',
        sky: 'textures/sky_gradient.png', 
        palm_trunk: 'textures/palm_trunk.png',
        palm_leaves: 'textures/palm_leaves.png',
        building_wall_generic: 'textures/building_wall_generic.png', 
        city_wall_base: 'textures/city_wall_base.png',
        parked_car_base: 'textures/parked_car_base.png',
        statue_texture: 'textures/statue_marble.png',
        street_light_pole: 'textures/steel_pole.png',
        street_light_bulb: 'textures/light_bulb.png',
        rain_particle: 'textures/rain_drop.png',
        // Generic car body for traffic cars
        traffic_car_body_generic: 'textures/car_body_default.png' // Default texture for various traffic cars
    };

    const totalTextures = Object.keys(texturesToLoad).length;
    let loadedCount = 0;

    for (const key in texturesToLoad) {
        textureLoader.load(texturesToLoad[key],
            (texture) => {
                loadedTextures[key] = texture;
                loadedCount++;
                // Yükleme çubuğunu burada güncelleyebilirsiniz (opsiyonel)
                // const progress = (loadedCount / totalTextures) * 100;
                // document.getElementById('loading-percentage').innerText = `Dokular Yükleniyor: ${Math.round(progress)}%`;

                if (loadedCount === totalTextures) {
                    callback(); 
                }
            },
            undefined, // onProgress
            (error) => {
                console.error(`Doku yüklenirken hata oluştu: ${texturesToLoad[key]}`, error);
                loadedCount++; 
                if (loadedCount === totalTextures) {
                    callback(); 
                }
            }
        );
    }
}


function loadAssets() {
    // Bu fonksiyonu, loadGameTextures'ın tamamlandığında çalışacak şekilde düzenleyebilirsiniz
    // veya basit bir placeholder olarak bırakabilirsiniz.
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
            // initializeGame çağrısı artık loadGameTextures içinde
            // initializeGame(); 
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

    // CanvasTexture yerine resim dokusu
    const bodyMaterial = new THREE.MeshPhongMaterial({ map: loadedTextures.player_car_body, flatShading: true });
    const secondaryMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, flatShading: true });
    const windowMaterial = new THREE.MeshPhongMaterial({ map: loadedTextures.player_car_window, transparent: true, opacity: 0.8, flatShading: true });

    // OPTİMİZASYON: emissive ve emissiveIntensity kaldırıldı
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

// createPoliceCarTexture fonksiyonu artık kullanılmıyor, kaldırılabilir.
// function createPoliceCarTexture() { ... }

function createPoliceCar() {
    if (policeCar) return;
    policeCar = new THREE.Group();

    // CanvasTexture yerine resim dokusu
    const bodyMaterial = new THREE.MeshPhongMaterial({ map: loadedTextures.car_body_police, flatShading: true });
    
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
        wheel.rotation.z = Math.PI / 2; return wheel; 
    };
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

// createBuildingTexture fonksiyonu artık kullanılmıyor, kaldırılabilir.
// function createBuildingTexture(width, height, floors) { ... }

// createGroundTexture fonksiyonu artık kullanılmıyor, kaldırılabilir.
// function createGroundTexture() { ... }

// createParkedCarTexture fonksiyonu artık kullanılmıyor, kaldırılabilir.
// function createParkedCarTexture() { ... }


function createBuilding(x, z) {
    const bD = BUILDING_TYPES[Math.floor(Math.random() * BUILDING_TYPES.length)];
    const nF = bD.minFloors + Math.floor(Math.random() * (bD.maxFloors - bD.minFloors + 1));
    const bH = nF * 5; const bW = 15 + Math.random() * 5; const bDe = 15 + Math.random() * 5;
    
    // CanvasTexture yerine resim dokusu kullanın ve repeat özelliğini ayarlayın
    const buildingTexture = loadedTextures.building_wall_generic.clone(); // Her bina için yeni bir instance
    buildingTexture.wrapS = THREE.RepeatWrapping;
    buildingTexture.wrapT = THREE.RepeatWrapping;
    buildingTexture.repeat.set(bW / 10, bH / 10); // Dokuyu bina boyutuna göre tekrarla

    const bG = new THREE.BoxGeometry(bW, bH, bDe);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        map: buildingTexture,
        flatShading: true 
    });

    const bMe = new THREE.Mesh(bG, buildingMaterial); bMe.castShadow = true; bMe.receiveShadow = true;
    const bGr = new THREE.Group(); bGr.add(bMe);
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

function moveWorld(currentSpeed){
    [...buildings, ...palmTrees, ...guardRails, ...trafficCars, ...streetLights, ...statues, ...pedestrians, 
     ...flyingDebris, ...parkedCars, ...beachDetails, ...cityDecorations, 
     cityWall, horizonHill, niceCitySign // YENİ EKLENENLER
    ].forEach(o=>{
        if (o.userData.isJulie) return; 
        if (missionState.status === 'dropoffCinematic' && o === hotelSign) return; 

        o.position.z += currentSpeed;
        if (o.userData.isStaticObject) { // Sadece uzayıp giden objeler için döngüsel hareket
            if(o.position.z > player.position.z + 200) o.position.z -= TOTAL_LENGTH + Math.random() * 200;
            else if(o.position.z < player.position.z - TOTAL_LENGTH - 100) o.position.z += TOTAL_LENGTH + Math.random() * 200;
        }
        // Trafik araçları ve diğer dinamik objeler updateTraffic vs. içinde yönetiliyor.
        // horizonHill ve niceCitySign gibi objeler sabit kalmalı (player.position.z'ye göre konumlandırılmışlar)
    });

    // Yola bağlı segmentler
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

    // Tepenin ve tabelanın pozisyonlarını oyuncuya göre ayarla
    if (horizonHill) {
        horizonHill.position.z = player.position.z + TOTAL_LENGTH * 0.4; // Oyuncudan sabit bir mesafede tut
    }
    if (niceCitySign) {
        niceCitySign.position.z = player.position.z + TOTAL_LENGTH * 0.4 - 20; // Oyuncudan sabit bir mesafede tut
    }
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
    const maxTrafficCars = 15 + (trafficDifficultyLevel * 2);
    const spawnChance = 0.03 + (trafficDifficultyLevel * 0.005);
    
    if(trafficCars.length < maxTrafficCars && Math.random() < spawnChance && hasPlayerMoved) {
        createTrafficCar();
    }

    for(let i = trafficCars.length - 1; i >= 0; i--){
        const car = trafficCars[i];
        if(car.userData.isHit){
            car.position.add(car.userData.velocity.clone().multiplyScalar(dT)); 
            car.rotation.y += car.userData.spin * dT;
            car.userData.velocity.y -= 9.8 * dT; 
            car.userData.life -= dT;
            if(car.userData.life <= 0){ 
                car.visible = false; 
                trafficCarPool.push(car); 
                trafficCars.splice(i, 1); 
            }
        } else { 
            car.position.z += car.userData.speed * 0.5; 

            if (car.userData.laneChangeCooldown !== undefined) {
                car.userData.laneChangeCooldown -= dT;
                if (car.userData.laneChangeCooldown <= 0 && !car.userData.isChangingLane) {
                    const lanes = [-ROAD_WIDTH / 3, 0, ROAD_WIDTH / 3];
                    const currentLaneX = car.position.x;
                    const availableLanes = lanes.filter(l => Math.abs(l - currentLaneX) > 1);
                    if (availableLanes.length > 0) {
                        car.userData.targetX = availableLanes[Math.floor(Math.random() * availableLanes.length)];
                        car.userData.isChangingLane = true;
                    }
                }
                car.userData.laneChangeCooldown = Math.random() * 8 + 4;
            }

            if (car.userData.isChangingLane) {
                car.position.x = THREE.MathUtils.lerp(car.position.x, car.userData.targetX, dT * 0.8);
                if (Math.abs(car.position.x - car.userData.targetX) < 0.1) {
                    car.position.x = car.userData.targetX;
                    car.userData.isChangingLane = false;
                }
            }
        }
        if(car.position.z > player.position.z + 50 || car.position.z < player.position.z - 500){ 
            car.visible = false; 
            trafficCarPool.push(car); 
            trafficCars.splice(i, 1); 
        }
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
        
        // OPTİMİZASYON: Mesafe kontrolü eklendi
        const distanceThreshold = 20; 
        if (player.position.distanceTo(trafficCar.position) > distanceThreshold) {
            continue; 
        }

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
        
        // OPTİMİZASYON: Mesafe kontrolü eklendi
        const distanceThreshold = 30; 
        if (policeCar.position.distanceTo(trafficCar.position) > distanceThreshold) {
            continue; 
        }

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
        if (playerBox.intersectsBox(statueBox)){
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

// YENİ FONKSİYON: Obje havuzlaması için trafik aracı oluşturma (internal)
function createTrafficCarInternal() { 
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

    vehicle.userData.type = chosenType; 

    // OPTİMİZASYON: emissive ve emissiveIntensity kaldırıldı
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

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
    
    return vehicle; 
}


// TRAFİK ARACI OLUŞTURMA (HAVUZ KULLANAN)
function createTrafficCar() { 
    let vehicle;
    if (trafficCarPool.length > 0) {
        vehicle = trafficCarPool.pop(); 
        vehicle.visible = true; 
        
        const chosenType = vehicle.userData.type; 
        
        vehicle.position.set(0,0,0); 
        vehicle.rotation.set(0,0,0);
        vehicle.userData.isHit = false;
        vehicle.userData.life = 0;
        vehicle.userData.velocity = new THREE.Vector3();
        vehicle.userData.spin = 0;
        vehicle.userData.healedPlayer = false; 
        
        if (chosenType === 'ramp_truck') {
            vehicle.userData.rampMesh = vehicle.children.find(c => c.geometry && c.geometry.parameters && c.geometry.parameters.depth === 7); 
        }
        vehicle.userData.speed = 1.0 + Math.random() * 0.2; 
        
    } else {
        vehicle = createTrafficCarInternal(); 
        scene.add(vehicle); 
    }

    const chosenType = vehicle.userData.type; 
    
    if (chosenType === 'ramp_truck') {
        vehicle.position.x = ROAD_WIDTH / 2 + SIDEWALK_WIDTH - 3;
    } else {
        const lanes = [-ROAD_WIDTH / 3, 0, ROAD_WIDTH / 3]; 
        vehicle.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    }
    
    vehicle.position.z = player.position.z - 300 - Math.random() * 400;

    if (chosenType !== 'ramp_truck' && chosenType !== 'ambulance') {
        vehicle.userData.laneChangeCooldown = Math.random() * 8 + 4; 
        vehicle.userData.isChangingLane = false;
        vehicle.userData.targetX = vehicle.position.x;
    }
    
    trafficCars.push(vehicle);
}

function createLuxurySedan() { 
    const car = new THREE.Group();
    car.userData.type = 'sedan'; 
    
    const carTexture = loadedTextures.traffic_car_body_generic.clone();
    carTexture.wrapS = THREE.RepeatWrapping;
    carTexture.wrapT = THREE.RepeatWrapping;
    carTexture.repeat.set(1, 1);
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
    const car = new THREE.Group();
    car.userData.type = 'convertible'; 
    const carTexture = loadedTextures.traffic_car_body_generic.clone();
    const material = new THREE.MeshPhongMaterial({ map: carTexture, flatShading: true });
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
    const bike = new THREE.Group();
    bike.userData.type = 'motorcycle'; 
    const bikeTexture = loadedTextures.traffic_car_body_generic.clone();
    const material = new THREE.MeshPhongMaterial({ map: bikeTexture, flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1.8), material); body.position.y = 0.7; bike.add(body);
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    const frontWheel = new THREE.Mesh(wheelGeometry, material); frontWheel.rotation.x = Math.PI / 2; frontWheel.position.set(0, 0.35, -0.9);
    const rearWheel = frontWheel.clone(); rearWheel.position.z = 0.9; bike.add(frontWheel, rearWheel);
    bike.userData.speed = 2.2 + Math.random() * 0.8; return bike; 
}

function createChopper() { 
    const bike = new THREE.Group();
    bike.userData.type = 'chopper'; 
    const bikeTexture = loadedTextures.traffic_car_body_generic.clone();
    const material = new THREE.MeshPhongMaterial({ map: bikeTexture, flatShading: true });
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
    const limo = new THREE.Group();
    limo.userData.type = 'limousine'; 
    const limoTexture = loadedTextures.traffic_car_body_generic.clone();
    const material = new THREE.MeshPhongMaterial({ map: limoTexture, flatShading: true });
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
    truck.userData.type = 'ramp_truck'; 
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
        if(debris.userData.life <= 0 || debrisParticles.length > MAX_DEBRIS_PARTICLES){
            scene.remove(debris); debrisParticles.splice(i, 1);
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
        if (spark.userData.life <= 0 || bulletSparks.length > MAX_BULLET_SPARKS) {
            scene.remove(spark); bulletSparks.splice(i, 1);
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
    - Canın %50'nin altina dusmeden Sehir Merkezi'ne ulas.
    - Sehirdeki 3 heykeli yok et.
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
    statue.userData.isStaticObject = true; // YENİ: Dünya ile birlikte kayması için işaretle

    const baseGeo = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    statue.add(base);
    const bodyGeo = new THREE.BoxGeometry(1, 4, 1);
    // Heykel dokusu
    const bodyMat = new THREE.MeshPhongMaterial({ map: loadedTextures.statue_texture, shininess: 100 });
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
        // emissiveBulb artık BasicMaterial'da emissive kullanmadığımız için doğrudan rengi değiştirebiliriz.
        const lightMesh = lightGroup.children.find(child => child.material && child.material.isMeshBasicMaterial); 
        if (bulb) bulb.intensity = isNightTime ? streetLightGlowFactor * 1.5 : 0;
        if(lightMesh) lightMesh.material.color.setHex(isNightTime ? 0xffd700 : 0x888800); // Sarı veya daha soluk sarı
    });

    const isNight = dayCyclePhases[currentPhaseIndex] === 'NIGHT' || dayCyclePhases[currentPhaseIndex] === 'EVENING';

    if (player && player.userData.lights) {
        player.userData.lights.headlight1.visible = isNight;
        player.userData.lights.headlight2.visible = isNight;
        player.userData.lights.taillight1.material.color.setHex(isNight ? 0xFF0000 : 0x880000); 
        player.userData.lights.taillight2.material.color.setHex(isNight ? 0xFF0000 : 0x880000);
    }

    if (policeCar && policeCar.userData.lights) {
        policeCar.userData.lights.headlight1.visible = isNight;
        policeCar.userData.lights.headlight2.visible = isNight;
        policeCar.userData.lights.taillight1.material.color.setHex(isNight ? 0xbb0000 : 0x660000);
        policeCar.userData.lights.taillight2.material.color.setHex(isNight ? 0xbb0000 : 0x660000);
    }

    trafficCars.forEach(car => {
        if (car.userData.lights) {
            if (car.userData.type === 'ambulance') {
                const time = clock.getElapsedTime() * 5; 
                car.userData.lights.roofLight1.material.emissiveIntensity = Math.sin(time) > 0 ? 1.0 : 0.0; 
                car.userData.lights.roofLight2.material.emissiveIntensity = Math.sin(time) < 0 ? 1.0 : 0.0;
                car.userData.lights.roofLight1.visible = isNight;
                car.userData.lights.roofLight2.visible = isNight;
            } else { 
                car.userData.lights.headlight1.visible = isNight;
                car.userData.lights.headlight2.visible = isNight;
                car.userData.lights.taillight1.material.color.setHex(isNight ? 0xFF0000 : 0x880000);
                car.userData.lights.taillight2.material.color.setHex(isNight ? 0xFF0000 : 0x880000);
            }
        }
    });
}

function createRoadAndSidewalks() { 
    road = new THREE.Group();
    const roadTexture = loadedTextures.road.clone();
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
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
    
    // Kaldırım dokusu
    const sidewalkTexture = loadedTextures.sidewalk.clone();
    sidewalkTexture.wrapS = THREE.RepeatWrapping;
    sidewalkTexture.wrapT = THREE.RepeatWrapping;
    sidewalkTexture.repeat.set(SIDEWALK_WIDTH / 5, SEGMENT_LENGTH / 10);
    const sidewalkMaterial = new THREE.MeshPhongMaterial({map: sidewalkTexture});

    // Plaj dokusu
    const beachTexture = loadedTextures.beach.clone();
    beachTexture.wrapS = THREE.RepeatWrapping;
    beachTexture.wrapT = THREE.RepeatWrapping;
    beachTexture.repeat.set(100 / 10, SEGMENT_LENGTH / 10); 
    const beachMaterial = new THREE.MeshPhongMaterial({map: beachTexture});

    // Deniz dokusu
    const oceanTexture = loadedTextures.ocean.clone();
    oceanTexture.wrapS = THREE.RepeatWrapping;
    oceanTexture.wrapT = THREE.RepeatWrapping;
    oceanTexture.repeat.set(200 / 20, SEGMENT_LENGTH / 20); 
    const oceanMaterial = new THREE.MeshPhongMaterial({map: oceanTexture, transparent:true, opacity:0.8});
    
    // Bina zemini dokusu
    const groundTexture = loadedTextures.building_wall_generic.clone(); // Generic dokuyu zemin için de kullanabiliriz
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

    // Yeni: Daha düzenli bina oluşturma
    const BUILDING_ROW_COUNT = 3; 
    const BUILDINGS_PER_ROW_SEGMENT = 5; // Her SEGMENT_LENGTH içinde kaç bina olacağı
    const BUILDING_ROW_SPACING_Z = SEGMENT_LENGTH / BUILDINGS_PER_ROW_SEGMENT; 
    const BUILDING_LANE_OFFSET_X = [ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 10, ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 30, ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 50]; 

    for (let r = 0; r < BUILDING_ROW_COUNT; r++) {
        const startX = BUILDING_LANE_OFFSET_X[r];
        for (let seg = 0; seg < SEGMENT_COUNT; seg++) { // Her yol segmenti için
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
        // Park edilmiş araba dokusu
        const carMat = new THREE.MeshBasicMaterial({ map: loadedTextures.parked_car_base, transparent: true });
        const carGeo = new THREE.PlaneGeometry(5, 2.5);
        const parkedCar = new THREE.Mesh(carGeo, carMat);
        parkedCar.userData.isStaticObject = true; // YENİ: Dünya ile birlikte kayması için işaretle
        
        const xPos = ROAD_WIDTH / 2 + SIDEWALK_WIDTH * 0.7;
        const zPos = Math.random() * TOTAL_LENGTH - TOTAL_LENGTH / 2;
        parkedCar.position.set(xPos, 1.2, zPos);
        parkedCar.rotation.y = -Math.PI / 2;
        parkedCars.push(parkedCar);
        scene.add(parkedCar);
    }

    for (let i = 0; i < 40; i++) {
        const towel = createBeachDetail('towel');
        towel.userData.isStaticObject = true; // YENİ: Dünya ile birlikte kayması için işaretle
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
    cityWall.userData.isStaticObject = true; // YENİ: Dünya ile birlikte kayması için işaretle
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true }); // Temel duvar rengi

    const WALL_SEGMENT_WIDTH = 20; 
    const WALL_SEGMENT_COUNT_PER_SEGMENT = SEGMENT_LENGTH / WALL_SEGMENT_WIDTH; 
    const WALL_OFFSET_X = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 80; 

    for (let seg = 0; seg < SEGMENT_COUNT; seg++) { // Her yol segmenti için
        for (let i = 0; i < WALL_SEGMENT_COUNT_PER_SEGMENT; i++) { 
            const minWallHeight = 30; 
            const maxWallHeight = 70; 
            const wallHeight = minWallHeight + Math.random() * (maxWallHeight - minWallHeight);

            const wallGeometry = new THREE.BoxGeometry(WALL_SEGMENT_WIDTH, wallHeight, 2); 
            
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            // Doku tekrarını duvara göre ayarla
            if (loadedTextures.city_wall_base) {
                const wallTex = loadedTextures.city_wall_base.clone();
                wallTex.wrapS = THREE.RepeatWrapping;
                wallTex.wrapT = THREE.RepeatWrapping;
                wallTex.repeat.set(WALL_SEGMENT_WIDTH / 10, wallHeight / 10); 
                wallMesh.material = new THREE.MeshPhongMaterial({ map: wallTex, flatShading: true });
            }

            wallMesh.position.set(WALL_OFFSET_X, wallHeight / 2, (seg * SEGMENT_LENGTH) + (i * WALL_SEGMENT_WIDTH) - (TOTAL_LENGTH / 2));
            wallMesh.receiveShadow = true;
            wallMesh.castShadow = true;
            cityWall.add(wallMesh);

            // VICE CITY TEMALI 2D DOKU VE NEON IŞIKLAR
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

    const fontLoader = new THREE.FontLoader();
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
            // Tepe üzerinde konumlandır
            textMesh.position.set(currentX, horizonHill.position.y + horizonHill.geometry.parameters.height / 2 + letterHeight / 2 + 5, horizonHill.position.z); 
            textMesh.castShadow = true;
            niceCitySign.add(textMesh);
            
            // Eğer boşluk değilse, harf genişliğini hesapla
            if (letter !== ' ') {
                textGeometry.computeBoundingBox();
                const letterWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                currentX += letterWidth + letterSpacing;
            } else {
                currentX += letterSpacing * 2; // Boşluk için daha fazla mesafe
            }
        }
        // Tabelayı ortala
        const totalWidth = currentX - letterSpacing;
        niceCitySign.position.x -= totalWidth / 2;

        // Alttan Işıklandırma
        const lightColor = 0xFFFF00; // Sarı ışık
        niceCitySign.children.forEach(letterMesh => {
            if (letterMesh.isMesh) { // Sadece meshler için ışık ekle
                const light = new THREE.PointLight(lightColor, 2, 50);
                light.position.set(letterMesh.position.x, letterMesh.position.y - letterHeight / 2 - 5, letterMesh.position.z);
                niceCitySign.add(light);
            }
        });

        scene.add(niceCitySign);
    });
}


function createRain() {
    const vertices = [];
    for (let i = 0; i < 15000; i++) vertices.push(THREE.MathUtils.randFloatSpread(50), THREE.MathUtils.randFloat(0, 50), THREE.MathUtils.randFloatSpread(50));
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // Yağmur partikülü dokusu
    const rainParticleMaterial = new THREE.PointsMaterial({ 
        map: loadedTextures.rain_particle, // Küçük nokta veya damla dokusu
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
        // Materyal haritasını koruyarak rengi ve parlaklığı değiştir
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
        textureLoader = new THREE.TextureLoader(); // THREE.TextureLoader tanımlandı

        // Dokuları yükle ve tamamlandığında oyunu başlat
        loadGameTextures(() => {
            // Gökyüzü dokusunu kullan
            if (loadedTextures.sky) {
                 scene.background = loadedTextures.sky; 
                 // scene.background.mapping = THREE.EquirectangularReflectionMapping; // Eğer küresel bir harita ise
            } else {
                scene.background = dayCycleParameters.NIGHT.background.clone();
            }
            
            scene.fog = new THREE.Fog(0xcce0ff, TOTAL_LENGTH * 0.6, TOTAL_LENGTH); // Hafif sis

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
        });
        
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
    } else if (!missionState.status.includes('
