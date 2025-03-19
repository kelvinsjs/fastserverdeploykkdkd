function getCurrentMoscowDate() {
    const now = new Date();
    const moscowOffset = 3;
    const moscowTime = new Date(now.getTime() + moscowOffset * 60 * 60 * 1000);
    return moscowTime.toISOString().split('T')[0];
}

console.log(getCurrentMoscowDate());

function checkLocalStorageForToday() {
    const today = getCurrentMoscowDate();
    const savedData = localStorage.getItem("chardleGameResult");
    console.log(savedData)

    if (savedData) {
        const parsedData = JSON.parse(savedData); // Парсим JSON в объект
        const completionDate = parsedData.completionTime; // Получаем дату завершения игры

        // Проверяем, совпадает ли дата завершения с текущей датой
        if (completionDate === today) {
            console.log("data found")
            return true; 
        }
    }
    return false; // Запись для текущей даты отсутствует
}

document.addEventListener("DOMContentLoaded", async function () {
    const gameContainer = document.querySelector(".game-container .characters-grid");
    const guessButton = document.querySelector(".guess-btn");
    const roundScoreBlock = document.querySelector(".char_round_score");
    let h2Elements = roundScoreBlock.querySelectorAll("h2");

    let allCharacters = [];
    let allAffiliations = [];
    let roundsData = {};
    let currentRound = "easy";
    let resultsPointsArray = [];

    async function fetchCharacters() {
        try {
            let response = await fetch("https://api.vtubdle.com/api/start");
            let data = await response.json();
            if (!data.easy || !data.medium || !data.hard) {
                console.error("Ошибка: не загружены данные для всех раундов.");
                return;
            }

            roundsData = data;  // Вся структура данных с раундами
            renderCharacters(roundsData[currentRound]);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        }
    }

    async function fetchAllCharactersAndAffiliations() {
        try {
            let response = await fetch("https://api.vtubdle.com/api/all_characters");
            let data = await response.json();
            allCharacters = data.allChars.map(char => char.name);
            allAffiliations = data.allAffiliations;
            addAutocompleteListeners();
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        }
    }

    function checkLocalStorageForToday() {
        const today = getCurrentMoscowDate(); // Получаем текущую дату по МСК
        const savedData = localStorage.getItem("chardleGameResult"); // Извлекаем данные из localStorage
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
    console.log(checkLocalStorageForToday())

    if (checkLocalStorageForToday()) {
        gameContainer.style.display = "none";
        guessButton.style.display = "none";

        const roundPointsObjects = JSON.parse(localStorage.getItem("chardleGameResult")).roundPoints;
        insertFinalResult(document.querySelector(".results_container"), roundPointsObjects);
        const finalSummaryButton = document.querySelector(".final_summary_finalButton");
        document.querySelector(".final_summary_finalButton").addEventListener("click", (e) => {
            e.preventDefault;
            window.location.href = "index.html";
        })
        
    }

    function renderCharacters(characters) {
        gameContainer.innerHTML = ""; // Очищаем контейнер перед обновлением
        characters.forEach((char, index) => {
            const card = document.createElement("div");
            card.classList.add("character-card");

            card.innerHTML = `
                <div class="image-container">
                    <img src="${char.image_url}" alt="${char.name}">
                </div>
                <div class="input-container">
                    <input type="text" class="char-input" id="char-name-${index}" placeholder="Character Name" autocomplete="off">
                    <input type="text" class="char-affiliation" id="char-affiliation-${index}" placeholder="Affiliation" autocomplete="off">
                </div>
            `;

            gameContainer.appendChild(card);
        });

        addAutocompleteListeners();
        guessButton.textContent = "Guess"; // Возвращаем кнопку в исходное состояние
        guessButton.onclick = checkAnswers;
    }

    function addAutocompleteListeners() {
        $(".char-input").autocomplete({
            source: allCharacters
        });

        $(".char-affiliation").autocomplete({
            source: allAffiliations
        });
    }

    async function checkAnswers() {
        let inputs = document.querySelectorAll(".character-card");
        let answers = [];

        inputs.forEach((card, index) => {
            let nameInput = card.querySelector(".char-input").value.trim();
            let affInput = card.querySelector(".char-affiliation").value.trim();

            answers.push({
                name: nameInput,
                affiliation: affInput
            });
        });

        try {
            let result = await fetch("https://api.vtubdle.com/api/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    round: currentRound  // Отправляем текущий раунд
                })
            });

            let data = await result.json();
            console.log(data);
            updateResults(data);
            let incorrectElementsLength = document.querySelectorAll('.incorrect').length;
            let thisRoundPoints = 1000 - 125*incorrectElementsLength;
            let resultObject = {
                answers: data.map(item => ({
                  name: item.correct_name,
                  affiliation: item.correct_affiliation
                })),
                points: thisRoundPoints
              };
            resultsPointsArray.push(resultObject);
            h2Elements[h2Elements.length - 1].textContent = thisRoundPoints;
            roundScoreBlock.style.display = "flex";

            console.log(thisRoundPoints);
            
        } catch (error) {
            console.error("Ошибка отправки данных:", error);
        }
    }

    function updateResults(results) {
        let inputs = document.querySelectorAll(".character-card");

        inputs.forEach((card, index) => {
            let nameInput = card.querySelector(".char-input");
            let affInput = card.querySelector(".char-affiliation");

            let correctName = results[index].correct_name;
            let correctAffiliation = results[index].correct_affiliation;

            let nameResult = createResultDiv(nameInput.value, correctName);
            let affResult = createResultDiv(affInput.value, correctAffiliation);

            nameInput.replaceWith(nameResult);
            affInput.replaceWith(affResult);

        });

        guessButton.textContent = "Next round";
        guessButton.onclick = nextRound;
    }

    function createResultDiv(userInput, correctAnswer) {
        let div = document.createElement("div");
        div.textContent = correctAnswer;
        div.classList.add("result-text");

        if (userInput.toLowerCase() === correctAnswer.toLowerCase()) {
            div.classList.add("correct");
        } else {
            div.classList.add("incorrect");

        }

        return div;
    }

    function nextRound() {
        const difficultyTag = document.querySelector(".difficulty-tag");
        roundScoreBlock.style.display = "none";

        if (currentRound === "easy") {
            currentRound = "medium";
            difficultyTag.textContent = "Medium";
        } else if (currentRound === "medium") {
            currentRound = "hard";
            difficultyTag.textContent = "Hard";
        } else {
            console.log(resultsPointsArray);
            gameContainer.style.display = "none";
            guessButton.style.display = "none";
            insertFinalResult(document.querySelector(".results_container"), resultsPointsArray);
            const gameData = {
                gameType: "chardle", // Тип игры
                completionTime: getCurrentMoscowDate(), // Дата и время прохождения
                roundPoints: resultsPointsArray, // Массив roundPoints
                status: "completed" // Статус
            };
            const chardleDataJSON = JSON.stringify(gameData);
            localStorage.setItem("chardleGameResult", chardleDataJSON);
            console.log("clicked");
            console.log(chardleDataJSON);
            return; 
        }

        renderCharacters(roundsData[currentRound]);
    }

    function insertFinalResult(targetElement, roundPoints) {
        // Calculate the total sum of points
        const totalSum = roundPoints.reduce((sum, round) => sum + round.points, 0);
    
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
                                    ${round.answers.map(answer => `
                                        <span class="final_summary_name">
                                            <b>${answer.name}</b> - ${answer.affiliation}
                                        </span>
                                    `).join('')}
                                    <span class="final_summary_score">${round.points}</span>
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


    fetchCharacters();
    fetchAllCharactersAndAffiliations();
});
