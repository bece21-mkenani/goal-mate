import axios from "axios";
import { motion, type Variants } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";

const apiUrl = import.meta.env.VITE_API_URL!;

interface Flashcard {
  id: string;
  user_id: string;
  subject: string;
  front: string;
  back: string;
  created_at: string;
}

interface FlashcardProps {
  onStartReview: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ onStartReview }) => {
  useContext(ThemeContext);
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(5);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [dueCardsCount, setDueCardsCount] = useState<number | null>(null);
  const [isFetchingCount, setIsFetchingCount] = useState(true);

  const fetchReviewCount = useCallback(async () => {
    setIsFetchingCount(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(`${apiUrl}/flashcards/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDueCardsCount(response.data.reviewDeck?.length || 0);
    } catch (err) {
      console.error("Failed to fetch review deck:", err);
      setError("Could not fetch review cards.");
      setDueCardsCount(0);
    } finally {
      setIsFetchingCount(false);
    }
  }, []);

  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("flashcard_history") || "[]"
    );
    setFlashcards(savedHistory);
    fetchReviewCount();
  }, [fetchReviewCount]);

  useEffect(() => {
    if (flashcards.length > 0) {
      localStorage.setItem("flashcard_history", JSON.stringify(flashcards));
    }
  }, [flashcards]);

  const handleGenerateFlashcards = async () => {
    if (!subject.trim() || count <= 0) {
      setError("Please enter a subject and count > 0");
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("auth_token");
      const userResponse = await axios.get(`${apiUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userResponse.data.user.id;

      const response = await axios.post(
        `${apiUrl}/flashcard/generate`,
        { userId, subject, count },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newCards = response.data.flashcards || [];
      setFlashcards((prev) => [...newCards, ...prev]);
      setError(null);
      await fetchReviewCount();
    } catch (err: any) {
      console.error(
        "Generate Flashcards Error:",
        err.response?.data || err.message
      );
      setError("Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const flashcardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const handleClearHistory = () => {
    localStorage.removeItem("flashcard_history");
    setFlashcards([]);
  };

  const renderReviewButtonContent = () => {
    if (isFetchingCount) {
      return (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span className="ml-2">Loading review...</span>
        </>
      );
    }
    if (dueCardsCount === 0) {
      return (
        <>
          <CheckCircle size={20} />
          <span className="ml-2">All caught up!</span>
        </>
      );
    }
    return (
      <>
        <Sparkles size={20} />
        <span className="ml-2">
          Review {dueCardsCount} {dueCardsCount === 1 ? "card" : "cards"}
        </span>
        <ChevronRight size={20} className="ml-auto" />
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flashcards
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-md mx-auto">
          Generate new cards or review your smart deck.
        </p>
      </div>

      {/* Spaced Repetition Review Block */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Smart Review
        </h3>
        <motion.button
          onClick={onStartReview}
          disabled={isFetchingCount || dueCardsCount === 0}
          className="w-full flex items-center p-4 rounded-lg text-lg font-semibold shadow-md transition-all duration-300
                     bg-gradient-to-r from-blue-600 to-purple-600 text-white
                     hover:from-blue-700 hover:to-purple-700
                     disabled:opacity-60 disabled:cursor-not-allowed"
          whileHover={{
            scale: isFetchingCount || dueCardsCount === 0 ? 1 : 1.02,
          }}
          whileTap={{
            scale: isFetchingCount || dueCardsCount === 0 ? 1 : 0.98,
          }}
        >
          {renderReviewButtonContent()}
        </motion.button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Let's Review your cards in a smart way, please generate cards first!!.
        </p>
      </motion.div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 dark:text-red-400 text-center mb-4 text-sm sm:text-base">
          {error}
        </p>
      )}

      {/* Card Generation Block */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Generate New Cards
        </h3>
        <div className="space-y-4 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject or Topic
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter Subject or Topic (e.g., Calculus or Statistics or Vectors)..."
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Flashcards
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="5"
              min="1"
              max="20"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating || !subject.trim() || count <= 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md text-sm sm:text-base disabled:opacity-50 flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />{" "}
                  Generating...
                </>
              ) : (
                `Generate ${count} Flashcards`
              )}
            </motion.button>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm sm:text-base hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {showHistory
                ? "Hide Generation History"
                : "Show Generation History"}
            </button>
          </div>
        </div>
      </div>

      {/* Flashcards / Local Storage History */}
      {showHistory && (
        <motion.div
          variants={flashcardVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-md shadow-inner"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Local Generation History
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-sm px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              Clear History
            </button>
          </div>

          {flashcards.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Your generated cards will appear here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flashcards.map((card) => (
                <motion.div
                  key={card.id}
                  onClick={() =>
                    setFlippedCard(flippedCard === card.id ? null : card.id)
                  }
                  className="cursor-pointer border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700 transition-transform hover:scale-[1.02]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1 text-sm">
                    {card.subject}
                  </h4>
                  {flippedCard === card.id ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {card.back}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">
                      {card.front}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Flashcard;
