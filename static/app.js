document.addEventListener("DOMContentLoaded", () => {

    const form180 = document.getElementById('form180');
    const form360 = document.getElementById('form360');
    const section = document.getElementById('section');

    // form
    if (form180) {
        form180.addEventListener('submit', (event) => sendForm(event, section, '180'));
    }
    if (form360) {
        form360.addEventListener('submit', (event) => sendForm(event, section, '360'));
    }
});


async function sendForm(event, section, answers) {
    event.preventDefault();
    event.stopPropagation();

    const dateOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    }

    const data = new FormData(event.currentTarget);

    const currentDay = new Date();
    const surveyDay = currentDay.toLocaleDateString('ru-RU', dateOptions);
    const survey = new Map([['survey2', answers], ['surveyDay', `${surveyDay}`]]);

    const compressString = Object.fromEntries([...survey, ...data]);
    const compressedUrl = LZString.compressToEncodedURIComponent(JSON.stringify(compressString));

    const modal = document.getElementById("modalEnd");
    openModal(modal);
    setTimeout(() => { section.classList.toggle('hidden'); document.body.style.background = 'rgba(0, 0, 0, 0)'; }, 1000)


    const url = (`./sendAnswers${answers}?` + `data=${compressedUrl}`);
    await fetch(url);
}

function toggleLoader() {
    const button = document.getElementById('buttonSend');
    button.ariaBusy = !button.ariaBusy;
}

function changeBackground(radio, firstHeader, hexColorBackgroundEntries) {
    const value = radio.value;
    const jsonHexBackground = JSON.parse(LZString.decompressFromEncodedURIComponent(hexColorBackgroundEntries));
    if (+radio.name === +firstHeader) {
        document.body.style.background = jsonHexBackground[value];
    }
    // console.log(+radio.name === +firstHeader)
}

/* === Modal === */
// Open modal
const openModal = async (modal) => {

    // Config modal
    const isOpenClass = "modal-is-open";
    const openingClass = "modal-is-opening";
    const scrollbarWidthCssVar = "--pico-scrollbar-width";
    const animationDuration = 400; // ms

    const { documentElement: html } = document;
    const scrollbarWidth = getScrollbarWidth();
    if (scrollbarWidth) {
        html.style.setProperty(scrollbarWidthCssVar, `${scrollbarWidth}px`);
    }
    html.classList.add(isOpenClass, openingClass);
    setTimeout(() => {
        html.classList.remove(openingClass);
    }, animationDuration);
    modal.showModal();
};


// Get scrollbar width
const getScrollbarWidth = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    return scrollbarWidth;
};

// Is scrollbar visible
const isScrollbarVisible = () => {
    return document.body.scrollHeight > screen.height;
};