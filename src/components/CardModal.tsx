import { useState } from "react";
import { Card } from "../types";

interface Props {
  card?: Card;
  onSave: (title: string, description: string, priority: Card["priority"]) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function CardModal({ card, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [priority, setPriority] = useState<Card["priority"]>(
    card?.priority ?? "medium"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim(), priority);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3>{card ? "Edit Card" : "New Card"}</h3>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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
