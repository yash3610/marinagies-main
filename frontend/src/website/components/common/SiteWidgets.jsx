import { useEffect, useState } from "react";

function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => localStorage.getItem("marineaegis_theme") || "theme-light");

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("marineaegis_theme", theme);
  }, [theme]);

  return (
    <div className="switch-theme-mode">
      <label id="switch" className="switch">
        <input
          aria-label="Toggle dark mode"
          type="checkbox"
          className="slider-btn"
          checked={theme === "theme-light"}
          onChange={() => setTheme((value) => value === "theme-light" ? "theme-dark" : "theme-light")}
        />
        <span className="slider round" />
      </label>
    </div>
  );
}

export default function SiteWidgets({ loading }) {
  return (
    <>
      {loading && (
        <div className="preloader-area" id="preloader">
          <div className="spinner">
            <div /><div /><div /><div /><div />
          </div>
        </div>
      )}
      <ThemeSwitcher />
      <div className="cursor"><span className="cursor-text" /></div>
      <div className="cursor-inner" />
    </>
  );
}

