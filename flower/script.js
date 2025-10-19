// Global state
window.sceneManager = {
  currentScene: 'flower',
  music: null,
  fireworkActive: false,
  heartActive: false
};

onload = () => {
  // Play background music
  const music = document.getElementById('background-music');
  window.sceneManager.music = music;
  
  music.play().catch(e => {
    // If autoplay is blocked, play on first user interaction
    document.addEventListener('click', () => {
      music.play();
    }, { once: true });
  });

  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");
    clearTimeout(c);
    
    // Show next button after flowers bloom (animation duration) + 4s
    // Flower animation takes about 5s, so total is 9s
    setTimeout(() => {
      const nextButton = document.getElementById('next-button');
      nextButton.style.display = 'block';
      nextButton.style.opacity = '0';
      
      // Fade in the button
      setTimeout(() => {
        nextButton.style.transition = 'opacity 1s ease-in-out';
        nextButton.style.opacity = '1';
      }, 50);
    }, 9000); // 5s animation + 4s wait
    
  }, 1000);
};

// Flying to sky effect when clicking "típ nhé"
document.addEventListener('DOMContentLoaded', () => {
  const nextButton = document.getElementById('next-button');
  if (!nextButton) return;
  
  nextButton.addEventListener('click', () => {
    const music = window.sceneManager.music;
    
    // Fade music volume from 1.0 to 0.5 over 3 seconds
    if (!music.paused) {
      const startVolume = 1.0;
      const endVolume = 0.5;
      const duration = 3000; // 3 seconds
      const musicStartTime = Date.now();
      
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - musicStartTime;
        const progress = Math.min(elapsed / duration, 1);
        music.volume = startVolume - (startVolume - endVolume) * progress;
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
        }
      }, 50);
    }
    
    // Add flying class
    document.body.classList.add('flying-to-sky');
    
    // Get all elements to animate
    const flowers = document.querySelector('.flowers');
    const frameLeft = document.querySelector('.photo-frame--left');
    const frameRight = document.querySelector('.photo-frame--right');
    const heartbeat = document.querySelector('.heartbeat-container');
    const fireflies = document.querySelector('.fireflies');
    
    // GPU accelerated transform animation
    const flyDuration = 3000; // 3 seconds
    const startTime = Date.now();
    
    function animateFly() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / flyDuration, 1);
      
      // Ease-out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const translateY = easeOut * 200; // Move 200vh down
      
      // Apply GPU-accelerated transforms
      flowers.style.transform = `translate3d(0, ${translateY}vh, 0) scale(${1 - easeOut * 0.1})`;
      frameLeft.style.transform = `translate3d(0, ${translateY * 0.75}vh, 0)`;
      frameRight.style.transform = `translate3d(0, ${translateY * 0.75}vh, 0)`;
      heartbeat.style.transform = `translate3d(-50%, ${translateY}vh, 0) scale(3)`;
      fireflies.style.transform = `translate3d(0, ${translateY * 0.5}vh, 0)`;
      
      // Fade out
      const opacity = 1 - (easeOut * 0.8);
      frameLeft.style.opacity = opacity;
      frameRight.style.opacity = opacity;
      heartbeat.style.opacity = opacity;
      
      if (progress < 1) {
        requestAnimationFrame(animateFly);
      } else {
        // Animation complete, transition to firework
        setTimeout(() => {
          transitionToFirework();
        }, 200);
      }
    }
    
    // Start animation
    requestAnimationFrame(animateFly);
  });
});

// Transition to firework scene
function transitionToFirework() {
  window.sceneManager.currentScene = 'firework';
  
  // Get elements
  const flowers = document.querySelector('.flowers');
  const frameLeft = document.querySelector('.photo-frame--left');
  const frameRight = document.querySelector('.photo-frame--right');
  const heartbeat = document.querySelector('.heartbeat-container');
  const fireflies = document.querySelector('.fireflies');
  const nextButton = document.querySelector('.next-button');
  
  // Reset transforms before hiding
  flowers.style.transform = '';
  frameLeft.style.transform = '';
  frameRight.style.transform = '';
  heartbeat.style.transform = '';
  fireflies.style.transform = '';
  
  // Hide flower scene elements
  flowers.style.display = 'none';
  frameLeft.style.display = 'none';
  frameRight.style.display = 'none';
  heartbeat.style.display = 'none';
  fireflies.style.display = 'none';
  nextButton.style.display = 'none';
  document.body.classList.remove('flying-to-sky');
  
  // Show firework container with fade in
  const fireworkContainer = document.getElementById('firework-container');
  fireworkContainer.style.display = 'block';
  
  setTimeout(() => {
    fireworkContainer.classList.add('active');
    window.sceneManager.fireworkActive = true;
    
    // Dispatch event to start fireworks
    window.dispatchEvent(new CustomEvent('startFirework'));
    
    // After 30 seconds, transition to heart
    setTimeout(() => {
      transitionToHeart();
    }, 30000);
  }, 100);
}

// Transition to heart scene
function transitionToHeart() {
  // Fade to black
  const blackOverlay = document.createElement('div');
  blackOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    z-index: 20000;
    opacity: 0;
    transition: opacity 2s ease-out;
    pointer-events: none;
  `;
  document.body.appendChild(blackOverlay);
  
  setTimeout(() => {
    blackOverlay.style.opacity = '1';
  }, 100);
  
  setTimeout(() => {
    window.sceneManager.currentScene = 'heart';
    window.sceneManager.fireworkActive = false;
    
    // Hide firework container
    const fireworkContainer = document.getElementById('firework-container');
    fireworkContainer.classList.remove('active');
    
    setTimeout(() => {
      fireworkContainer.style.display = 'none';
      
      // Show heart container
      const heartContainer = document.getElementById('heart-container');
      heartContainer.style.display = 'block';
      
      // Dispatch event to start heart animation
      window.dispatchEvent(new CustomEvent('startHeart'));
      
      setTimeout(() => {
        heartContainer.classList.add('active');
        window.sceneManager.heartActive = true;
        
        // Fade out black overlay
        blackOverlay.style.opacity = '0';
        setTimeout(() => {
          blackOverlay.remove();
        }, 2000);
      }, 100);
    }, 500);
  }, 2100);
}