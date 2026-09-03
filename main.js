const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation.classList.toggle('open', !isOpen);
});

navigation.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...navigation.querySelectorAll('a[href^="#"]')];

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-25% 0px -60%', threshold: [0, .25, .5] });

  sections.forEach((section) => observer.observe(section));
}

// Reveal content only when it approaches the viewport.
const revealItems = [...document.querySelectorAll('.reveal')];
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10%', threshold: .08 });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Pointer state powers the aura, hero parallax, cards, and magnetic buttons.
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: window.innerWidth / 2, ty: window.innerHeight / 2 };
const pointerAura = document.getElementById('pointer-aura');
const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
const interactiveCards = [...document.querySelectorAll('.interactive-card')];
const magneticButtons = [...document.querySelectorAll('.button')];

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    document.body.classList.add('pointer-active');
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => document.body.classList.remove('pointer-active'));

  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--card-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  magneticButtons.forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .12;
      const y = (event.clientY - rect.top - rect.height / 2) * .18;
      button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });

  const animatePointer = () => {
    pointer.x += (pointer.tx - pointer.x) * .12;
    pointer.y += (pointer.ty - pointer.y) * .12;
    pointerAura.style.transform = `translate3d(${pointer.x - 208}px, ${pointer.y - 208}px, 0)`;

    const nx = pointer.x / window.innerWidth - .5;
    const ny = pointer.y / window.innerHeight - .5;
    parallaxItems.forEach((item) => {
      const strength = Number(item.dataset.parallax);
      item.style.transform = `translate3d(${nx * window.innerWidth * strength}px, ${ny * window.innerHeight * strength}px, 0)`;
    });
    requestAnimationFrame(animatePointer);
  };
  requestAnimationFrame(animatePointer);
}

// Lightweight particle field: particles drift, connect, and gently avoid the pointer.
const canvas = document.getElementById('particle-field');
const context = canvas.getContext('2d', { alpha: true });
let particles = [];
let canvasWidth = 0;
let canvasHeight = 0;
let dpr = 1;
let particleFrame = 0;
let pageVisible = true;

const particlePalette = [
  'rgba(255,255,255,.72)',
  'rgba(185,223,255,.66)',
  'rgba(154,140,255,.52)',
  'rgba(255,63,70,.45)'
];

function makeParticle() {
  const speed = .08 + Math.random() * .22;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: .45 + Math.random() * 1.35,
    color: particlePalette[Math.floor(Math.random() * particlePalette.length)],
    phase: Math.random() * Math.PI * 2
  };
}

function resizeParticleField() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  canvas.width = Math.floor(canvasWidth * dpr);
  canvas.height = Math.floor(canvasHeight * dpr);
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  const density = window.innerWidth < 700 ? 17000 : 12500;
  const targetCount = Math.max(28, Math.min(86, Math.round((canvasWidth * canvasHeight) / density)));
  particles = Array.from({ length: targetCount }, makeParticle);
}

function drawParticles(time) {
  if (!pageVisible) return;
  context.clearRect(0, 0, canvasWidth, canvasHeight);

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    const dx = particle.x - pointer.tx;
    const dy = particle.y - pointer.ty;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < 18000 && distanceSq > 1 && document.body.classList.contains('pointer-active')) {
      const force = (1 - distanceSq / 18000) * .032;
      const distance = Math.sqrt(distanceSq);
      particle.vx += (dx / distance) * force;
      particle.vy += (dy / distance) * force;
    }

    particle.vx *= .992;
    particle.vy *= .992;
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -15) particle.x = canvasWidth + 15;
    if (particle.x > canvasWidth + 15) particle.x = -15;
    if (particle.y < -15) particle.y = canvasHeight + 15;
    if (particle.y > canvasHeight + 15) particle.y = -15;

    const pulse = .72 + Math.sin(time * .0007 + particle.phase) * .28;
    context.beginPath();
    context.fillStyle = particle.color;
    context.globalAlpha = pulse;
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();

    for (let j = i + 1; j < particles.length; j += 1) {
      const other = particles[j];
      const linkX = particle.x - other.x;
      const linkY = particle.y - other.y;
      const linkDistanceSq = linkX * linkX + linkY * linkY;
      if (linkDistanceSq > 9000) continue;
      context.beginPath();
      context.globalAlpha = (1 - linkDistanceSq / 9000) * .11;
      context.strokeStyle = '#b9dfff';
      context.lineWidth = .6;
      context.moveTo(particle.x, particle.y);
      context.lineTo(other.x, other.y);
      context.stroke();
    }
  }

  context.globalAlpha = 1;
  particleFrame = requestAnimationFrame(drawParticles);
}

if (!reduceMotion) {
  resizeParticleField();
  window.addEventListener('resize', resizeParticleField, { passive: true });
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) particleFrame = requestAnimationFrame(drawParticles);
    else cancelAnimationFrame(particleFrame);
  });
  particleFrame = requestAnimationFrame(drawParticles);
}

// A restrained progress signal makes long-form scrolling feel responsive.
const progress = document.getElementById('scroll-progress');
function updateScrollProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = total > 0 ? window.scrollY / total : 0;
  progress.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();
