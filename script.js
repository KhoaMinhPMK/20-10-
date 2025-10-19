const {
  gsap: {
    registerPlugin,
    set,
    to,
    timeline,
    delayedCall,
    utils: { random } },

  MorphSVGPlugin,
  Draggable } =
window;
registerPlugin(MorphSVGPlugin);

// Countdown Timer Function
function updateCountdown() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  
  // Tính thời gian đến 12h tiếp theo (trưa hoặc đêm)
  let targetHour = 12;
  if (currentHour >= 12) {
    targetHour = 24; // 12h đêm
  }
  
  const hoursLeft = targetHour - currentHour - 1;
  const minutesLeft = 59 - currentMinute;
  const secondsLeft = 60 - currentSecond;
  
  // Cập nhật hiển thị
  document.getElementById('hours').textContent = String(hoursLeft).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutesLeft).padStart(2, '0');
  document.getElementById('seconds').textContent = String(secondsLeft).padStart(2, '0');
}

// Cập nhật mỗi giây
setInterval(updateCountdown, 1000);
updateCountdown(); // Chạy ngay lập tức

// Used to calculate distance of "tug"
let startX;
let startY;

const CORD_DURATION = 0.1;
const INPUT = document.querySelector('#light-mode');
const ARMS = document.querySelectorAll('.bear__arm');
const PAW = document.querySelector('.bear__paw');
const CORDS = document.querySelectorAll('.toggle-scene__cord');
const HIT = document.querySelector('.toggle-scene__hit-spot');
const DUMMY = document.querySelector('.toggle-scene__dummy-cord');
const DUMMY_CORD = document.querySelector('.toggle-scene__dummy-cord line');
const PROXY = document.createElement('div');
const endY = DUMMY_CORD.getAttribute('y2');
const endX = DUMMY_CORD.getAttribute('x2');
// set init position
const RESET = () => {
  set(PROXY, {
    x: endX,
    y: endY });

};

const AUDIO = {
  BEAR_LONG: new Audio('https://assets.codepen.io/605876/bear-groan-long.mp3'),
  BEAR_SHORT: new Audio(
  'https://assets.codepen.io/605876/bear-groan-short.mp3'),

  DOOR_OPEN: new Audio('https://assets.codepen.io/605876/door-open.mp3'),
  DOOR_CLOSE: new Audio('https://assets.codepen.io/605876/door-close.mp3'),
  CLICK: new Audio('https://assets.codepen.io/605876/click.mp3') };

const STATE = {
  ON: false,
  ANGER: 0 };

set(PAW, {
  transformOrigin: '50% 50%',
  xPercent: -30 });

set('.bulb', { z: 10 });
set(ARMS, {
  xPercent: 10,
  rotation: -90,
  transformOrigin: '100% 50%',
  yPercent: -2,
  display: 'block' });

const CONFIG = {
  ARM_DUR: 0.4,
  CLENCH_DUR: 0.1,
  BEAR_START: 40,
  BEAR_FINISH: -55,
  BEAR_ROTATE: -50,
  DOOR_OPEN: 25,
  INTRO_DELAY: 1,
  BEAR_APPEARANCE: 2,
  SLAM: 3,
  BROWS: 3 };

set('.bear__brows', { display: 'none' });
set('.bear', {
  rotate: CONFIG.BEAR_ROTATE,
  xPercent: CONFIG.BEAR_START,
  transformOrigin: '50% 50%',
  scale: 0,
  display: 'block' });


RESET();

const CORD_TL = () => {
  const TL = timeline({
    paused: false,
    onStart: () => {
      // Hook this up to localStorage for jhey.dev
      STATE.ON = !STATE.ON;
      INPUT.checked = !STATE.ON;
      set(document.documentElement, { '--on': STATE.ON ? 1 : 0 });
      set([DUMMY], { display: 'none' });
      set(CORDS[0], { display: 'block' });
      AUDIO.CLICK.play();
    },
    onComplete: () => {
      // BEAR_TL.restart()
      set([DUMMY], { display: 'block' });
      set(CORDS[0], { display: 'none' });
      RESET();
    } });

  for (let i = 1; i < CORDS.length; i++) {
    TL.add(
    to(CORDS[0], {
      morphSVG: CORDS[i],
      duration: CORD_DURATION,
      repeat: 1,
      yoyo: true }));


  }
  return TL;
};

/**
 * Mess around with the actial input toggling here.
 */
const BEAR_TL = () => {
  const ARM_SWING = STATE.ANGER >= 4 ? 0.2 : CONFIG.ARM_DUR;
  const SLIDE = STATE.ANGER >= 4 ? 0.2 : random(0.2, 0.6);
  const CLOSE_DELAY = STATE.ANGER >= CONFIG.INTRO_DELAY ? random(0.2, 2) : 0;
  
  // Lần 1: Chỉ thò tay (không hiện gấu)
  // Lần 2-3: Thò mặt gấu
  // Lần 4: Thò tay và tắt đèn
  const SHOW_BEAR = STATE.ANGER >= 2 && STATE.ANGER < 4;
  const SHOW_ARM_ONLY = STATE.ANGER === 1 || STATE.ANGER >= 4;
  
  const TL = timeline({
    paused: false }).

  to('.door', {
    onStart: () => AUDIO.DOOR_OPEN.play(),
    rotateY: 25,
    duration: 0.2 }).

  add(
  SHOW_BEAR ?
  to('.bear', {
    onStart: () => {
      set('.bear', { scale: 1 });
    },
    xPercent: CONFIG.BEAR_FINISH,
    repeat: 1,
    repeatDelay: 1,
    yoyo: true,
    duration: SLIDE }) :

  () => {}).

  to(ARMS, {
    delay: CLOSE_DELAY,
    duration: ARM_SWING,
    rotation: 0,
    xPercent: 0,
    yPercent: 0 }).

  to(
  [PAW, '#knuckles'],
  {
    duration: CONFIG.CLENCH_DUR,
    xPercent: (_, target) => target.id === 'knuckles' ? 10 : 0 },

  `>-${ARM_SWING * 0.5}`).

  to(ARMS, {
    duration: ARM_SWING * 0.5,
    rotation: 5 }).

  to(ARMS, {
    rotation: -90,
    xPercent: 10,
    duration: ARM_SWING,
    onComplete: () => {
      to('.door', {
        onComplete: () => AUDIO.DOOR_CLOSE.play(),
        duration: 0.2,
        rotateY: 0 });

    } }).

  to(
  DUMMY_CORD,
  {
    duration: CONFIG.CLENCH_DUR,
    attr: {
      x2: parseInt(endX, 10) + 20,
      y2: parseInt(endY, 10) + 60 } },


  '<').

  to(
  DUMMY_CORD,
  {
    duration: CONFIG.CLENCH_DUR,
    attr: {
      x2: endX,
      y2: endY } },


  '>').

  to(
  [PAW, '#knuckles'],
  {
    duration: CONFIG.CLENCH_DUR,
    xPercent: (_, target) => target.id === 'knuckles' ? 0 : -28 },

  '<').

  add(() => CORD_TL(), '<');
  return TL;
};

const IMPOSSIBLE_TL = () =>
timeline({
  onStart: () => {
    set(HIT, { display: 'none' });
    // Tăng anger trước để logic BEAR_TL đúng
    STATE.ANGER = STATE.ANGER + 1;
    
    // Lần 3: Hiện chau mày
    if (STATE.ANGER >= 3) {
      set('.bear__brows', { display: 'block' });
    }
  },
  onComplete: () => {
    set(HIT, { display: 'block' });
    
    // Lần 4: Tắt đèn và fade màn hình xuống đen
    if (STATE.ANGER >= 4) {
      // Tạo overlay đen
      const blackOverlay = document.createElement('div');
      blackOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000000;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(blackOverlay);
      
      // Tắt đèn ngay lập tức (phòng tối đen)
      STATE.ON = false;
      INPUT.checked = false;
      set(document.documentElement, { '--on': 0 });
      
      // Fade overlay đen từ 0 lên 1 (màn hình tối dần)
      set(blackOverlay, { opacity: 0 });
      to(blackOverlay, {
        opacity: 1,
        duration: 3,
        ease: 'power2.inOut',
        onComplete: () => {
          // Ẩn hết mọi thứ trừ overlay đen
          set('.toggle, .countdown-timer, .doorway, .bear', { display: 'none' });
          
          // Hiển thị text trên nền đen
          const endScreen = document.createElement('div');
          endScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000000;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3vmin;
            font-family: Arial, sans-serif;
            z-index: 10000;
          `;
          endScreen.textContent = 'gòi gòi chờ xíu hehe';
          document.body.appendChild(endScreen);
          set(endScreen, { opacity: 0 });
          to(endScreen, { 
            opacity: 1, 
            duration: 1.5,
            onComplete: () => {
              // Sau 2 giây, ẩn text và hiện nút
              to(endScreen, {
                opacity: 0,
                duration: 1.5,
                delay: 2,
                onComplete: () => {
                  // Hiện nút
                  const flowerButton = document.getElementById('flower-button');
                  flowerButton.style.display = 'block';
                  set(flowerButton, { opacity: 0, scale: 0.8 });
                  to(flowerButton, { 
                    opacity: 1, 
                    scale: 1,
                    duration: 1,
                    ease: 'back.out(1.7)'
                  });
                }
              });
            }
          });
        }
      });
    }
  } }).

add(CORD_TL()).
add(BEAR_TL());

Draggable.create(PROXY, {
  trigger: HIT,
  type: 'x,y',
  onPress: e => {
    startX = e.x;
    startY = e.y;
    RESET();
  },
  onDrag: function () {
    set(DUMMY_CORD, {
      attr: {
        x2: this.x,
        y2: this.y } });


  },
  onRelease: function (e) {
    const DISTX = Math.abs(e.x - startX);
    const DISTY = Math.abs(e.y - startY);
    const TRAVELLED = Math.sqrt(DISTX * DISTX + DISTY * DISTY);
    to(DUMMY_CORD, {
      attr: { x2: endX, y2: endY },
      duration: CORD_DURATION,
      onComplete: () => {
        if (TRAVELLED > 50) {
          IMPOSSIBLE_TL();
        } else {
          RESET();
        }
      } });

  } });

// Button animation for flower page (from button folder)
const flowerButton = document.getElementById('flower-button');
if (flowerButton) {
  flowerButton.addEventListener('click', e => {
    e.preventDefault();
    
    let box = flowerButton.querySelector('.box'),
        truck = flowerButton.querySelector('.truck');
    
    if(!flowerButton.classList.contains('done')) {
      
      if(!flowerButton.classList.contains('animation')) {

        flowerButton.classList.add('animation');

        to(flowerButton, {
          '--box-s': 1,
          '--box-o': 1,
          duration: .3,
          delay: .5
        });

        to(box, {
          x: 0,
          duration: .4,
          delay: .7
        });

        to(flowerButton, {
          '--hx': -5,
          '--bx': 50,
          duration: .18,
          delay: .92
        });

        to(box, {
          y: 0,
          duration: .1,
          delay: 1.15
        });

        set(flowerButton, {
          '--truck-y': 0,
          '--truck-y-n': -26
        });

        to(flowerButton, {
          '--truck-y': 1,
          '--truck-y-n': -25,
          duration: .2,
          delay: 1.25,
          onComplete() {
            timeline({
              onComplete() {
                flowerButton.classList.add('done');
                // Chuyển đến trang flower sau khi animation xong
                setTimeout(() => {
                  window.location.href = 'flower/index.html';
                }, 800);
              }
            }).to(truck, {
              x: 0,
              duration: .4
            }).to(truck, {
              x: 40,
              duration: 1
            }).to(truck, {
              x: 20,
              duration: .6
            }).to(truck, {
              x: 96,
              duration: .4
            });
            to(flowerButton, {
              '--progress': 1,
              duration: 2.4,
              ease: "power2.in"
            });
          }
        });
        
      }
      
    } else {
      flowerButton.classList.remove('animation', 'done');
      set(truck, {
        x: 4
      });
      set(flowerButton, {
        '--progress': 0,
        '--hx': 0,
        '--bx': 0,
        '--box-s': .5,
        '--box-o': 0,
        '--truck-y': 0,
        '--truck-y-n': -26
      });
      set(box, {
        x: -24,
        y: -6
      });
    }

  });
}