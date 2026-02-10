import { useState } from "react";
import { Card } from "../types";

interface Props {
  suggestions: Card[];
  onConfirm: (selected: Card[]) => void;
  onClose: () => void;
}

export default function StorySuggestionsModal({ suggestions, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(suggestions.map((c) => c.id))
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const cards = suggestions.filter((c) => selected.has(c.id));
    onConfirm(cards);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal suggestions-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Story Suggestions</h3>
        <p className="suggestions-desc">
          We found {suggestions.length} prompt{suggestions.length !== 1 ? "s" : ""}. Select the ones you want to add to your Story Feed.
        </p>

        <div className="suggestions-list">
          {suggestions.map((card) => (
            <div
              key={card.id}
              className={`suggestion-card ${selected.has(card.id) ? "suggestion-selected" : ""}`}
              onClick={() => toggle(card.id)}
            >
              <div className="suggestion-check">
                {selected.has(card.id) ? "\u2713" : ""}
              </div>
              <div className="suggestion-body">
                <div className="suggestion-title">{card.title}</div>
                {card.description && (
                  <p className="suggestion-desc-text">
                    {card.description.length > 160
                      ? card.description.slice(0, 160) + "..."
                      : card.description}
                  </p>
                )}
                {card.sourceName && (
                  <span className="suggestion-source">{card.sourceName}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <span className="suggestions-count">
            {selected.size} of {suggestions.length} selected
          </span>
          <div className="modal-actions-right">
            <button type="button" onClick={onClose}>Skip all</button>
            <button
              type="button"
              className="save-btn"
              onClick={handleConfirm}
              disabled={selected.size === 0}
            >
              Add selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
