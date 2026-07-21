"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api, ApiError } from "@/lib/api";
import { subscribeToInterview } from "@/lib/websocket";

interface Question {
  question_id: number;
  question: string;
  sequence: number;
  category: string;
  max_questions?: number;
}

export function useInterviewSession(
  interviewId: number,
  sessionUuid: string,
  onCompleted?: () => void
) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false);
  const fetchInFlightRef = useRef(false);

  const fetchQuestion = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;

    try {
      const data = await api<Question>(`/interviews/${interviewId}/current-question`);
      setQuestion(data);
      if (data.max_questions) setMaxQuestions(data.max_questions);
      setInterviewComplete(false);
      setAwaitingNextQuestion(false);
    } catch (err) {
      // 404 = next question not ready yet; network errors retry on next poll.
      if (!(err instanceof ApiError && err.status === 404)) {
        // Swallow transient failures during polling — do not surface to the UI.
      }
      setQuestion(null);
    } finally {
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    if (loading || interviewComplete || question) return;

    void fetchQuestion();
    const pollMs = awaitingNextQuestion ? 2000 : 4000;
    const interval = setInterval(() => {
      void fetchQuestion();
    }, pollMs);

    return () => clearInterval(interval);
  }, [loading, question, interviewComplete, awaitingNextQuestion, fetchQuestion]);

  useEffect(() => {
    if (!sessionUuid) return;

    const unsubscribe = subscribeToInterview(sessionUuid, {
      onQuestion: (data) => {
        setQuestion(data as Question);
        setInterviewComplete(false);
        setAwaitingNextQuestion(false);
      },
      onCompleted: () => {
        setInterviewComplete(true);
        onCompleted?.();
      },
    });

    return unsubscribe;
  }, [sessionUuid, onCompleted]);

  const markAwaitingNextQuestion = useCallback(() => {
    setAwaitingNextQuestion(true);
    setQuestion(null);
    void fetchQuestion();
  }, [fetchQuestion]);

  return {
    question,
    loading,
    maxQuestions,
    interviewComplete,
    awaitingNextQuestion,
    markAwaitingNextQuestion,
    refetchQuestion: fetchQuestion,
  };
}
