import { useEffect } from "react";

const sliderConfigs = [
  [".team-slider-one", {
    loop: true,
    speed: 1500,
    spaceBetween: 25,
    slidesPerView: 1,
    autoHeight: true,
    navigation: { nextEl: ".team-next", prevEl: ".team-prev" },
    breakpoints: { 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }
  }],
  [".product-slider-one", {
    loop: true,
    speed: 1500,
    spaceBetween: 25,
    navigation: { nextEl: ".product-next", prevEl: ".product-prev" },
    breakpoints: { 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }
  }],
  [".service-slider-one", {
    loop: true,
    speed: 1500,
    spaceBetween: 25,
    navigation: { nextEl: ".service-next", prevEl: ".service-prev" },
    breakpoints: { 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 }, 1200: { slidesPerView: 3 }, 1400: { slidesPerView: 4 } }
  }],
  [".project-slider-one", {
    loop: true,
    speed: 1500,
    spaceBetween: 8,
    slidesPerView: 1,
    autoHeight: true,
    navigation: { nextEl: ".project-next", prevEl: ".project-prev" },
    breakpoints: { 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 }, 1400: { slidesPerView: 4 } }
  }],
  [".testimonial-slider-one", {
    loop: false,
    speed: 1500,
    spaceBetween: 25,
    slidesPerView: 1,
    autoHeight: true,
    navigation: { nextEl: ".testimonial-next", prevEl: ".testimonial-prev" },
    breakpoints: { 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 }, 1400: { slidesPerView: 3.1 }, 1600: { slidesPerView: 3.65 } }
  }],
  [".testimonial-slider-two", {
    loop: true,
    speed: 1500,
    spaceBetween: 25,
    autoHeight: true,
    slidesPerView: 1,
    effect: "fade",
    fadeEffect: { crossFade: true },
    navigation: { nextEl: ".testimonial-next", prevEl: ".testimonial-prev" },
    pagination: { el: ".testimonial-pagination", clickable: true }
  }],
  [".testimonial-slider-three", {
    loop: true,
    speed: 1500,
    spaceBetween: 10,
    autoHeight: true,
    slidesPerView: 1,
    effect: "fade",
    fadeEffect: { crossFade: true },
    navigation: { nextEl: ".testimonial-next", prevEl: ".testimonial-prev" }
  }],
  [".brand-slider-one", {
    loop: false,
    speed: 15000,
    freeMode: false,
    spaceBetween: 45,
    simulateTouch: false,
    autoplay: { delay: 1, disableOnInteraction: false },
    breakpoints: { 0: { slidesPerView: 2.5 }, 576: { slidesPerView: 3.5 }, 768: { slidesPerView: 4 }, 992: { slidesPerView: 4.5 }, 1200: { slidesPerView: 5 }, 1400: { slidesPerView: 5 }, 1600: { slidesPerView: 8 } }
  }]
];

function setupMenu() {
  const menu = document.querySelector(".menu");
  const overlay = document.querySelector(".overlay");
  if (!menu || !overlay) return () => {};

  const stack = [];
  const closeMenu = () => {
    menu.classList.remove("active");
    overlay.classList.remove("active");
    menu.querySelectorAll(".menu-subs.active").forEach((item) => item.classList.remove("active"));
    menu.querySelector(".menu-mobile-header")?.classList.remove("active");
    stack.length = 0;
  };

  const onClick = (event) => {
    if (event.target.closest(".menu-mobile-trigger")) {
      menu.classList.add("active");
      overlay.classList.add("active");
      return;
    }
    if (event.target.closest(".menu-mobile-close") || event.target === overlay) {
      closeMenu();
      return;
    }
    if (event.target.closest(".menu-mobile-arrow")) {
      const submenu = stack.pop();
      if (submenu) submenu.classList.remove("active");
      if (!stack.length) menu.querySelector(".menu-mobile-header")?.classList.remove("active");
      return;
    }
    const parent = event.target.closest(".menu-item-has-children");
    if (menu.classList.contains("active") && parent) {
      const submenu = parent.querySelector(":scope > .menu-subs");
      if (!submenu) return;
      event.preventDefault();
      submenu.classList.add("active");
      stack.push(submenu);
      menu.querySelector(".menu-mobile-header")?.classList.add("active");
      const title = menu.querySelector(".menu-mobile-title");
      if (title) title.textContent = parent.firstElementChild?.textContent?.trim() || "";
    }
  };

  const onResize = () => window.innerWidth > 991 && closeMenu();
  document.addEventListener("click", onClick);
  window.addEventListener("resize", onResize);
  return () => {
    document.removeEventListener("click", onClick);
    window.removeEventListener("resize", onResize);
  };
}

function setupProgress() {
  const path = document.getElementById("progress-path");
  const wrap = document.getElementById("progress-wrap");
  if (!path || !wrap) return () => {};

  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length} ${length}`;
  const update = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    path.style.strokeDashoffset = String(length - (window.scrollY * length) / Math.max(height, 1));
    wrap.classList.toggle("active-progress", window.scrollY > 50);
    document.getElementById("navbar")?.classList.toggle("sticky", window.scrollY >= 150);
  };
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  update();
  window.addEventListener("scroll", update, { passive: true });
  wrap.addEventListener("click", backToTop);
  return () => {
    window.removeEventListener("scroll", update);
    wrap.removeEventListener("click", backToTop);
  };
}

function setupCounters() {
  if (!("IntersectionObserver" in window)) return () => {};
  const timers = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      const target = Number.parseInt(counter.textContent, 10);
      if (!Number.isFinite(target)) return;
      let current = 0;
      const step = target / 200;
      const timer = window.setInterval(() => {
        current += step;
        counter.textContent = String(Math.min(target, Math.floor(current)));
        if (current >= target) {
          window.clearInterval(timer);
          timers.delete(timer);
        }
      }, 10);
      timers.add(timer);
      observer.unobserve(counter);
    });
  });
  document.querySelectorAll(".counter").forEach((counter) => observer.observe(counter));
  return () => {
    observer.disconnect();
    timers.forEach((timer) => window.clearInterval(timer));
  };
}

function setupPricingToggle() {
  const toggle = document.getElementById("togBtn");
  if (!toggle) return () => {};

  const update = () => {
    document.querySelectorAll(".text1").forEach((item) => {
      item.style.display = toggle.checked ? "none" : "block";
    });
    document.querySelectorAll(".text2").forEach((item) => {
      item.style.display = toggle.checked ? "block" : "none";
    });
  };

  update();
  toggle.addEventListener("change", update);
  return () => toggle.removeEventListener("change", update);
}

function setupDatePicker() {
  const input = document.getElementById("customDateInput");
  const wrapper = document.getElementById("dateWrapper");
  if (!input || !wrapper) return () => {};

  const open = () => {
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  };
  const update = () => input.classList.toggle("empty", !input.value);

  wrapper.addEventListener("click", open);
  input.addEventListener("change", update);
  update();
  return () => {
    wrapper.removeEventListener("click", open);
    input.removeEventListener("change", update);
  };
}

function setupActiveNavigation(pathname) {
  const navbar = document.getElementById("navbar");
  if (!navbar) return () => {};

  navbar.querySelectorAll("a.active").forEach((link) => link.classList.remove("active"));
  const current = [...navbar.querySelectorAll("a[href]")].find((link) => {
    try {
      return new URL(link.href, window.location.href).pathname === pathname;
    } catch {
      return false;
    }
  });

  current?.classList.add("active");
  current
    ?.closest(".menu-item-has-children")
    ?.querySelector(":scope > a")
    ?.classList.add("active");
  return () => {};
}

export default function useSiteAnimations(pageSlug, pathname) {
  useEffect(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const Swiper = window.Swiper;
    const Lenis = window.Lenis;
    const SplitText = window.SplitText;
    const CustomEase = window.CustomEase;
    const cleanups = [
      setupMenu(),
      setupProgress(),
      setupCounters(),
      setupPricingToggle(),
      setupDatePicker(),
      setupActiveNavigation(pathname)
    ];
    const splitInstances = [];
    const swipers = [];

    if (Swiper) {
      sliderConfigs.forEach(([selector, config]) => {
        document.querySelectorAll(selector).forEach((element) => {
          swipers.push(new Swiper(element, config));
        });
      });
    }

    let lenis;
    let frame;
    if (Lenis) {
      lenis = new Lenis({
        duration: 1.8,
        easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true
      });
      lenis.scrollTo(0, { immediate: true, force: true });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      const raf = (time) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      if (ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    }

    let gsapContext;
    if (gsap && ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      if (CustomEase) gsap.registerPlugin(CustomEase);
      if (SplitText) gsap.registerPlugin(SplitText);

      gsapContext = gsap.context(() => {
        if (SplitText) {
          gsap.utils.toArray(".title-anim").forEach((element) => {
            const split = new SplitText(element, { type: "words,lines" });
            splitInstances.push(split);
            gsap.set(element, { perspective: 400 });
            gsap.from(split.lines, {
              duration: 1,
              delay: 0.3,
              opacity: 0,
              rotationX: -80,
              force3D: true,
              transformOrigin: "top center -50",
              stagger: 0.1,
              scrollTrigger: {
                trigger: element,
                start: "top 90%",
                end: "bottom 60%",
                toggleActions: "play none none none"
              }
            });
          });
        }

        document.querySelectorAll(".reveal-text").forEach((element) => {
          element.dataset.originalText = element.textContent;
          element.innerHTML = element.textContent.replace(
            /([-A-Za-z0-9!$#%^&*@()_+|~=`{}[\]:";'<>?,./]+)/g,
            '<div class="word">$1</div>'
          );
          element.querySelectorAll(".word").forEach((word) => {
            word.innerHTML = word.textContent.replace(
              /[-A-Za-z0-9!$#%^&*@()_+|~=`{}[\]:";'<>?,./]/g,
              "<div class='perspective'><div class='letter'><div>$&</div></div></div>"
            );
          });
          const timeline = gsap.timeline({
            scrollTrigger: element.classList.contains("reveal-loop") ? undefined : {
              trigger: element,
              toggleActions: "restart none none reset"
            },
            repeat: element.classList.contains("reveal-loop") ? -1 : 0,
            repeatDelay: element.classList.contains("reveal-loop") ? 2 : 0
          });
          timeline.set(element, { autoAlpha: 1 }).fromTo(
            element.querySelectorAll(".letter"),
            { transformOrigin: "center", rotationY: 90, x: 30 },
            { duration: 1.2, rotationY: 0.1, x: 0, stagger: 0.025, ease: "power2.out" }
          );
        });

        [
          [".move-left", { xPercent: 60, start: "0% 90%", end: "100% 10%" }],
          [".move-right", { xPercent: -50, start: "0% 90%", end: "100% 10%" }],
          [".move-top", { yPercent: -70, start: "0% 85%", end: "100% 10%" }],
          [".move-bottom", { yPercent: 80, start: "0% 5%", end: "100% 0%" }]
        ].forEach(([selector, values]) => {
          document.querySelectorAll(selector).forEach((element) => {
            gsap.to(element, {
              ...values,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: values.start,
                end: values.end,
                scrub: true
              }
            });
          });
        });
      }, document.getElementById("smooth-content"));
    }

    const onMouseMove = (event) => {
      const cursor = document.querySelector(".cursor");
      const inner = document.querySelector(".cursor-inner");
      if (cursor) cursor.style.transform = `translate3d(calc(${event.clientX}px - 50%), calc(${event.clientY}px - 50%), 0)`;
      if (inner) {
        inner.style.left = `${event.clientX}px`;
        inner.style.top = `${event.clientY}px`;
      }
      if (gsap) {
        document.querySelectorAll(".moveContent").forEach((element, index) => {
          gsap.to(element, {
            x: ((event.pageX - window.innerWidth / 2) / 65) * (index + 1),
            y: ((event.pageY - window.innerHeight / 2) / 65) * (index + 1)
          });
        });
        const tilt = event.target.closest?.(".tilt-img");
        if (tilt) {
          const rect = tilt.getBoundingClientRect();
          gsap.to(tilt, {
            rotateY: ((event.clientX - rect.left - rect.width / 2) / rect.width) * 30,
            rotateX: ((event.clientY - rect.top - rect.height / 2) / rect.height) * -30,
            transformPerspective: 2000,
            ease: "power2.out",
            duration: 0.3
          });
        }
      }
    };
    const onMouseOver = (event) => {
      if (event.target.closest("a,button")) document.querySelector(".cursor")?.classList.add("hover");
    };
    const onMouseOut = (event) => {
      if (event.target.closest("a,button")) document.querySelector(".cursor")?.classList.remove("hover");
      const tilt = event.target.closest?.(".tilt-img");
      if (tilt && gsap) gsap.to(tilt, { rotateY: 0, rotateX: 0, duration: 0.5, ease: "power2.out" });
    };
    const onDocumentClick = (event) => {
      const button = event.target.closest(".plusBtn,.minusBtn");
      if (!button) return;
      const input = button.parentElement?.querySelector(".count");
      if (!input) return;
      input.value = String(Math.max(0, Number(input.value) + (button.classList.contains("plusBtn") ? 1 : -1)));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("click", onDocumentClick);

    window.scrollCue?.init?.();
    const scrollCueTimer = window.setTimeout(() => {
      window.scrollCue?.update?.();
    }, 275);
    const scrollTriggerTimer = window.setTimeout(() => ScrollTrigger?.refresh(), 50);

    return () => {
      window.clearTimeout(scrollCueTimer);
      window.clearTimeout(scrollTriggerTimer);
      cleanups.forEach((cleanup) => cleanup());
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("click", onDocumentClick);
      swipers.forEach((swiper) => swiper.destroy(true, true));
      gsapContext?.revert();
      splitInstances.forEach((split) => split.revert?.());
      document.querySelectorAll(".reveal-text[data-original-text]").forEach((element) => {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
      });
      if (frame) cancelAnimationFrame(frame);
      lenis?.destroy?.();
    };
  }, [pageSlug, pathname]);
}
