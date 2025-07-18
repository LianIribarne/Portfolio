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
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const $loaderBreaker = $('#loader-breaker');
  const $home = $('#home');
  const $navigation = $('#navigation-bar');

  gsap.to($loaderBreaker, {
    duration: 1.5,
    onComplete: () => {
      $loaderBreaker.css('display', 'none');
      
      $home.css('display', 'flex');
      $navigation.css('display', 'flex');

      gsap.fromTo($home, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo($navigation, { opacity: 0 }, { opacity: 1, duration: 1 });
    }
  });

  if (isMobile) {
    return;
  }

  // =========================================
  // SHINE
  // =========================================
  
  const cards = document.querySelectorAll(".card");
  
  cards.forEach((card) => {
    const img = card.querySelector("img");
  
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
    
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
    
      const rotateX = -(y - centerY) / 15;
      const rotateY = (x - centerX) / 15;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
      const yPercent = y / rect.height;
      const brightness = 1.1 - yPercent * 0.4;
      img.style.filter = `brightness(${brightness})`;
    });
  
    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0) rotateY(0)";
      img.style.filter = "brightness(1)";
    });
  });
});

// =========================================
// MENU OPEN/CLOSE
// =========================================

$(function () {
  const $breaker = $('#breaker');

  $('.menubar').on('click', function () {
    $breaker.css('display', 'block');

    setTimeout(() => {
      gsap.set('#navigation-content', { clearProps: "all" });
      gsap.set('#navigation-content', { y: 0, display: "flex" });
    }, 500);
    
    setTimeout(() => {
       $breaker.css('display', 'none');
    }, 1000)
  });

  $('.navigation-close').on('click', function () {
    $breaker.css('display', 'block');

    setTimeout(() => {
      gsap.set('#navigation-content', { y: "-100%", display: "none" });
    }, 500);
    
    setTimeout(() => {
       $breaker.css('display', 'none');
    }, 1000)
  });
});

// =========================================
// NAVIGATION
// =========================================

$(function () {
  const sections = ['#home', '#aboutme', '#projects', '#contact'];
  const $breaker = $('#breaker');

  function navigateTo(targetId) {
    const displayType = targetId === '#home' ? 'flex' : 'block';

    gsap.to('#navigation-content', {
      delay: 0.5,
      duration: 0,
      y: "-100%",
      display: "none"
    });

    $('.navigation-links a').removeClass('active');
    $(`.navigation-links a[href="${targetId}"]`).addClass('active');

    sections.forEach(id => {
      gsap.to(id, {
        delay: 0.4,
        duration: 0,
        css: { display: 'none' }
      });
    });

    gsap.set($breaker, { display: 'block' });
    gsap.to($breaker, {
      delay: 1,
      duration: 0,
      css: { display: 'none' }
    });

    gsap.to(targetId, {
      delay: 0.4,
      duration: 0,
      css: { display: displayType }
    })

    setTimeout(() => {
      const section = document.querySelector(targetId);
      if (section) {
        section.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 450);

    gsap.to('#navigation-content', 0, { display: "flex", delay: 2 });
  }

  $('.about-link').on('click', () => navigateTo('#aboutme'));
  $('.projects-link').on('click', () => navigateTo('#projects'));
  $('.contact-link').on('click', () => navigateTo('#contact'));
  $('.home-link').on('click', () => navigateTo('#home'));
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
        setTimeout(() => this.tick(), 50);
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

let currentLang = localStorage.getItem('lang') || 'en';

function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

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
  langIcon.src = isSpanish ? "images/flags/usa.webp" : "images/flags/arg.webp";
  langIcon.alt = isSpanish ? 'English' : 'Español';

  document.documentElement.setAttribute("lang", lang);
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
// PROJECT CARD
// =========================================
document.querySelectorAll('.project-card').forEach(card => {
  const showBtn = card.querySelector('.desc-btn');
  const closeBtn = card.querySelector('.close-desc-btn');

  showBtn.addEventListener('click', () => {
    card.classList.add('show-desc');
  });

  closeBtn.addEventListener('click', () => {
    card.classList.remove('show-desc');
  });
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

let csrfToken = null;

function requestCSRFTokenWithFeedback() {
  const loadingEl = document.getElementById("form-loading");
  const buttonEl = document.getElementById("btn-submit");

  buttonEl.style.display = "none";
  loadingEl.innerText = currentLang === 'en' ? "ACTIVATING API": "ACTIVANDO API";
  loadingEl.style.display = "block";

  return fetch("https://portfolio-backend-xrap.onrender.com/api/csrf/", {
    method: "GET",
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    csrfToken = data.csrfToken;
    loadingEl.innerText = currentLang === 'en' ? "SENDING MESSAGE": "ENVIANDO MENSAJE";
    return csrfToken;
  });
}

function showMessage(type, extraInfo = "") {
  const el = type === "success"
    ? document.getElementById("form-overlay-success")
    : document.getElementById("form-overlay-error");
  
  if (extraInfo) {
    el.innerHTML = `ERROR<br><br>${extraInfo}`
  }

  el.classList.add("show");
  setTimeout(() => {
    el.classList.remove("show");
  }, 4000);
}

document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = this;

  let valid = true;

  this.querySelectorAll("input, textarea").forEach((field) => {
    if (field.name === "website") return;
    field.classList.remove("invalid");

    if (!field.value.trim()) {
      field.classList.add("invalid");
      valid = false;
      setTimeout(() => {
        field.classList.remove("invalid")
      }, 700);
    }
  });

  if (valid) {
    const loadingEl = document.getElementById("form-loading");
    const buttonEl = document.getElementById("btn-submit");
  
    requestCSRFTokenWithFeedback()
      .then(() => {
        return fetch("https://portfolio-backend-xrap.onrender.com/api/form/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
          },
          body: JSON.stringify({
            name: form.elements["name"].value,
            email: form.elements["email"].value,
            subject: form.elements["subject"].value,
            message: form.elements["message"].value
          })
        });
      })
      .then(response => {
        if (!response.ok) return response.json().then(data => {
          throw new Error(data.error?.[currentLang] || "Unknown error");
        });
        return response.json();
      })
      .then(() => {
        form.reset();
        showMessage("success");
      })
      .catch(error => {
        showMessage("error", error.message);
      })
      .finally(() => {
        loadingEl.style.display = "none";
        buttonEl.style.display = "block";
      });
  }
});
