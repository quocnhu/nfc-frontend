import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatDate = (date: string) => dayjs(date).format("MMM D, YYYY");
export const formatDateTime = (date: string) => dayjs(date).format("MMM D, YYYY h:mm A");
export const timeAgo = (date: string) => dayjs(date).fromNow();
export const truncate = (str: string, len: number) =>
  str.length > len ? str.slice(0, len) + "..." : str;
