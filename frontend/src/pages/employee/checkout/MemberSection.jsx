// File: src/pages/employee/checkout/v2/MemberSection.jsx

import { useState, useCallback } from "react";
import { UserCircle, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/utils/utils";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalTitle,
} from "@/components/ui/modal";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SearchIcon } from "lucide-react";

export function MemberSection({
  fetchLoading,
  selectedArrival,
  arrivals,
  onSelect,
  onClear,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(
    async (q) => {
      setSearching(true);
      try {
        if (!q.trim()) {
          setResults(arrivals);
          return;
        }
        const lower = q.toLowerCase();
        setResults(
          arrivals.filter(
            (a) =>
              a.name.toLowerCase().includes(lower) ||
              a.member_code.toLowerCase().includes(lower) ||
              (a.phone && a.phone.includes(lower)),
          ),
        );
      } finally {
        setSearching(false);
      }
    },
    [arrivals],
  );

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setResults(arrivals);
    }
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    handleSearch(val);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const skeletonRows = Array.from({ length: 4 });

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
          1
        </span>
        <span className="text-sm font-medium text-foreground">
          Pilih Member
        </span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          Kedatangan hari ini
        </span>
      </div>

      {fetchLoading ? (
        <p className="text-sm text-muted-foreground">
          Memuat data kedatangan...
        </p>
      ) : !selectedArrival ? (
        <Modal open={open} onOpenChange={handleOpenChange}>
          <ModalTrigger asChild>
            <button className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground">
              <UserCircle className="w-8 h-8" />
              <span className="text-sm font-medium">
                Pilih member yang hadir hari ini
              </span>
              <span className="text-xs">Klik untuk mencari</span>
            </button>
          </ModalTrigger>

          <ModalContent className="p-1">
            <ModalTitle className="sr-only">
              Pilih Member (Kedatangan Hari Ini)
            </ModalTitle>
            <Command
              className="bg-background md:bg-card rounded-md md:border"
              shouldFilter={false}
            >
              <CommandInput
                placeholder="Cari nama / member ID / HP..."
                value={query}
                onValueChange={handleQueryChange}
                className="placeholder:text-muted-foreground flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
              <CommandList className="max-h-95 min-h-75 px-2 md:px-0">
                {searching && (
                  <div className="space-y-2 p-2">
                    {skeletonRows.map((_, i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-md bg-muted/40"
                      />
                    ))}
                  </div>
                )}
                {!searching && (
                  <CommandEmpty className="flex min-h-50 flex-col items-center justify-center gap-2">
                    <SearchIcon className="size-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Tidak ada member yang check-in aktif hari ini
                    </p>
                  </CommandEmpty>
                )}
                {!searching && results.length > 0 && (
                  <CommandGroup>
                    {results.map((item) => (
                      <CommandItem
                        key={item.arrival_id}
                        value={String(item.arrival_id)}
                        onSelect={() => handleSelect(item)}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.member_code} · {item.tier} ·{" "}
                            {item.total_points} poin
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Check-in: {formatDateTime(item.check_in_at)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </ModalContent>
        </Modal>
      ) : null}

      {selectedArrival && (
        <div className="rounded-lg border border-border border-l-4 border-l-primary bg-muted/30 p-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{selectedArrival.name}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onClear}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member ID</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedArrival.member_code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tier</span>
                <StatusBadge status={selectedArrival.tier} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Poin</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedArrival.total_points}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Diskon Ikan
                </span>
                <span className="text-sm font-medium text-foreground">
                  {selectedArrival.discount_percentage ?? 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-in</span>
                <span className="text-sm font-medium text-foreground">
                  {formatDateTime(selectedArrival.check_in_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
