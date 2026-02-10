import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "../types";

interface Props {
  card: Card;
  isOverlay?: boolean;
  onEdit?: () => void;
}

const priorityColors: Record<Card["priority"], string> = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
};

export default function KanbanCard({ card, isOverlay, onEdit }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${isOverlay ? "card-overlay" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="card-header">
        <span
          className="priority-dot"
          style={{ backgroundColor: priorityColors[card.priority] }}
          title={card.priority}
        />
        <span className="card-title">{card.title}</span>
        {onEdit && (
          <button
            className="card-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            &#x270E;
          </button>
        )}
      </div>
      {card.description && (
        <p className="card-description">{card.description}</p>
      )}
      {card.sourceName && (
        <span className="card-source">
          {card.sourceUrl ? (
            <a
              href={card.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {card.sourceName}
            </a>
          ) : (
            card.sourceName
          )}
        </span>
      )}
    </div>
  );
}
