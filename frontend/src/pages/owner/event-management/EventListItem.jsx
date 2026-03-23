// File: src/pages/owner/event-management/EventListItem.jsx

import { formatDate } from "@/utils/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";

export default function EventListItem({ event, onEdit, onPublish, onDelete }) {
  return (
    <div
      className={`border border-border rounded-lg p-4 ${
        event.deleted_at ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail — only for event category */}
        {event.category === "event" && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
            <img
              src={event.image_url || "/images/placeholder-event.jpg"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-foreground">{event.title}</strong>
            <StatusBadge status={event.category} />
            <StatusBadge status={event.status} />
            {event.deleted_at && <StatusBadge status="deactivated" />}
          </div>

          {event.start_date && (
            <div className="text-sm text-muted-foreground mt-1">
              📅 {formatDate(event.start_date)}
              {event.end_date && ` s/d ${formatDate(event.end_date)}`}
            </div>
          )}

          <div className="text-sm text-muted-foreground mt-1">
            {event.description.length > 100
              ? event.description.substring(0, 100) + "..."
              : event.description}
          </div>

          {!event.deleted_at && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => onEdit(event)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant={event.status === "published" ? "secondary" : "outline"}
                onClick={() => onPublish(event)}
              >
                {event.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(event)}
              >
                Hapus
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
