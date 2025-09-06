// Animated cosmic background (stars + nebula) that sits behind all content
// - Theme-aware (light/dark)
// - Respects prefers-reduced-motion
// - Pure CSS animations for performance
export default function CosmicBackground({ darkMode = true }) {
  return (
    <div
      className="cosmic-bg fixed inset-0 pointer-events-none"
      style={{ zIndex: -10 }}
      aria-hidden="true"
      data-theme={darkMode ? "dark" : "light"}
    >
      {/* Base gradient layer for tone and visibility */}
      <div className="cosmic-base" />

      {/* Light theme: Weather scene (clouds + gentle snow) */}
      <div className="weather-scene" aria-hidden>
        <div className="weather-sky">
          <div className="weather-sky-gradient" />
          <div className="sun-rays" />
          <div className="weather-birds">
            <div className="bird" />
            <div className="bird" />
            <div className="bird" />
            <div className="bird" />
          </div>
          <div className="clouds layer-1" />
          <div className="clouds layer-2" />
          <div className="clouds layer-3" />
        </div>
        <div className="weather-snow layer-1" />
        <div className="weather-snow layer-2" />
        <div className="weather-snow layer-3" />
      </div>

      {/* Dark theme: Cosmic scene (nebulae, stars, shooting stars, haze) */}
      <div className="cosmic-scene" aria-hidden>
        {/* Galaxies disabled by CSS; keeping markup optional */}
        <div className="cosmic-nebula cosmic-nebula-a" />
        <div className="cosmic-nebula cosmic-nebula-b" />

        <div className="cosmic-stars cosmic-stars-sm" style={{ animationDelay: "-2s" }} />
        <div className="cosmic-stars cosmic-stars-md" style={{ animationDelay: "-4s" }} />
        <div className="cosmic-stars cosmic-stars-lg" style={{ animationDelay: "-6s" }} />

        <div className="shooting-stars">
          <div className="shooting-star" />
          <div className="shooting-star" />
          <div className="shooting-star" />
          <div className="shooting-star" />
          <div className="shooting-star" />
        </div>

        <div className="cosmic-haze" />
      </div>
    </div>
  );
}
