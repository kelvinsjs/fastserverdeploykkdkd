function updateCountdown() {
    const now = new Date();
    const moscowOffset = 3; // UTC+3 для Москвы
    const utcNow = now.getTime() + now.getTimezoneOffset() * 60000; // Перевод в UTC
    const moscowNow = new Date(utcNow + moscowOffset * 3600000); // Москва

    // Рассчитать время до полуночи
    const midnight = new Date(moscowNow);
    midnight.setHours(24, 0, 0, 0); // Следующая полночь

    const diff = midnight - moscowNow;
    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

    document.getElementById('countdown').textContent = `${hours}:${minutes}:${seconds}`;
}

// Обновление каждую секунду
setInterval(updateCountdown, 1000);
updateCountdown();

//  localStorage.clear();