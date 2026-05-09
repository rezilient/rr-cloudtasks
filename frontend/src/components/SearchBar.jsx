import { useState } from "react";

export default function SearchBar({ value, onChange }) {
  const [local, setLocal] = useState(value);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onChange(local);
  };

  const handleClear = () => {
    setLocal("");
    onChange("");
  };

  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search tasks..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onChange(local)}
      />
      {local && (
        <button className="search-clear" onClick={handleClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
}
