export const formatHours = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${Math.round(hours * 10) / 10}h`;
  }
  return `${Math.round((hours / 24) * 10) / 10}d`;
};
