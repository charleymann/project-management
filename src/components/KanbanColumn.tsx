import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column, Card } from "../types";
import KanbanCard from "./KanbanCard";

interface Props {
  column: Column;
  cards: Card[];
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onFetchStories?: () => void;
  isFetching?: boolean;
  fetchError?: string | null;
}

export default function KanbanColumn({
  column,
  cards,
  onAddCard,
  onEditCard,
  onFetchStories,
  isFetching,
  fetchError,
}: Props) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="column">
      <div className="column-header">
        <h2>{column.title}</h2>
        <span className="column-count">{cards.length}</span>
      </div>
      {onFetchStories && (
        <div className="fetch-bar">
          <button
            className="fetch-btn"
            onClick={onFetchStories}
            disabled={isFetching}
          >
            {isFetching ? "Fetching..." : "Fetch story ideas"}
          </button>
          {fetchError && <p className="fetch-error">{fetchError}</p>}
        </div>
      )}
      <SortableContext
        items={column.cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="column-cards">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
            />
          ))}
        </div>
      </SortableContext>
      <button className="add-card-btn" onClick={onAddCard}>
        + Add prompt
      </button>
    </div>
  );
}
