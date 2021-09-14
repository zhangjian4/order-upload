const units = ['B', 'KB', 'MB', 'GB', 'TB'];
export const formatFileSize = (value: number) => {
  if (value) {
    for (const unit of units) {
      if (value < 1024) {
        return Number(value.toFixed(2)) + unit;
      } else {
        value = value / 1024;
      }
    }
  }
  return null;
};
