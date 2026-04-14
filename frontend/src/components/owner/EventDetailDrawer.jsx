// File: src/components/owner/EventDetailDrawer.jsx

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import ImageLightbox from "@/components/common/ImageLightbox";
import { formatDate } from "@/utils/utils";
import {
  ImageOff,
  Megaphone,
  Calendar,
  X,
  Pencil,
  Trash2,
  Globe,
  EyeOff,
} from "lucide-react";
import { WarningAlert } from "@/components/feedback/inlineAlert";

/**
 * Right-side detail drawer for an event.
 * Props: { open, onClose, event, onEdit, onPublish, onDelete }
 */
export default function EventDetailDrawer({
  open,
  onClose,
  event,
  onEdit,
  onPublish,
  onDelete,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!event) return null;

  const isPublished = event.status === "published";

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setLightboxOpen(false);
            onClose();
          }
        }}
        direction="right"
      >
        <DrawerContent className="sm:max-w-lg pt-2">
          {/* ── Header ── */}
          <DrawerHeader className="md:max-w-none relative pr-10 gap-2">
            <DrawerClose asChild>
              <button
                className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>

            <DrawerTitle className="text-base leading-snug pr-2">
              {event.title}
            </DrawerTitle>

            {/* Badge row */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              <StatusBadge status={event.display_status} />
              <StatusBadge status={event.category} />
              <StatusBadge status={event.status} />
              {event.deleted_at && <StatusBadge status="deactivated" />}
            </div>

            {/* Date */}
            {event.start_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatDate(event.start_date)}
                  {event.end_date && ` s/d ${formatDate(event.end_date)}`}
                </span>
              </div>
            )}
          </DrawerHeader>

          {/* ── Body ── */}
          <DrawerBody className="md:max-w-none overflow-y-auto flex-1 space-y-4">
            {/* Image */}
            {event.category === "event" ? (
              event.image_url ? (
                <div
                  className="aspect-video w-full overflow-hidden rounded-lg cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-lg">
                  <ImageOff className="w-10 h-10 text-muted-foreground/40" />
                </div>
              )
            ) : (
              <div className="h-24 w-full flex items-center justify-center bg-blue-500/10 rounded-lg">
                <Megaphone className="w-10 h-10 text-blue-500/70" />
              </div>
            )}

            {/* Expired banner */}
            {event.display_status === "expired" && (
              <WarningAlert description="Pengumuman ini sudah tidak berlaku." />
            )}

            {/* Description */}
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </DrawerBody>

          {/* ── Footer ── */}
          <DrawerFooter className="md:max-w-none flex flex-row gap-1.5 px-1">
            {!event.deleted_at ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 px-0 sm:px-3 text-xs"
                  onClick={() => {
                    onEdit(event);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 px-0 sm:px-3 text-xs"
                  onClick={() => {
                    onPublish(event);
                  }}
                >
                  {isPublished ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Unpublish</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Publish</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 px-0 sm:px-3 text-xs"
                  onClick={() => {
                    onDelete(event);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Hapus</span>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-1">
                Event ini sudah dihapus
              </p>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Lightbox — rendered outside Drawer to avoid z-index conflict */}
      <ImageLightbox
        open={lightboxOpen}
        src={event.image_url}
        alt={event.title}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
