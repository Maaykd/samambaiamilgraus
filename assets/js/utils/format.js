// assets/js/utils/format.js
export function getPriceNumber(raw) {
  if (raw == null) return null;
  const normalized = String(raw)
    .replace(".", "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "Sob consulta";
  return BRL.format(Number(value));
}

export function formatWhatsAppLink(phone, text) {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/55${cleaned}?text=${encoded}`;
}
