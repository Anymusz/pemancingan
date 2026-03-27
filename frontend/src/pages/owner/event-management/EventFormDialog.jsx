// File: src/pages/owner/event-management/EventFormDialog.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import ownerService from "@/services/ownerService";
import { useToast } from "@/hooks/useToast";
import FormDialog from "@/components/common/FormDialog";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { FormSelect } from "@/components/common/FormSelect";
import { Textarea } from "@/components/common/FormTextarea";
import { Button } from "@/components/common/Button";
import { ImageOff } from "lucide-react";

// ==================== CONSTANTS ====================

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "event",
  start_date: "",
  end_date: "",
  status: "draft",
};

const CATEGORY_OPTIONS = [
  { value: "event", label: "Acara" },
  { value: "info", label: "Pengumuman" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

// ==================== COMPONENT ====================

export default function EventFormDialog({
  open,
  mode,
  selectedEvent,
  onClose,
  onSuccess,
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Populate form from selectedEvent on edit mode
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && selectedEvent) {
      setForm({
        title: selectedEvent.title,
        description: selectedEvent.description,
        category: selectedEvent.category,
        start_date: selectedEvent.start_date
          ? selectedEvent.start_date.substring(0, 10)
          : "",
        end_date: selectedEvent.end_date
          ? selectedEvent.end_date.substring(0, 10)
          : "",
        status: selectedEvent.status,
      });
      setFormErrors({});
      resetImageState();
      if (selectedEvent.image_url) {
        setImagePreview(selectedEvent.image_url);
      }
    } else {
      setForm(EMPTY_FORM);
      setFormErrors({});
      resetImageState();
    }
  }, [open, mode, selectedEvent]);

  // ---- Image Handlers ----
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetImageState = useCallback(() => {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ---- Close handler ----
  const handleClose = () => {
    resetImageState();
    onClose();
  };

  // ---- Validation ----
  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "Judul wajib diisi";
    else if (form.title.length > 200)
      errors.title = "Judul maksimal 200 karakter";
    if (!form.description.trim()) errors.description = "Deskripsi wajib diisi";
    if (!form.category) errors.category = "Kategori wajib dipilih";

    if (form.category === "event") {
      if (!form.start_date)
        errors.start_date = "Tanggal mulai wajib diisi untuk event";
      if (!form.end_date)
        errors.end_date = "Tanggal berakhir wajib diisi untuk event";
      if (form.start_date && form.end_date && form.end_date < form.start_date) {
        errors.end_date = "Tanggal berakhir tidak boleh sebelum tanggal mulai";
      }
    }
    return errors;
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("status", form.status);

    if (form.category === "event") {
      formData.append("start_date", form.start_date);
      formData.append("end_date", form.end_date);
    } else {
      if (form.start_date) formData.append("start_date", form.start_date);
      if (form.end_date) formData.append("end_date", form.end_date);
    }

    if (form.category === "event") {
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (removeImage) {
        formData.append("remove_image", "1");
      }
    }

    setSubmitLoading(true);
    try {
      if (mode === "edit") {
        await ownerService.updateEvent(selectedEvent.id, formData);
        toast.success("Event berhasil diperbarui");
      } else {
        await ownerService.createEvent(formData);
        toast.success("Event berhasil dibuat");
      }
      handleClose();
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan event");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={
        mode === "edit" ? "Edit Acara/Pengumuman" : "Tambah Acara/Pengumuman"
      }
      size="lg"
      loading={submitLoading}
      onSubmit={handleSubmit}
      submitLabel={mode === "edit" ? "Simpan Perubahan" : "Buat"}
      cancelLabel="Batal"
    >
      <div className="grid gap-4 py-2">
        {/* Judul */}
        <div className="grid gap-1.5">
          <Label>Judul *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Judul acara atau pengumuman"
          />
          {formErrors.title && (
            <p className="text-xs text-destructive">{formErrors.title}</p>
          )}
        </div>

        {/* Kategori */}
        <div className="grid gap-1.5">
          <Label>Kategori *</Label>
          <FormSelect
            value={form.category}
            onValueChange={(val) => {
              setForm((p) => ({ ...p, category: val }));
              if (val === "info") resetImageState();
            }}
            options={CATEGORY_OPTIONS}
            className="w-full"
          />
          {formErrors.category && (
            <p className="text-xs text-destructive">{formErrors.category}</p>
          )}
        </div>

        {/* Deskripsi */}
        <div className="grid gap-1.5">
          <Label>Deskripsi *</Label>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Deskripsi lengkap..."
          />
          {formErrors.description && (
            <p className="text-xs text-destructive">{formErrors.description}</p>
          )}
        </div>

        {/* Tanggal — Event (required) */}
        {form.category === "event" && (
          <>
            <div className="grid gap-1.5">
              <Label>Tanggal Mulai *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start_date: e.target.value }))
                }
              />
              {formErrors.start_date && (
                <p className="text-xs text-destructive">
                  {formErrors.start_date}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Tanggal Berakhir *</Label>
              <Input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, end_date: e.target.value }))
                }
              />
              {formErrors.end_date && (
                <p className="text-xs text-destructive">
                  {formErrors.end_date}
                </p>
              )}
            </div>
          </>
        )}

        {/* Tanggal — Info (optional) */}
        {form.category === "info" && (
          <>
            <div className="grid gap-1.5">
              <Label>
                Tanggal Mulai{" "}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start_date: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label>
                Masa Berlaku{" "}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </Label>
              <Input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, end_date: e.target.value }))
                }
              />
            </div>
          </>
        )}

        {/* Gambar — hanya untuk event */}
        {form.category === "event" && (
          <div className="grid gap-1.5">
            <Label>
              Gambar{" "}
              <span className="text-muted-foreground font-normal">
                (opsional, maks 5MB)
              </span>
            </Label>
            {imagePreview ? (
              <div className="relative inline-block w-full max-w-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1.5 right-1.5 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:opacity-90 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full max-w-xs h-28 rounded-lg border border-dashed border-border bg-muted/30">
                <ImageOff className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
            />
          </div>
        )}

        {/* Status */}
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <FormSelect
            value={form.status}
            onValueChange={(val) => setForm((p) => ({ ...p, status: val }))}
            options={STATUS_OPTIONS}
            className="w-full"
          />
        </div>
      </div>
    </FormDialog>
  );
}
