import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Board, Card } from "./types";
import { loadBoard, saveBoard } from "./boardData";
import { useAuth } from "./AuthContext";
import KanbanColumn from "./components/KanbanColumn";
import KanbanCard from "./components/KanbanCard";
import CardModal from "./components/CardModal";
import LoginPage from "./components/LoginPage";

function App() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <KanbanApp user={user} onSignOut={signOut} />;
}

function KanbanApp({
  user,
  onSignOut,
}: {
  user: { sub: string; name: string; email: string; picture: string };
  onSignOut: () => void;
}) {
  const [board, setBoard] = useState<Board>(() => loadBoard(user.sub));
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);

  useEffect(() => {
    saveBoard(user.sub, board);
  }, [board, user.sub]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumnByCardId = useCallback(
    (cardId: string) => {
      return board.columns.find((col) => col.cardIds.includes(cardId));
    },
    [board.columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = board.cards[event.active.id as string];
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumnByCardId(activeId);
    const overCol =
      board.columns.find((c) => c.id === overId) || findColumnByCardId(overId);

    if (!sourceCol || !overCol || sourceCol.id === overCol.id) return;

    setBoard((prev) => {
      const newColumns = prev.columns.map((col) => {
        if (col.id === sourceCol.id) {
          return {
            ...col,
            cardIds: col.cardIds.filter((id) => id !== activeId),
          };
        }
        if (col.id === overCol.id) {
          const overIndex = col.cardIds.indexOf(overId);
          const insertIndex = overIndex >= 0 ? overIndex : col.cardIds.length;
          return {
            ...col,
            cardIds: [
              ...col.cardIds.slice(0, insertIndex),
              activeId,
              ...col.cardIds.slice(insertIndex),
            ],
          };
        }
        return col;
      });
      return { ...prev, columns: newColumns };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const column = findColumnByCardId(activeId);
    if (!column) return;

    if (column.cardIds.includes(overId)) {
      setBoard((prev) => {
        const newColumns = prev.columns.map((col) => {
          if (col.id !== column.id) return col;
          const oldIndex = col.cardIds.indexOf(activeId);
          const newIndex = col.cardIds.indexOf(overId);
          return { ...col, cardIds: arrayMove(col.cardIds, oldIndex, newIndex) };
        });
        return { ...prev, columns: newColumns };
      });
    }
  };

  const handleAddCard = (
    columnId: string,
    title: string,
    description: string,
    priority: Card["priority"]
  ) => {
    const id = `card-${Date.now()}`;
    const card: Card = {
      id,
      title,
      description,
      priority,
      createdAt: Date.now(),
    };
    setBoard((prev) => ({
      ...prev,
      cards: { ...prev.cards, [id]: card },
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? { ...col, cardIds: [...col.cardIds, id] }
          : col
      ),
    }));
    setAddingToColumn(null);
  };

  const handleUpdateCard = (
    cardId: string,
    title: string,
    description: string,
    priority: Card["priority"]
  ) => {
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], title, description, priority },
      },
    }));
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    setBoard((prev) => {
      const { [cardId]: _, ...remainingCards } = prev.cards;
      return {
        cards: remainingCards,
        columns: prev.columns.map((col) => ({
          ...col,
          cardIds: col.cardIds.filter((id) => id !== cardId),
        })),
      };
    });
    setEditingCard(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kanban Board</h1>
        <div className="user-info">
          {user.picture && (
            <img
              src={user.picture}
              alt=""
              className="user-avatar"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="user-name">{user.name}</span>
          <button className="sign-out-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={column.cardIds.map((id) => board.cards[id]).filter(Boolean)}
              onAddCard={() => setAddingToColumn(column.id)}
              onEditCard={setEditingCard}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <KanbanCard card={activeCard} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {addingToColumn && (
        <CardModal
          onSave={(title, description, priority) =>
            handleAddCard(addingToColumn, title, description, priority)
          }
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {editingCard && (
        <CardModal
          card={editingCard}
          onSave={(title, description, priority) =>
            handleUpdateCard(editingCard.id, title, description, priority)
          }
          onDelete={() => handleDeleteCard(editingCard.id)}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}

export default App;
