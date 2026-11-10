import React from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import MathText from "./MathText";

const OnlineTestAnswerReview = ({ review = [] }) => (
  <div className="space-y-5 rounded-xl bg-white p-4 text-slate-900">
    {review.map((question, questionIndex) => {
      const unanswered = question.selectedOption == null;
      return (
      <section
        key={questionIndex}
        className={`rounded-lg border-b pb-4 last:border-0 ${
          unanswered ? "border-amber-300 bg-amber-50 p-3" : "border-slate-200"
        }`}
      >
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900">
            Q{questionIndex + 1}. <MathText text={question.questionText} />
          </p>
          {unanswered && (
            <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900">
              Not answered
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {question.options.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                optionIndex === question.correctOption
                  ? "bg-emerald-50 text-emerald-800"
                  : optionIndex === question.selectedOption
                    ? "bg-red-50 text-red-800"
                    : "text-slate-800"
              }`}
            >
              {optionIndex === question.correctOption
                ? <FaCheckCircle aria-label="Correct answer" />
                : optionIndex === question.selectedOption
                  ? <FaTimesCircle aria-label="Student's answer" />
                  : <span className="w-4" />}
              {String.fromCharCode(65 + optionIndex)}. <MathText text={option} />
            </div>
          ))}
        </div>
        {question.explanation && (
          <p className="mt-2 text-xs text-slate-700">Explanation: {question.explanation}</p>
        )}
      </section>
      );
    })}
  </div>
);

export default OnlineTestAnswerReview;
