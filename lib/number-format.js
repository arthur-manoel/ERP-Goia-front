export function formatQuantity(value) {
  const number = Number(value || 0)
  return Number.isFinite(number)
    ? number.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
    : '0'
}
