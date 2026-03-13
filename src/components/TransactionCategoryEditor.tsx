import React, { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  categorizeTransaction,
  getSuggestedCategories,
  getCategoriesGroupedByType,
  TransactionCategory,
} from '@/lib/transactionCategorization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransactionCategoryEditorProps {
  description: string;
  merchantName?: string;
  currentCategory: TransactionCategory;
  onCategoryChange: (category: TransactionCategory) => void;
  disabled?: boolean;
}

export const TransactionCategoryEditor: React.FC<TransactionCategoryEditorProps> = ({
  description,
  merchantName,
  currentCategory,
  onCategoryChange,
  disabled = false,
}) => {
  const [suggestedCategory, setSuggestedCategory] = useState<TransactionCategory | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ category: TransactionCategory; confidence: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categoriesGrouped = getCategoriesGroupedByType();

  // Get automatic suggestion on mount or when description changes
  useEffect(() => {
    if (description) {
      const auto = categorizeTransaction(description, merchantName);
      setSuggestedCategory(auto.category);

      const suggested = getSuggestedCategories(description, merchantName, 3);
      setSuggestions(suggested);
    }
  }, [description, merchantName]);

  const handleCategorySelect = (category: TransactionCategory) => {
    onCategoryChange(category);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (category: TransactionCategory) => {
    onCategoryChange(category);
    setShowSuggestions(false);
  };

  const isAutoSuggested = suggestedCategory === currentCategory;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Select value={currentCategory} onValueChange={handleCategorySelect} disabled={disabled}>
          <SelectTrigger className="w-full relative">
            <div className="flex items-center gap-2">
              {isAutoSuggested && (
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              )}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <div className="space-y-2 p-2">
              {/* Suggested category at top */}
              {suggestedCategory && suggestedCategory !== currentCategory && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Suggestion
                    </p>
                  </div>
                  <SelectItem
                    value={suggestedCategory}
                    className="cursor-pointer hover:bg-primary/10 flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {suggestedCategory}
                    </div>
                  </SelectItem>
                  <div className="my-1 h-px bg-border" />
                </>
              )}

              {/* Expense categories */}
              {categoriesGrouped.expense.length > 0 && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Expenses
                    </p>
                  </div>
                  {categoriesGrouped.expense.map(cat => (
                    <SelectItem key={cat} value={cat} className="cursor-pointer">
                      {cat}
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Income categories */}
              {categoriesGrouped.income.length > 0 && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Income
                    </p>
                  </div>
                  {categoriesGrouped.income.map(cat => (
                    <SelectItem key={cat} value={cat} className="cursor-pointer">
                      {cat}
                    </SelectItem>
                  ))}
                </>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Show suggestions if not using the auto-suggested category */}
      {!isAutoSuggested && suggestions.length > 0 && suggestedCategory !== currentCategory && (
        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Show AI suggestions
          </button>

          {showSuggestions && (
            <div className="space-y-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion.category)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground group-hover:text-primary">
                      {suggestion.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(suggestion.confidence * 100).toFixed(0)}% match
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confidence indicator for auto-suggestion */}
      {isAutoSuggested && suggestedCategory && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" /> Auto-categorized with high confidence
        </p>
      )}
    </div>
  );
};
