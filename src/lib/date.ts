export function timeAgo(dateInput: string | Date | undefined): string {
    if (!dateInput) return 'recently';

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Future date or very recent
    if (seconds < 30) return 'just now';

    const interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }

    const months = Math.floor(seconds / 2592000);
    if (months >= 1) {
        return months === 1 ? '1 month ago' : `${months} months ago`;
    }

    const weeks = Math.floor(seconds / 604800);
    if (weeks >= 1) {
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }

    const days = Math.floor(seconds / 86400);
    if (days >= 1) {
        return days === 1 ? '1 day ago' : `${days} days ago`;
    }

    const hours = Math.floor(seconds / 3600);
    if (hours >= 1) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes >= 1) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }

    return 'just now';
}
