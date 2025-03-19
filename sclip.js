function getCurrentMoscowDate() {
    const now = new Date();
    const moscowOffset = 3;
    const moscowTime = new Date(now.getTime() + moscowOffset * 60 * 60 * 1000);
    return moscowTime.toISOString().split('T')[0];
}

console.log(getCurrentMoscowDate());

// Функция для проверки наличия записи в localStorage для текущей даты
function checkLocalStorageForToday() {
    const today = getCurrentMoscowDate(); // Получаем текущую дату по МСК
    const savedData = localStorage.getItem("clipdleGameResult"); // Извлекаем данные из localStorage
    console.log(savedData)

    if (savedData) {
        const parsedData = JSON.parse(savedData); // Парсим JSON в объект
        const completionDate = parsedData.completionTime // Получаем дату завершения игры
        console.log(completionDate);
        // Проверяем, совпадает ли дата завершения с текущей датой
        if (completionDate === today) {
            console.log("data found")
            return true; 
        }
    }
    return false; // Запись для текущей даты отсутствует
}

document.addEventListener("DOMContentLoaded", () => {
    const clipImage = document.getElementById('clip-image');
    const firstClueButton = document.getElementById('first-clue');
    const secondClueButton = document.getElementById('second-clue');
    const thirdClueButton = document.getElementById('third-clue');
    const titleClueButton = document.getElementById('title-clue');
    const titleClueElement = document.querySelector('.clipdle_title-clue');
    const titleClueTitle = document.querySelector('.clipdle_title-title');
    const inputField = document.querySelector('.clipdle_input-field');
    const guessButton = document.querySelector('.guess-btn');
    const gameContainer = document.querySelector('.game-container');
    let currentClip = null;
    let clueIndex = 0;
    let allTitles = [];
    let currentDifficulty = 'easy';
    let roundPoints = [];

    const inpitwidth = inputField.offsetWidth;

    fetchClipData(currentDifficulty);

    fetch('https://api.vtubdle.com/api/clip/titles')
        .then(response => response.json())
        .then(titles => {
            allTitles = titles;
            // Initialize jQuery UI Autocomplete
            $(inputField).autocomplete({
                source: allTitles,
                minLength: 1,
                select: function(event, ui) {
                    inputField.value = ui.item.value;
                    return false;
                }
            });
        })
        .catch(error => console.error('Error fetching clip titles:', error));

    // Function to update the clip image
    function updateClipImage(screenshotUrl) {
        clipImage.src = screenshotUrl;
    }

    function insertFinalResult(targetElement, totalSum, roundPoints) {
        // Create the HTML structure as a string
        const htmlContent = `
            <div class="summary">
                <div class="final_summary_container">
                    <h1 class="chardle_title">Final result</h1>
                    <h2 class="final_summary_total">${totalSum}</h2>
                    <div class="final_summary_rounds">
                        ${roundPoints
                            .map((round, index) => `
                                <p class="final_summary_round">
                                    <span class="final_summary_round">Round ${index + 1}</span>
                                    <span class="final_summary_name">${Object.keys(round)[0]}</span>
                                    <span class="final_summary_score">${Object.values(round)[0]}</span>
                                </p>
                            `)
                            .join('')}
                    </div>
                </div>
                <button class="final_summary_finalButton">End Round</button>
            </div>
        `;

        // Insert the HTML content into the target element
        targetElement.innerHTML = htmlContent;
    }

    if (checkLocalStorageForToday()) {
        gameContainer.innerHTML = "";
        const roundPointsObjects = JSON.parse(localStorage.getItem("clipdleGameResult")).roundPoints;
        sumhere = roundPointsObjects.reduce((sum, obj) => {
            const value = Object.values(obj)[0];
            return sum + value;
          }, 0);
        insertFinalResult(gameContainer, sumhere, roundPointsObjects);
        document.querySelector(".final_summary_finalButton").addEventListener("click", (e) => {
            e.preventDefault;
            window.location.href = "index.html";
        })
    }

    [firstClueButton, secondClueButton, thirdClueButton, titleClueButton].forEach((button, index) => {
        button.addEventListener('click', () => {
            if (index < 3) { // Для первых трех кнопок
                clueIndex = index + 1;
                fetchClue();
                [secondClueButton, thirdClueButton, titleClueButton][index].disabled = false;
                let thisRoundPoints;
                thisRoundPoints -= 200;
            } else { // Для кнопки заголовка
                if (currentClip) {
                    const anagram = generateAnagram(currentClip.title);
                    titleClueTitle.textContent = anagram;
                    titleClueElement.style.display = 'block';
                    button.disabled = true;
                }
            }
        });
    });

    // Event listener for the guess button
    guessButton.addEventListener('click', () => {
        const userGuess = inputField.value.trim().toLowerCase();
        titleClueButton.disabled = true;
        if (currentClip) {
            inputField.value = "";
            const isCorrect = userGuess === currentClip.title.toLowerCase();
            displayResult(isCorrect);
        }
    });

    // Function to fetch a clue from the server
    function fetchClue() {
        fetch('https://api.vtubdle.com/api/clip/clue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ difficulty: currentDifficulty, clue_index: clueIndex }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.screenshot) {
                    updateClipImage(data.screenshot);
                }
            })
            .catch(error => console.error('Error fetching clue:', error));
    }

    // Function to generate an anagram with additional random letters
    function generateAnagram(word) {
        const letters = word.split('');
        const numLettersToReveal = Math.round(word.length / 5);
        const revealedIndices = new Set();

        // Choose random indices to reveal
        while (revealedIndices.size < numLettersToReveal) {
            const randomIndex = Math.floor(Math.random() * letters.length);
            revealedIndices.add(randomIndex);
        }

        // Create the anagram with revealed letters and underscores
        const anagram = letters.map((letter, index) =>
            revealedIndices.has(index) ? letter : '_'
        );

        return anagram.join('');
    }

    function fetchClipData(difficulty) {
        fetch('https://api.vtubdle.com/api/clip/start')
            .then(response => response.json())
            .then(data => {
                currentClip = data[difficulty];
                if (currentClip) {
                    clueIndex = 0;
                    updateClipImage(currentClip.screenshots[clueIndex]);
                    titleClueTitle.textContent = '______';
                    titleClueElement.style.display = 'none';

                    // Сброс состояния кнопок
                    [firstClueButton, secondClueButton, thirdClueButton, titleClueButton]
                        .forEach((btn, idx) => btn.disabled = idx !== 0);

                    inputField.style.display = 'block';
                    guessButton.style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching clip data:', error));
    }

    // Function to display the result
    function displayResult(isCorrect) {
        const points = isCorrect ? 1000 - clueIndex * 200 : 0;
        roundPoints.push({ [currentClip.title]: points });

        const summaryContainer = document.createElement('div');
        summaryContainer.classList.add('summary_container');
        summaryContainer.innerHTML = `
        <div class="summary_image">
            <img src="${currentClip.image}" alt="clip">
        </div>
        <div class="summary_text">
            <h3 class="summary_title">${currentClip.title}</h3>
            <p class="summary_year"></p>
            <p class="summary_score">
                <span class="summary_score_thumb">Score</span>
                <span class="summary_score_number">${points}</span>
            </p>
        </div>
    `;

        const bigImageContainer = document.querySelector('.bigimage-container');
        bigImageContainer.parentNode.replaceChild(summaryContainer, bigImageContainer);

        // Скрытие элементов
        document.querySelector(".clipdle_button-container").style.display = 'none';
        document.querySelector(".clipdle_input-container").style.display = 'none';
        titleClueElement.style.display = 'none';

        // Кнопка "Next Round"
        const nextRoundButton = document.createElement('button');
        nextRoundButton.classList.add('guess-btn');
        nextRoundButton.textContent = 'Next Round';
        nextRoundButton.addEventListener('click', () => {
            currentDifficulty = currentDifficulty === 'easy' ? 'medium' :
                currentDifficulty === 'medium' ? 'hard' : null;

            if (!currentDifficulty) {
                gameContainer.innerHTML = '';
                const totalSum = roundPoints.reduce((sum, obj) => {
                    const value = Object.values(obj)[0];
                    return sum + value;
                  }, 0);

                insertFinalResult(gameContainer, totalSum, roundPoints);
                console.log(roundPoints);
                const endRoundButton = document.querySelector(".final_summary_finalButton");
                endRoundButton.addEventListener("click", (e) => {
                    e.preventDefault();

                    // Получаем текущую дату и время по Московскому времени (UTC+3)
                    const now = new Date();
                    const moscowTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3 * 60 * 60 * 1000));
                    const formattedDate = moscowTime.toISOString(); // Форматируем дату в ISO-формат

                    // Формируем объект с данными для сохранения
                    const gameData = {
                        gameType: "clipdle", // Тип игры
                        completionTime: getCurrentMoscowDate(), // Дата и время прохождения
                        roundPoints: roundPoints, // Массив roundPoints
                        status: "completed" // Статус
                    };

                    // Преобразуем объект в JSON
                    const clipdleDataJSON = JSON.stringify(gameData);

                    // Сохраняем данные в localStorage
                    localStorage.setItem("clipdleGameResult", clipdleDataJSON);
                    console.log("clicked")
                    window.location.href = "index.html";
                });
                return;
            }

            document.querySelector('.difficulty-tag').textContent = currentDifficulty;
            document.querySelector(".clipdle_button-container").style.display = 'flex';
            document.querySelector(".clipdle_input-container").style.display = 'flex';

            fetchClipData(currentDifficulty);
            summaryContainer.parentNode.replaceChild(bigImageContainer, summaryContainer);
            nextRoundButton.remove();
        });

        summaryContainer.parentNode.insertBefore(nextRoundButton, summaryContainer.nextSibling);
    }
});


