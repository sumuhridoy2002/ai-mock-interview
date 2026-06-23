"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
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

  const fetchQuestion = useCallback(async () => {
    try {
      const data = await api<Question>(`/interviews/${interviewId}/current-question`);
      setQuestion(data);
      if (data.max_questions) setMaxQuestions(data.max_questions);
      setInterviewComplete(false);
      setAwaitingNextQuestion(false);
    } catch {
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    if (loading || question || interviewComplete) return;

    const interval = setInterval(() => {
      void fetchQuestion();
    }, 3000);

    return () => clearInterval(interval);
  }, [loading, question, interviewComplete, fetchQuestion]);

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
  }, []);

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
