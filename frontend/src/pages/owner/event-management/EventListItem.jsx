// File: src/pages/owner/event-management/EventListItem.jsx

import { formatDate } from "@/utils/utils";

export default function EventListItem({ event, onEdit, onPublish, onDelete }) {
  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 ${
        event.deleted_at ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail — only for event category */}
        {event.category === "event" && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={event.image_url || "/images/placeholder-event.jpg"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-gray-800">{event.title}</strong>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.category === "event"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {event.category === "event" ? "Acara" : "Pengumuman"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {event.status === "published" ? "PUBLISHED" : "DRAFT"}
            </span>
            {event.deleted_at && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                DIHAPUS
              </span>
            )}
          </div>

          {event.start_date && (
            <div className="text-sm text-gray-500 mt-1">
              📅 {formatDate(event.start_date)}
              {event.end_date && ` s/d ${formatDate(event.end_date)}`}
            </div>
          )}

          <div className="text-sm text-gray-600 mt-1">
            {event.description.length > 100
              ? event.description.substring(0, 100) + "..."
              : event.description}
          </div>

          {!event.deleted_at && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onEdit(event)}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onPublish(event)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  event.status === "published"
                    ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                    : "text-green-600 bg-green-50 hover:bg-green-100"
                }`}
              >
                {event.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => onDelete(event)}
                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
