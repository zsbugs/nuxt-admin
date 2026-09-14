/** 金额展示：统一样式，免得每张表各写一遍 */
export function formatAmount(value: number): string {
  return `¥${value.toFixed(2)}`
}
