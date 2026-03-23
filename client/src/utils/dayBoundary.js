export const DAY_START_HOUR = 4;

const pad2 = (value) => String(value).padStart(2, "0");

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

export const getLogicalDateKey = (date = new Date()) => {
  const shifted = new Date(date.getTime() - DAY_START_HOUR * 60 * 60 * 1000);
  return formatDateKey(shifted);
};

export const getLogicalDateParts = (date = new Date()) => {
  const [year, month, day] = getLogicalDateKey(date).split("-").map(Number);
  return { year, month, day };
};
