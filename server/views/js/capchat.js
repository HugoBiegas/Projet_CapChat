function getRandomElements(arr, count) {
    const shuffled = [...arr];
    for (let i = shuffled.length; i--;) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

function updateThermometer(remainingTime, totalTime) {
    const thermometerInner = document.getElementById('thermometer-inner');
    const percentage = (remainingTime / totalTime) * 100;
    const red = Math.round(255 - (255 * (remainingTime / totalTime)));
    const green = Math.round(255 * (remainingTime / totalTime));
    const color = `rgb(${red}, ${green}, 0)`;

    thermometerInner.style.width = `${percentage}%`;
    thermometerInner.style.backgroundColor = color;
}

document.addEventListener('DOMContentLoaded', () => {
    const urlPathname = window.location.pathname;
    const urlSegments = urlPathname.split('/');
    const urlUsage = urlSegments[urlSegments.length - 1];
    const isTheme = urlSegments[urlSegments.length - 2] === 'capchatTheme';

    let apiUrl;
    if (isTheme) {
        apiUrl = `/api/capChatTheme/${urlUsage}`;
    } else {
        apiUrl = `/api/capchat/${urlUsage}`;
    }

    let totalTime = localStorage.getItem('totalTime') ? parseInt(localStorage.getItem('totalTime')) : 30;
    let remainingTime = localStorage.getItem('remainingTime') ? parseInt(localStorage.getItem('remainingTime')) : totalTime;
    let timerInterval;

    function startTimer() {
        timerInterval = setInterval(() => {
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                if (totalTime === 5) {
                    handleCapChatFailure(timerInterval);
                } else {
                    remainingTime = totalTime;
                    localStorage.setItem('remainingTime', remainingTime);
                    refreshCapChat();
                    startTimer();
                }
            } else {
                remainingTime--;
                localStorage.setItem('remainingTime', remainingTime);
                document.getElementById('timer').innerText = remainingTime;
                updateThermometer(remainingTime, totalTime);
            }
        }, 1000);
    }

    function setupTimer() {
        clearInterval(timerInterval);
        remainingTime = localStorage.getItem('remainingTime') ? parseInt(localStorage.getItem('remainingTime')) : totalTime;
        document.getElementById('timer').innerText = remainingTime;
        updateThermometer(remainingTime, totalTime);
        startTimer();
    }

    function refreshCapChat() {
        clearInterval(timerInterval);
        totalTime -= 5;
        remainingTime = totalTime;
        localStorage.setItem('totalTime', totalTime);
        localStorage.setItem('remainingTime', remainingTime);
        window.location.reload();
    }

    function handleImageClick(index) {
        const imageElements = document.getElementsByClassName('capchat-image');
        const clickedImage = imageElements[index];

        if (clickedImage.dataset.isSinguliere === 'true') {
            handleCapChatSuccess(timerInterval, urlUsage);
        } else {
            remainingTime -= 5;
            if (remainingTime <= 0) {
                if (totalTime === 5) {
                    handleCapChatFailure(timerInterval);
                } else {
                    refreshCapChat();
                }
            } else {
                refreshCapChat();
            }
        }
    }

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            const imageContainer = document.getElementById('image-container');
            const question = document.getElementById('question');

            const imageSinguliere = data.imageSinguliere[0];
            question.innerText = imageSinguliere.Question;

            let imagesNeutres = data.imagesNeutres;
            let images = imagesNeutres.concat(imageSinguliere);

            for (let i = images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [images[i], images[j]] = [images[j], images[i]];
            }

            images.forEach((image, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = `/views/image/${image === imageSinguliere ? 'singuliers' : 'neutres'}/${image.FilePath}`;
                imgElement.classList.add('capchat-image');
                imgElement.dataset.isSinguliere = (image === imageSinguliere).toString();
                imgElement.addEventListener('click', () => handleImageClick(index));
                imageContainer.appendChild(imgElement);
            });

            setupTimer();
        })
        .catch((error) => {
            console.error(error);
        });
});

function handleCapChatSuccess(timerInterval, urlUsage) {
    clearInterval(timerInterval);
    const storedUsername = localStorage.getItem('storedUsername');
    const storedPassword = localStorage.getItem('storedPassword');

    localStorage.clear();
    localStorage.setItem('capchatSuccess', 'true');
    localStorage.setItem('storedUrlUsage', urlUsage);
    localStorage.setItem('storedUsername', storedUsername);
    localStorage.setItem('storedPassword', storedPassword);

    if (window.location.pathname.includes('/capchatTheme'))
        window.location.pathname = window.location.pathname.replace(`/capchatTheme/${urlUsage}`, '');
    else
        window.location.pathname = window.location.pathname.replace(`/capchat/${urlUsage}`, '');
}

function handleCapChatFailure(timerInterval) {
    clearInterval(timerInterval);
    alert("Vous n'êtes pas un humain !");
    const storedUsername = localStorage.getItem('storedUsername');
    const storedPassword = localStorage.getItem('storedPassword');
    localStorage.clear();
    localStorage.setItem('capchatSuccess', 'false');
    localStorage.setItem('storedUsername', storedUsername);
    localStorage.setItem('storedPassword', storedPassword);
    history.back();
}
