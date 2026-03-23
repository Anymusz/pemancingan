import React from "react";
import { SearchIcon } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";

/**
 * SearchModal — generic reusable search-and-select modal.
 *
 * Props:
 *   onSearch(query: string): Promise<Array>  — called on open and on every debounced query change
 *   onSelect(item): void                     — called when an item is picked; modal closes automatically
 *   renderItem(item): JSX                    — renders a single result row inside CommandItem
 *   placeholder?: string                     — CommandInput placeholder (default "Cari...")
 *   triggerLabel?: string                    — label on the trigger Button (default "Cari")
 *   emptyMessage?: string                    — shown when results are empty (default "Tidak ada hasil")
 *   disabled?: boolean                       — disables the trigger Button
 *   getItemKey?(item): string|number         — unique key per item; falls back to array index
 *   title?: string                           — accessible modal title (default "Cari")
 */
export function SearchModal({
  onSearch,
  onSelect,
  renderItem,
  placeholder = "Cari...",
  triggerLabel = "Cari",
  emptyMessage = "Tidak ada hasil",
  disabled = false,
  getItemKey,
  title = "Cari",
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const debounceRef = React.useRef(null);

  // Run search whenever query changes (debounced 300 ms)
  React.useEffect(() => {
    if (!open) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await onSearch(query);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, open, onSearch]);

  // Load initial data when modal opens
  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setQuery("");
      setResults([]);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const skeletonRows = Array.from({ length: 4 });

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <SearchIcon className="size-4" />
          {triggerLabel}
        </Button>
      </ModalTrigger>

      <ModalContent className="p-1">
        <ModalTitle className="sr-only">{title}</ModalTitle>

        <Command
          className="bg-background md:bg-card rounded-md md:border"
          /* Prevent cmdk from doing its own filtering — we filter server-side */
          shouldFilter={false}
        >
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            className="placeholder:text-muted-foreground flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          />

          <CommandList className="max-h-95 min-h-75 px-2 md:px-0">
            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-2 p-2">
                {skeletonRows.map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-md bg-muted/40"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && (
              <CommandEmpty
                className={cn(
                  "flex min-h-50 flex-col items-center justify-center gap-2",
                )}
              >
                <SearchIcon className="size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery("")}
                  >
                    Hapus pencarian
                  </Button>
                )}
              </CommandEmpty>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <CommandGroup>
                {results.map((item, idx) => {
                  const key = getItemKey ? getItemKey(item) : idx;
                  return (
                    <CommandItem
                      key={key}
                      value={String(key)}
                      onSelect={() => handleSelect(item)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2"
                    >
                      {renderItem(item)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </ModalContent>
    </Modal>
  );
}
