import { useState } from "react";
import { ImageOff } from "lucide-react";
import ImageLightbox from "@/components/common/ImageLightbox";

function ImageCell({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {row.image_url ? (
        <img
          src={row.image_url}
          alt={row.name}
          className="w-10 h-10 object-cover rounded-md cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
          <ImageOff className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
      <ImageLightbox
        open={open}
        src={row.image_url}
        alt={row.name}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export const imageCell = {
  key: "image",
  header: "Foto",
  width: "64px",
  render: (row) => <ImageCell row={row} />,
};
