// =========================================
// SCROLLING
// =========================================

let scrollTimeout;

window.addEventListener("scroll", () => {
  document.body.classList.add("scrolling");

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove("scrolling");
  }, 300);
});

// =========================================
// LOADER
// =========================================

$(window).on('load', function () {
  const isMobile = (
    (window.innerWidth < 480) && window.matchMedia("(orientation: portrait)").matches || 
    (window.innerHeight < 480 && window.matchMedia("(orientation: landscape)").matches)
  );

  const $loaderBreaker = $('#loader-breaker');
  const $home = $('#home');

  if (isMobile) {
    $loaderBreaker.remove();
    $home.css('opacity', 1);
    return;
  }

  gsap.to($loaderBreaker, {
    opacity: 0,
    duration: 2,
    delay: 1.5,
    onComplete: () => {
      $loaderBreaker.css('display', 'none');
    }
  });

  gsap.to($home, {
    opacity: 1,
    duration: 0.6,
    delay: 1.4
  });
});

// =========================================
// NAVIGATION
// =========================================

$(function () {
  const sections = ['#home', '#aboutme', '#projects', '#contact'];
  const $breaker = $('#breaker');
  const $homeBtn = $('#home-btn');

  function navigateTo(targetId) {
    const displayType = targetId === '#home' ? 'flex' : 'block';

    sections.forEach(id => {
      gsap.to(id, {
        delay: 0.8,
        duration: 0,
        css: { display: 'none' }
      });
    });

    gsap.set($breaker, { display: 'block' });
    gsap.to($breaker, {
      delay: 2,
      duration: 0,
      css: { display: 'none' }
    });

    gsap.to(targetId, {
      delay: 0.8,
      duration: 0,
      css: { display: displayType }
    });

    if (targetId === '#home') {
      setTimeout(() => $homeBtn.addClass('hidden'), 800);
    } else {
      setTimeout(() => $homeBtn.removeClass('hidden'), 800);
    }
  }

  $('.about-link').on('click', () => navigateTo('#aboutme'));
  $('.projects-link').on('click', () => navigateTo('#projects'));
  $('.contact-link').on('click', () => navigateTo('#contact'));
  $('#home-link').on('click', () => navigateTo('#home'));
});

// =========================================
// TYPEWRITER
// =========================================

$(function () {
  class TxtTypeOnce {
    constructor(el, text) {
      this.text = text;
      this.el = el;
      this.txt = '';
      this.tick();
    }

    tick() {
      this.txt = this.text.substring(0, this.txt.length + 1);
      this.el.innerHTML = `<span class="wrap">${this.txt}</span>`;

      if (this.txt !== this.text) {
        let delta = 200 - Math.random() * 100;
        setTimeout(() => this.tick(), delta);
      }
    }
  }

  const elements = document.getElementsByClassName('txt-rotate');
  Array.from(elements).forEach(el => {
    const text = el.getAttribute('data-text');
    if (text) {
      new TxtTypeOnce(el, text);
    }
  });
});

// =========================================
// LANGAUGE
// =========================================

let currentLang = 'en';

function changeLanguage(lang) {
  currentLang = lang;

  const dict = translations[lang];
  const elements = document.querySelectorAll('[data-key]');

  elements.forEach(el => {
    const key = el.getAttribute('data-key');
    const text = dict[key];
    if (!text) return;

    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {
      if (el.getAttribute('data-html') === 'true') {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    }
    el.setAttribute('data-text', text);
  });

  const placeholders = {
    name: 'placeholder_name',
    email: 'placeholder_email',
    subject: 'placeholder_subject',
    message: 'placeholder_message'
  };

  for (const [name, key] of Object.entries(placeholders)) {
    const input = document.querySelector(`[name='${name}']`);
    if (input) input.setAttribute('placeholder', dict[key]);
  }

  const langIcon = document.getElementById('lang-icon');
  const isSpanish = lang === 'es';
  langIcon.src = isSpanish ? "images/flags/united-states.png" : "images/flags/spain.png";
  langIcon.alt = isSpanish ? 'English' : 'Español';
}

document.addEventListener('DOMContentLoaded', () => {
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const newLang = currentLang === 'es' ? 'en' : 'es';
      changeLanguage(newLang);
    });
  }

  changeLanguage(currentLang);
});

// =========================================
// FORM
// =========================================

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

let csrfLoaded = false;

function requestCSRFToken() {
  if (csrfLoaded) return;
  csrfLoaded = true;

  fetch("https://portfolio-backend-xrap.onrender.com/api/csrf/", {
    method: "GET",
    credentials: "include"
  });
}

document.querySelectorAll(".contact-link").forEach(link => {
  link.addEventListener("click", () => {
    requestCSRFToken();
  });
});

document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = this;

  const name = form.elements["name"].value;
  const subject = form.elements["subject"].value;
  const email = form.elements["email"].value;
  const message = form.elements["message"].value;

  const loadingEl = document.getElementById("form-loading");
  const buttonEl = document.getElementById("btn-submit");
  buttonEl.style.display = "none";
  loadingEl.style.display = "block";

  function showMessage(type, extraInfo = "") {
    const el = type === "success"
      ? document.getElementById("form-overlay-success")
      : document.getElementById("form-overlay-error");
    
    const translation = translations[currentLang][type];
    el.innerHTML = extraInfo ? `${translation}:<br> <br> ${extraInfo}` : translation;
    
    el.classList.add("show");
    
    setTimeout(() => {
      el.classList.remove("show");
    }, 4000);
  }

  fetch("https://portfolio-backend-xrap.onrender.com/api/form/", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({
      name: name,
      email: email,
      subject: subject,
      message: message
    })
  })
  .then(response => {
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return response.json();
  })
  .then(() => {
    form.reset();
    showMessage("success");
  })
  .catch(error => {
    showMessage("error", error.message || "¿?");
  })
  .finally(() => {
    loadingEl.style.display = "none";
    buttonEl.style.display = "block";
  });
});
