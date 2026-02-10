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
import { fetchStoryIdeas, SearchCriteria } from "./storyFetcher";
import { useAuth } from "./auth";
import KanbanColumn from "./components/KanbanColumn";
import KanbanCard from "./components/KanbanCard";
import CardModal from "./components/CardModal";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import FetchFormModal, { FetchCriteria } from "./components/FetchFormModal";
import StorySuggestionsModal from "./components/StorySuggestionsModal";

type Page = "login" | "home" | "board";

function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<Page>(user ? "home" : "login");

  // If user logs out, go back to login
  useEffect(() => {
    if (!user) setPage("login");
  }, [user]);

  if (page === "login" || !user) {
    return <LoginPage onSuccess={() => setPage("home")} />;
  }

  if (page === "home") {
    return <HomePage onGoToBoard={() => setPage("board")} />;
  }

  return <StoryBoard onGoHome={() => setPage("home")} onLogout={logout} />;
}

function StoryBoard({
  onGoHome,
  onLogout,
}: {
  onGoHome: () => void;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>(loadBoard);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);

  // Fetch flow state
  const [showFetchForm, setShowFetchForm] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Card[] | null>(null);

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumnByCardId = useCallback(
    (cardId: string) => {
      return board.columns.find((col) => col.cardIds.includes(cardId));
    },
    [board.columns]
  );

  const handleOpenFetchForm = () => {
    setFetchError(null);
    setShowFetchForm(true);
  };

  const handleFetchSubmit = async (formCriteria: FetchCriteria) => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const criteria: SearchCriteria = {
        topic: formCriteria.topic,
        practiceArea: formCriteria.practiceArea,
        notes: formCriteria.notes,
      };
      const newCards = await fetchStoryIdeas(board.cards, criteria);
      if (newCards.length === 0) {
        setFetchError("No new stories found. Try different keywords.");
        return;
      }
      setShowFetchForm(false);
      setSuggestions(newCards);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to fetch stories."
      );
    } finally {
      setIsFetching(false);
    }
  };

  const handleAcceptSuggestions = (selected: Card[]) => {
    if (selected.length > 0) {
      setBoard((prev) => {
        const newCardsMap: Record<string, Card> = {};
        const newIds: string[] = [];
        for (const card of selected) {
          newCardsMap[card.id] = card;
          newIds.push(card.id);
        }
        return {
          ...prev,
          cards: { ...prev.cards, ...newCardsMap },
          columns: prev.columns.map((col) =>
            col.id === "story-feed"
              ? { ...col, cardIds: [...newIds, ...col.cardIds] }
              : col
          ),
        };
      });
    }
    setSuggestions(null);
  };

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

  const handleUpdateCard = (updated: Card) => {
    setBoard((prev) => ({
      ...prev,
      cards: { ...prev.cards, [updated.id]: updated },
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
        <div className="brand">
          <h1>Red Kraken Creative</h1>
          <span className="brand-sub">Story Prompts for Law Firms</span>
        </div>
        <div className="user-info">
          <button className="nav-btn" onClick={onGoHome}>Home</button>
          <span className="user-name">{user?.displayName}</span>
          <button className="sign-out-btn" onClick={onLogout}>
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
              onFetchStories={
                column.id === "story-feed" ? handleOpenFetchForm : undefined
              }
              isFetching={column.id === "story-feed" ? isFetching : false}
              fetchError={column.id === "story-feed" ? fetchError : null}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <KanbanCard card={activeCard} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {showFetchForm && (
        <FetchFormModal
          onSubmit={handleFetchSubmit}
          onClose={() => setShowFetchForm(false)}
          isFetching={isFetching}
        />
      )}

      {suggestions && (
        <StorySuggestionsModal
          suggestions={suggestions}
          onConfirm={handleAcceptSuggestions}
          onClose={() => setSuggestions(null)}
        />
      )}

      {addingToColumn && (
        <CardModal
          onSave={(card) =>
            handleAddCard(addingToColumn, card.title, card.description, card.priority)
          }
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {editingCard && (
        <CardModal
          card={editingCard}
          onSave={handleUpdateCard}
          onDelete={() => handleDeleteCard(editingCard.id)}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}

export default App;
