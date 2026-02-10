import { useState } from "react";
import { Card } from "../types";

interface Props {
  card?: Card;
  onSave: (card: Card) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function CardModal({ card, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [priority, setPriority] = useState<Card["priority"]>(
    card?.priority ?? "medium"
  );
  const [sourceUrl, setSourceUrl] = useState(card?.sourceUrl ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: card?.id ?? `card-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      priority,
      sourceUrl: sourceUrl.trim() || undefined,
      sourceName: card?.sourceName,
      createdAt: card?.createdAt ?? Date.now(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3>{card ? "Edit Prompt" : "New Prompt"}</h3>

        <label>
          Headline
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            placeholder="Story headline or topic"
          />
        </label>

        <label>
          Prompt / Notes
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Story angle, writing notes, or prompt details..."
          />
        </label>

        <label>
          Source URL
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Card["priority"])}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <div className="modal-actions">
          {onDelete && (
            <button type="button" className="delete-btn" onClick={onDelete}>
              Delete
            </button>
          )}
          <div className="modal-actions-right">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {card ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
