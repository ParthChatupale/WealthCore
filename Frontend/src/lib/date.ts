import { format, parseISO } from "date-fns";

export function formatIndianDate(value: string) {
  return format(parseISO(value), "dd/MM/yyyy");
}

export function formatIndianDateLong(value: string) {
  return format(parseISO(value), "dd MMM yyyy");
}
