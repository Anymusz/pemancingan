import { useState, useRef } from "react";
import userService from "@/services/userService";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/common/Button";
import { Input as FormInput } from "@/components/common/FormInput";
import { Label as FormLabel } from "@/components/common/FormLabel";
import { formatDate } from "@/utils/utils";
import { setToken } from "@/utils/tokenManager";

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function ProfilePage({ user, memberSince, onUserUpdate }) {
  const toast = useToast();

  const initialData = useRef({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [formData, setFormData] = useState({ ...initialData.current });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState({});

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const isDirty =
    JSON.stringify(formData) !== JSON.stringify(initialData.current);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError[name]) {
      setFormError((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError("");
  };

  const cancelProfileEdit = () => {
    setFormData({ ...initialData.current });
    setFormError({});
  };

  const handleProfileSubmit = async () => {
    setFormLoading(true);
    setFormError({});
    try {
      const res = await userService.updateProfile(formData);
      if (res.success) {
        if (res.data?.token) setToken(res.data.token);
        const updatedUser = res.data;
        initialData.current = {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
        };
        setFormData({ ...initialData.current });
        if (onUserUpdate) onUserUpdate(updatedUser);
        toast.success("Profil berhasil diperbarui");
      }
    } catch (error) {
      if (error.response?.status === 422) {
        setFormError(error.response.data.errors || {});
        toast.error("Validasi gagal, silakan periksa isian Anda");
      } else {
        toast.error(
          error.response?.data?.message || "Gagal memperbarui profil",
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const cancelPasswordEdit = () => {
    setShowPasswordForm(false);
    setPasswordData({
      current_password: "",
      password: "",
      password_confirmation: "",
    });
    setPasswordError("");
  };

  const handlePasswordSubmit = async () => {
    setPasswordLoading(true);
    setPasswordError("");
    try {
      const res = await userService.updatePassword(passwordData);
      if (res.success) {
        if (res.data?.token) setToken(res.data.token);
        toast.success("Password berhasil diubah");
        cancelPasswordEdit();
      }
    } catch (error) {
      if (error.response?.status === 422) {
        if (error.response.data.message === "Password saat ini tidak sesuai") {
          setPasswordError(error.response.data.message);
        } else if (error.response.data.errors?.password) {
          setPasswordError(error.response.data.errors.password[0]);
        } else {
          toast.error("Format password tidak valid");
        }
      } else {
        toast.error(
          error.response?.data?.message || "Gagal memperbarui password",
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const isPasswordFilled =
    passwordData.current_password &&
    passwordData.password &&
    passwordData.password_confirmation;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-border bg-card p-5">
        {/* Avatar + identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {memberSince
                ? `Member sejak ${formatDate(memberSince)}`
                : user?.created_at
                  ? `Bergabung sejak ${formatDate(user.created_at)}`
                  : ""}
            </p>
          </div>
        </div>

        <div className="border-t border-border my-5" />

        {/* Account info */}
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Informasi akun
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FormLabel htmlFor="name" className="mb-3 mt-1">
              Nama lengkap
            </FormLabel>
            <FormInput
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            {formError.name && (
              <p className="text-destructive text-xs mt-1">
                {formError.name[0]}
              </p>
            )}
          </div>
          <div>
            <FormLabel htmlFor="phone" className="mb-3 mt-1">
              No. HP
            </FormLabel>
            <FormInput
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
            {formError.phone && (
              <p className="text-destructive text-xs mt-1">
                {formError.phone[0]}
              </p>
            )}
          </div>
          <div>
            <FormLabel htmlFor="email" className="mb-3 mt-1">
              Email
            </FormLabel>
            <FormInput
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            {formError.email && (
              <p className="text-destructive text-xs mt-1">
                {formError.email[0]}
              </p>
            )}
          </div>
          <div>
            <FormLabel htmlFor="address" className="mb-3 mt-1">
              Alamat
            </FormLabel>
            <FormInput
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
            {formError.address && (
              <p className="text-destructive text-xs mt-1">
                {formError.address[0]}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border my-5" />

        {/* Password */}
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Ganti password
        </p>
        {!showPasswordForm ? (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowPasswordForm(true)}
          >
            Ubah password
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="current_password" className="mb-3 mt-1">
                Password saat ini
              </FormLabel>
              <FormInput
                id="current_password"
                name="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
              />
              {passwordError === "Password saat ini tidak sesuai" && (
                <p className="text-destructive text-xs mt-1">{passwordError}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="password" className="mb-3 mt-1">
                  Password baru
                </FormLabel>
                <FormInput
                  id="password"
                  name="password"
                  type="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                />
                {passwordError &&
                  passwordError !== "Password saat ini tidak sesuai" && (
                    <p className="text-destructive text-xs mt-1">
                      {passwordError}
                    </p>
                  )}
              </div>
              <div>
                <FormLabel
                  htmlFor="password_confirmation"
                  className="mb-3 mt-1"
                >
                  Konfirmasi password
                </FormLabel>
                <FormInput
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={passwordData.password_confirmation}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-5">
          {showPasswordForm ? (
            <>
              <Button
                variant="outline"
                onClick={cancelPasswordEdit}
                disabled={passwordLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                loading={passwordLoading}
                disabled={!isPasswordFilled || passwordLoading}
              >
                Simpan password
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={cancelProfileEdit}
                disabled={!isDirty || formLoading}
              >
                Batalkan
              </Button>
              <Button
                onClick={handleProfileSubmit}
                loading={formLoading}
                disabled={!isDirty || formLoading}
              >
                Simpan perubahan
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
