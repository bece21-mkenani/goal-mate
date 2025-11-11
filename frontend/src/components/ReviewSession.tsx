import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, RotateCcw, Check, Brain, Layers } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";

const apiUrl = import.meta.env.VITE_API_URL!;

interface ReviewCard {
  id: string;
  user_id: string;
  subject: string;
  front: string;
  back: string;
  created_at: string;
  due_date: string;
  interval: number;
  ease_factor: number;
  review_count: number;
}

interface ReviewSessionProps {
  onSessionComplete: () => void;
}

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  }),
};

const ReviewSession: React.FC<ReviewSessionProps> = ({ onSessionComplete }) => {
  useContext(ThemeContext);
  const [deck, setDeck] = useState<ReviewCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotCount, setForgotCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [animationDirection, setAnimationDirection] = useState(1);

  const totalCards = deck.length;
  const isComplete = currentIndex >= totalCards;

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(`${apiUrl}/flashcards/review`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const shuffledDeck = response.data.reviewDeck.sort(
          () => Math.random() - 0.5
        );
        setDeck(shuffledDeck);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch review deck:", err);
        setError("Could not fetch review cards. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeck();
  }, []);

  const handleReview = async (performance: "forgot" | "good" | "easy") => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (performance === "forgot") setForgotCount((c) => c + 1);
    if (performance === "good") setGoodCount((c) => c + 1);
    if (performance === "easy") setEasyCount((c) => c + 1);

    try {
      const card = deck[currentIndex];
      const token = localStorage.getItem("auth_token");
      await axios.post(
        `${apiUrl}/flashcards/review/${card.id}`,
        { performance },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnimationDirection(1);
      setIsFlipped(false);
      setCurrentIndex((c) => c + 1);
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setError("Failed to save review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-700 dark:text-gray-300">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="mt-4 text-lg">Loading your review deck...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-red-500">
        <p className="text-lg">{error}</p>
        <button
          onClick={onSessionComplete}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md"
        >
          Back to Flashcards
        </button>
      </div>
    );
  }

  if (!isLoading && deck.length === 0 && !isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-700 dark:text-gray-300">
        <Check size={48} className="text-green-500" />
        <h3 className="text-2xl font-bold mt-4">All Caught Up!</h3>
        <p className="text-lg mt-2">You have no cards due for review.</p>
        <motion.button
          onClick={onSessionComplete}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Flashcards
        </motion.button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-[70vh] p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Brain size={48} className="text-blue-500" />
        <h3 className="text-2xl sm:text-3xl font-bold mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
          Review Complete!
        </h3>
        <p className="text-base sm:text-lg mt-2 text-gray-700 dark:text-gray-300 text-center">
          You've completed this session. Great work!
        </p>

        <div className="my-6 text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center space-y-1">
          <p>
            Total Cards Reviewed:{" "}
            <span className="font-bold">{totalCards}</span>
          </p>
          <p>
            Easy: <span className="font-bold text-green-500">{easyCount}</span>
          </p>
          <p>
            Good: <span className="font-bold text-blue-500">{goodCount}</span>
          </p>
          <p>
            Forgot:{" "}
            <span className="font-bold text-red-500">{forgotCount}</span>
          </p>
        </div>

        <motion.button
          onClick={onSessionComplete}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-base sm:text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Flashcards
        </motion.button>
      </motion.div>
    );
  }

  const card = deck[currentIndex];

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header and Progress */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Review Session
        </h2>
        <button
          onClick={onSessionComplete}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
          Card {currentIndex + 1} of {totalCards}
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            initial={{ width: `${(currentIndex / totalCards) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="relative h-[300px] sm:h-[400px] mb-6">
        <AnimatePresence initial={false} custom={animationDirection}>
          <motion.div
            key={currentIndex}
            className="absolute w-full h-full cursor-pointer rounded-xl shadow-lg border
                      bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            onClick={() => setIsFlipped((f) => !f)}
            variants={cardVariants}
            custom={animationDirection}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              className="w-full h-full flex flex-col p-4 sm:p-6"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Card Front */}
              <div
                className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {card.subject}
                    </p>
                    <Layers size={16} className="text-gray-400" />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {card.front}
                  </p>
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Click to show answer
                </p>
              </div>

              {/* Card Back */}
              <div
                className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between"
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Answer
                    </p>
                    <RotateCcw size={16} className="text-gray-400" />
                  </div>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {card.back}
                  </p>
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  How did you do?
                </p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Review Buttons */}
      <AnimatePresence>
        {isFlipped && !isSubmitting && (
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <motion.button
              onClick={() => handleReview("forgot")}
              className="flex-1 py-3 px-4 text-base font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Forgot
            </motion.button>
            <motion.button
              onClick={() => handleReview("good")}
              className="flex-1 py-3 px-4 text-base font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Good
            </motion.button>
            <motion.button
              onClick={() => handleReview("easy")}
              className="flex-1 py-3 px-4 text-base font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Easy
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      )}
    </motion.div>
  );
};

export default ReviewSession;
