/**
 * QuestionCard — Renders a single question with its appropriate input
 * -------------------------------------------------------------------
 * Handles:
 *   - Saving answers (PATCH /assessments/:id/answer)
 *   - Clearing answers (DELETE /assessments/:id/answer/:questionId)
 *   - Debouncing + save-state indicator
 */

import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import LikertScale from "./answers/LikertScale";
import FrequencyScale from "./answers/FrequencyScale";
import MultiSelect from "./answers/MultiSelect";

function QuestionCard({
  question,
  initialAnswer,
  index,
  onSaved,
  onCleared,
  assessmentId,
}) {
  const [value, setValue] = useState(initialAnswer?.value || "");
  const [values, setValues] = useState(initialAnswer?.values || []);

  const [saveState, setSaveState] = useState("idle");
  const saveTimer = useRef(null);

  const isAnswered =
    question.type === "multi" ? values.length > 0 : value !== "";

  // ---- Save / Clear ----
  const performSave = async (payload) => {
    if (!assessmentId) return;
    setSaveState("saving");
    try {
      await api.patch(`/assessments/${assessmentId}/answer`, {
        questionId: question._id,
        ...payload,
      });
      setSaveState("saved");
      onSaved?.(question._id, payload);
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  const performClear = async () => {
    if (!assessmentId) return;
    setSaveState("saving");
    try {
      await api.delete(`/assessments/${assessmentId}/answer/${question._id}`);
      setSaveState("saved");
      onCleared?.(question._id);
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  // ---- Debounced scheduling ----
  const scheduleAction = (action) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(action, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // ---- Change handlers ----
  const handleSingleChange = (newValue) => {
    setValue(newValue);
    if (newValue === "") {
      // Cleared answer → DELETE
      scheduleAction(performClear);
    } else {
      // Saved answer → PATCH
      scheduleAction(() => performSave({ value: newValue }));
    }
  };

  const handleMultiChange = (newValues) => {
    setValues(newValues);
    if (newValues.length === 0) {
      // All deselected → DELETE
      scheduleAction(performClear);
    } else {
      scheduleAction(() => performSave({ values: newValues }));
    }
  };

  return (
    <div
      className={`p-4 bg-white rounded-lg border transition ${
        isAnswered ? "border-indigo-200" : "border-gray-100"
      }`}
    >
      {/* Question header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-semibold text-gray-400 mt-0.5 flex-shrink-0">
          Q{index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium">{question.text}</p>
          {question.helper && (
            <p className="text-sm text-gray-500 mt-1">{question.helper}</p>
          )}
        </div>

        <SaveIndicator state={saveState} />
      </div>

      {/* Answer input */}
      <div className="mt-4">
        {question.type === "likert" && (
          <LikertScale value={value} onChange={handleSingleChange} />
        )}
        {question.type === "frequency" && (
          <FrequencyScale
            value={value}
            onChange={handleSingleChange}
            options={question.options}
          />
        )}
        {question.type === "multi" && (
          <MultiSelect
            values={values}
            onChange={handleMultiChange}
            options={question.options}
          />
        )}
      </div>

      {/* Clear hint — subtle tip shown only when answered */}
      {isAnswered && (
        <p className="mt-2 text-xs text-gray-400">
          💡 Tap the selected option again to clear
        </p>
      )}
    </div>
  );
}

function SaveIndicator({ state }) {
  if (state === "idle") return null;
  const config = {
    saving: { color: "text-gray-400", text: "Saving…" },
    saved: { color: "text-green-600", text: "Saved ✓" },
    error: { color: "text-red-600", text: "Failed to save" },
  }[state];

  return (
    <span className={`text-xs ${config.color} flex-shrink-0 whitespace-nowrap`}>
      {config.text}
    </span>
  );
}

export default QuestionCard;