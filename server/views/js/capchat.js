document.addEventListener('DOMContentLoaded', (event) => {
    const urlPathname = window.location.pathname;
    const urlSegments = urlPathname.split('/');
    const urlUsageIndex = urlSegments.findIndex(segment => segment === 'capchat') + 1;
    const urlUsage = urlSegments[urlUsageIndex];


    axios.get(`/api/capchat/${urlUsage}`)
    .then((response) => {
        const data = response.data;
        const imageContainer = document.getElementById('image-container');
        const question = document.getElementById('question');

        question.innerText = data.imageSinguliere.Question;

        for (let image of data.imagesNeutres) {
            const imgElement = document.createElement('img');
            imgElement.src = `/views/image/neutres/${image.FilePath}`;
            imgElement.style.width = '100px';
            imgElement.style.height = '100px';
            imageContainer.appendChild(imgElement);
        }

        const imgSinguliere = document.createElement('img');
        imgSinguliere.src = `/views/image/singuliers/${data.imageSinguliere.FilePath}`;
        imgSinguliere.style.width = '100px';
        imgSinguliere.style.height = '100px';
        imageContainer.appendChild(imgSinguliere);
    })
    .catch((error) => {
        console.error(error);
    });
});