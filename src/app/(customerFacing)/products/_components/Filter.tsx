"use client";
import React, { useState } from "react";
import "./filter.css"; // Import your CSS

type FilterProps = {
  onFilterSelect: (value: string) => void;
};

function MenuItems({ onClickItem }: { onClickItem: (filterKey: string) => void }) {
  return (
    <ul className="flex flex-col gap-2">
      <button onClick={() => onClickItem("newest")}>Newest</button>
      <button onClick={() => onClickItem("oldest")}>Oldest</button>
      <button onClick={() => onClickItem("az")}>A-Z</button>
      <button onClick={() => onClickItem("za")}>Z-A</button>
      <button onClick={() => onClickItem("lowest")}>Lowest Price</button>
      <button onClick={() => onClickItem("highest")}>Highest Price</button>
    </ul>
  );
}

export default function Filter({ onFilterSelect }: FilterProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleItemClick = (filterKey: string) => {
    onFilterSelect(filterKey);
    setMenuOpen(false);
  };

  return (
    <div className="flex flex-col">
      {/* Hamburger Menu Icon */}
      <button
        type="button"
        onClick={toggleMenu}
        className="p-2 focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Always rendered. Toggling .open or .closed lets CSS handle the animation */}
      <div className={`menuContainer ${menuOpen ? "open" : "closed"}`}>
        <MenuItems onClickItem={handleItemClick} />
      </div>
    </div>
  );
}
