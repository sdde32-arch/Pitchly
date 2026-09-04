import React from "react";
import { Clock, X, Search, Sparkles } from "lucide-react";

interface RecentSearchTagsProps {
  searches: string[];
  activeQuery?: string;
  onSelectTag: (term: string) => void;
  onClearAll?: () => void;
  onRemoveTag?: (term: string, e: React.MouseEvent) => void;
  className?: string;
}

export const RecentSearchTags: React.FC<RecentSearchTagsProps> = ({
  searches,
  activeQuery = "",
  onSelectTag,
  onClearAll,
  onRemoveTag,
  className = "",
}) => {
  // Only display the 3 most recent
  const topThree = searches.slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  const normalizedActive = activeQuery.toLowerCase().trim();

  return (
    <div
      id="recent-searches-section"
      className={`flex items-center flex-wrap gap-2 text-xs select-none ${className}`}
    >
      {/* Label with History icon */}
      <div className="flex items-center gap-1.5 text-text-tertiary font-semibold mr-1 py-0.5">
        <Clock size={12} className="text-text-tertiary" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Recent:</span>
      </div>

      {/* 3 Clickable Tags */}
      <div className="flex items-center flex-wrap gap-1.5">
        {topThree.map((term, index) => {
          const isActive = normalizedActive === term.toLowerCase().trim();

          return (
            <div
              key={`${term}-${index}`}
              className="inline-flex items-center group"
            >
              <button
                id={`recent-search-tag-${index}`}
                type="button"
                onClick={() => onSelectTag(term)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border active:scale-95 ${
                  isActive
                    ? "bg-primary-lime text-accent-text border-primary-lime font-black shadow-xs"
                    : "bg-surface-card hover:bg-surface-raised text-text-secondary hover:text-text-primary border-border-subtle hover:border-primary-lime/40 shadow-xs"
                }`}
                title={`Search for "${term}"`}
              >
                <Search size={11} className={isActive ? "text-accent-text" : "text-text-tertiary group-hover:text-primary-lime"} />
                <span>{term}</span>
              </button>

              {onRemoveTag && (
                <button
                  id={`remove-recent-search-${index}`}
                  type="button"
                  onClick={(e) => onRemoveTag(term, e)}
                  className="opacity-0 group-hover:opacity-100 -ml-2 mr-1 p-0.5 rounded-full hover:bg-surface-raised text-text-tertiary hover:text-text-primary transition-opacity cursor-pointer"
                  title="Remove from recent searches"
                  aria-label={`Remove ${term}`}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional Clear All link */}
      {onClearAll && topThree.length > 0 && (
        <button
          id="clear-all-recent-searches-btn"
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-medium text-text-tertiary hover:text-red-400 transition-colors cursor-pointer ml-auto pl-2 underline-offset-2 hover:underline"
          title="Clear search history"
        >
          Clear
        </button>
      )}
    </div>
  );
};
