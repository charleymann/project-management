import { useState } from "react";

export interface FetchCriteria {
  topic: string;
  practiceArea: string;
  notes: string;
}

interface Props {
  onSubmit: (criteria: FetchCriteria) => void;
  onClose: () => void;
  isFetching: boolean;
}

const PRACTICE_AREAS = [
  "Any",
  "Corporate / Business",
  "Criminal Defense",
  "Employment & Labor",
  "Family Law",
  "Immigration",
  "Intellectual Property",
  "Litigation",
  "Personal Injury",
  "Real Estate",
  "Tax",
];

export default function FetchFormModal({ onSubmit, onClose, isFetching }: Props) {
  const [topic, setTopic] = useState("");
  const [practiceArea, setPracticeArea] = useState("Any");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ topic: topic.trim(), practiceArea, notes: notes.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal fetch-form-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3>Find Story Ideas</h3>
        <p className="fetch-form-desc">
          Guide the search to find relevant prompts for your next piece.
        </p>

        <label>
          Topic or keyword
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='e.g. "data privacy", "mergers"'
            autoFocus
          />
        </label>

        <label>
          Practice area
          <select
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.target.value)}
          >
            {PRACTICE_AREAS.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </label>

        <label>
          Additional guidance
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any angle or focus you want, e.g. 'client-facing blog post' or 'thought leadership for partners'..."
          />
        </label>

        <div className="modal-actions">
          <div className="modal-actions-right">
            <button type="button" onClick={onClose} disabled={isFetching}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isFetching}>
              {isFetching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
