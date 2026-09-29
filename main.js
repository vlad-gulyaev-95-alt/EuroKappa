(() => {
  'use strict';

  const initSlider = () => {
    const track = document.querySelector('#service-track');
    const prev = document.querySelector('.slider-arrow--prev');
    const next = document.querySelector('.slider-arrow--next');
    if (!track || !prev || !next) return;

    const updateArrows = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    };

    const scrollByCard = (dir) => {
      const card = track.querySelector('.service-card');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: (card.offsetWidth + gap) * dir, behavior: 'smooth' });
    };

    prev.addEventListener('click', () => scrollByCard(-1));
    next.addEventListener('click', () => scrollByCard(1));
    track.addEventListener('scroll', updateArrows, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollByCard(1);
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollByCard(-1);
      }
    });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  };

  const initSpecialist = (section) => {
    const img = section.querySelector('.appointment__photo img');
    const input = section.querySelector('.appointment__photo-input');
    const button = section.querySelector('.appointment__photo-button');
    const status = section.querySelector('.appointment__photo-status');
    if (!img || !input || !button) return;

    const updateImage = () => {
      const src = section.dataset.specialistSrc?.trim();
      img.alt = section.dataset.specialistAlt || '';

      if (!src) {
        img.hidden = true;
        img.removeAttribute('src');
        return;
      }

      if (img.dataset.requestedSrc === src) return;

      img.hidden = true;
      img.dataset.requestedSrc = src;
      img.onload = () => {
        if (img.dataset.requestedSrc === src) img.hidden = false;
      };
      img.onerror = () => {
        if (img.dataset.requestedSrc === src) img.hidden = true;
      };
      img.src = src;
    };

    new MutationObserver(updateImage).observe(section, {
      attributes: true,
      attributeFilter: ['data-specialist-src', 'data-specialist-alt'],
    });

    button.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
        if (status) status.textContent = 'Выберите PNG-файл.';
        input.value = '';
        return;
      }

      const previousSrc = section.dataset.specialistSrc;
      const nextSrc = URL.createObjectURL(file);

      img.addEventListener('load', () => {
        if (section.dataset.specialistSrc !== nextSrc) return;
        if (previousSrc?.startsWith('blob:')) URL.revokeObjectURL(previousSrc);
        if (status) status.textContent = 'Фото обновлено.';
      }, { once: true });

      img.addEventListener('error', () => {
        if (section.dataset.specialistSrc === nextSrc && status) {
          status.textContent = 'Не удалось загрузить фото.';
        }
      }, { once: true });

      section.dataset.specialistSrc = nextSrc;
      input.value = '';
    });

    updateImage();
  };

  const initForm = () => {
    const form = document.querySelector('.appointment-form');
    if (!form) return;
    const status = form.querySelector('.form-status');
    const button = form.querySelector('.submit-button');
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const fullNamePattern = /^\p{L}+(?:[ '-]\p{L}+){2,}$/u;
    nameInput.addEventListener('input', () => {
      const value = nameInput.value.trim().replace(/\s+/g, ' ');
      const isValid = !value || fullNamePattern.test(value);
      nameInput.setCustomValidity(isValid ? '' : 'Введите фамилию, имя и отчество.');
    });
    const formatPhone = (raw) => {
      let digits = raw.replace(/\D/g, '');
      if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
      if (digits.startsWith('7')) digits = digits.slice(1);
      digits = digits.slice(0, 10);
      const chunks = [];
      if (digits.length) chunks.push(digits.slice(0, 3));
      if (digits.length > 3) chunks.push(digits.slice(3, 6));
      if (digits.length > 6) chunks.push(digits.slice(6, 8));
      if (digits.length > 8) chunks.push(digits.slice(8, 10));
      let formatted = '+7';
      if (chunks[0]) formatted += ` ${chunks[0]}`;
      if (chunks[1]) formatted += ` ${chunks[1]}`;
      if (chunks[2]) formatted += `-${chunks[2]}`;
      if (chunks[3]) formatted += `-${chunks[3]}`;
      return formatted;
    };
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value) phoneInput.value = '+7';
    });
    phoneInput.addEventListener('input', () => {
      phoneInput.value = formatPhone(phoneInput.value);
      const digitCount = phoneInput.value.replace(/\D/g, '').length;
      const isValid = digitCount === 11;
      phoneInput.setCustomValidity(isValid ? '' : 'Введите все 10 цифр номера после +7.');
    });
    phoneInput.addEventListener('blur', () => {
      if (phoneInput.value === '+7') phoneInput.value = '';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        status.textContent = 'Форма готова к подключению к системе записи.';
        return;
      }
      button.disabled = true;
      status.textContent = 'Отправляем заявку…';
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Request failed');
        form.reset();
        status.textContent = 'Спасибо! Заявка отправлена.';
      } catch {
        status.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз.';
      } finally {
        button.disabled = false;
      }
    });
  };

  initSlider();
  const appointment = document.querySelector('.appointment');

  if (appointment) {
    initSpecialist(appointment);
  }

  initForm();
})();
