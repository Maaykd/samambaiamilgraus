// assets/js/utils/format.js
export function getPriceNumber(raw) {
  if (raw == null) return null;

  const str = String(raw).trim();

  // remove tudo que não é dígito, vírgula ou ponto
  const cleaned = str.replace(/[^0-9.,]/g, "");

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized;

  if (hasComma && hasDot) {
    // "1.234,56" -> "1234.56"
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    // "79,99" -> "79.99"
    normalized = cleaned.replace(",", ".");
  } else {
    // "79.99" ou "7999" -> mantem
    normalized = cleaned;
  }

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
