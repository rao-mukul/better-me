import { format, parseISO, subHours } from "date-fns";

export const DAY_START_HOUR = 4;

const pad2 = (value) => String(value).padStart(2, "0");

export const formatDayKey = (date) => format(date, "yyyy-MM-dd");

export const getLogicalDayKey = (date = new Date()) =>
  formatDayKey(subHours(new Date(date), DAY_START_HOUR));

export const getRequestDayKey = (req) => {
  const requestedDate = req?.query?.date;
  if (typeof requestedDate === "string" && requestedDate.trim()) {
    return requestedDate;
  }
  return getLogicalDayKey();
};

export const parseDayKey = (dayKey, hour = 12) => {
  const safeHour = pad2(hour);
  return parseISO(`${dayKey}T${safeHour}:00:00`);
};
