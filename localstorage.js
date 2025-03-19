// Функция для получения текущей даты по Московскому времени (UTC+3)
function getCurrentMoscowDate() {
    const now = new Date();
    const moscowTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3 * 60 * 60 * 1000));
    return moscowTime.toISOString().split('T')[0]; // Возвращаем только дату в формате YYYY-MM-DD
}

// Функция для проверки наличия записи в localStorage для текущей даты
function checkLocalStorageForToday(gameName) {
    const today = getCurrentMoscowDate(); // Получаем текущую дату по МСК
    console.log(today)
    const savedData = localStorage.getItem(`${gameName}GameResult`); // Извлекаем данные из localStorage
    // console.log(savedData);

    if (savedData) {
        const parsedData = JSON.parse(savedData); // Парсим JSON в объект
        const completionDate = parsedData.completionTime; // Получаем дату завершения игры
        console.log(completionDate)
        // Проверяем, совпадает ли дата завершения с текущей датой
        if (completionDate === today) {
            return true;
        }
    }
    return false; // Запись для текущей даты отсутствует
}

// Добавляем класс "completed" к кнопке игры, если запись для текущей даты существует
document.addEventListener("DOMContentLoaded", () => {
    console.log("loaded");

    // Массив с названиями игр
    const games = ["chardle", "clipdle"];

    games.forEach(gameName => {
        const gameButton = document.querySelector(`a[href="./${gameName}.html"]`); // Находим кнопку игры
        if (gameButton) {
            console.log(checkLocalStorageForToday(gameName));
            if (checkLocalStorageForToday(gameName)) {
                gameButton.classList.add("completed"); // Добавляем класс "completed"
            }
        }
    });
});
