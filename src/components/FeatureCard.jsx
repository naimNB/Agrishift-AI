export default function FeatureCard({ icon, title, text, onClick, actionText, href }) {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (href && href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const isInteractive = Boolean(onClick || href);

  return (
    <div
      onClick={isInteractive ? handleClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(e); } } : undefined}
      className="
      w-full
      sm:w-[250px]
      p-5
      rounded-2xl
      bg-black/40
      backdrop-blur-xl
      border
      border-white/20
      text-white
      hover:scale-105
      hover:border-green-400/40
      focus-visible:outline-2
      focus-visible:outline-offset-2
      focus-visible:outline-green-400
      transition
      cursor-pointer
      group
      "
    >

      <div className="
      text-4xl
      mb-4
      " aria-hidden="true">
        {icon}
      </div>

      <h3 className="
      font-bold
      text-lg
      group-hover:text-green-300
      transition
      ">
        {title}
      </h3>

      <p className="
      text-sm
      text-gray-300
      mt-2
      ">
        {text}
      </p>

      {actionText && (
        <span
          className="
          inline-flex
          items-center
          gap-1
          mt-3
          text-xs
          font-semibold
          text-green-400
          group-hover:translate-x-1
          transition
          "
        >
          {actionText} →
        </span>
      )}

    </div>
  )
}