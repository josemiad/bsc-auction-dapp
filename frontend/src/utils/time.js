// Calculates hours, minutes, seconds remaining for the auction countdown
export function getCountdown(deadlineTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(deadlineTimestamp) - now;

    if (diff <= 0) {
        return { isEnded: true, text: 'Ended', hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return {
        isEnded: false,
        text: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
        hours,
        minutes,
        seconds
    };
}