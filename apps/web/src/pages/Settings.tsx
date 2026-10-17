import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import i18n from "../i18n";

export default function Settings() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => apiGet<any>("/profile") });
  const p = data?.data || user;
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (p) setForm({ name: p.name, email: p.email, locale: p.locale, currency: p.currency, distanceUnit: p.distanceUnit, volumeUnit: p.volumeUnit, timeZone: p.timeZone, theme: p.theme }); }, [p]);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [confirmDelete, setConfirmDelete] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    await apiPatch("/profile", form);
    await refresh();
    alert("Guardado");
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    await apiPost("/change-password", pw);
    alert("Contraseña actualizada");
    setPw({ currentPassword: "", newPassword: "" });
  }
  async function exportData() {
    window.open("/api/v1/export", "_blank");
  }
  async function deleteAccount() {
    if (confirmDelete !== "DELETE") return alert("Escribí DELETE");
    await apiPost("/account", { confirm: "DELETE" });
    window.location.href = "/";
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
      <Card>
        <CardHeader><CardTitle>{t("settings.profile")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-3">
            <Input label={t("auth.name")} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label={t("auth.email")} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Select label={t("settings.language")} value={form.locale || "es"} onChange={(e) => { setForm({ ...form, locale: e.target.value }); i18n.changeLanguage(e.target.value); }}>
              <option value="es">Español</option><option value="en">English</option>
            </Select>
            <Input label={t("settings.currency")} value={form.currency || ""} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            <Select label={t("settings.distanceUnit")} value={form.distanceUnit || "KM"} onChange={(e) => setForm({ ...form, distanceUnit: e.target.value })}>
              <option value="KM">km</option><option value="MI">mi</option>
            </Select>
            <Select label={t("settings.volumeUnit")} value={form.volumeUnit || "L"} onChange={(e) => setForm({ ...form, volumeUnit: e.target.value })}>
              <option value="L">L</option><option value="GAL_US">gal</option>
            </Select>
            <Input label={t("settings.timeZone")} value={form.timeZone || ""} onChange={(e) => setForm({ ...form, timeZone: e.target.value })} />
            <Select label={t("settings.theme")} value={form.theme || "SYSTEM"} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
              <option value="LIGHT">Light</option><option value="DARK">Dark</option><option value="SYSTEM">System</option>
            </Select>
            <Button type="submit">{t("common.save")}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("settings.changePassword")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePw} className="space-y-3">
            <Input label="Contraseña actual" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <Input label="Nueva contraseña" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <Button type="submit">{t("settings.changePassword")}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("settings.exportData")}</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={exportData}>{t("common.export")}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-red-600">{t("settings.deleteAccount")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input label={t("settings.deleteConfirm")} value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />
          <Button variant="destructive" onClick={deleteAccount}>{t("settings.deleteAccount")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
