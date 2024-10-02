document.addEventListener("DOMContentLoaded", () => {
    const form180 = document.getElementById("form180");
    const form360 = document.getElementById("form360");
    const section = document.getElementById("section");

    // form
    if (form180) {
        form180.addEventListener("submit", (event) =>
            sendForm(event, section, "180")
        );
    }
    if (form360) {
        form360.addEventListener("submit", (event) =>
            sendForm(event, section, "360")
        );
    }

    console.log("DOM fully loaded and parsed");
});

async function sendForm(event, section, answers) {
    event.preventDefault();
    event.stopPropagation();

    const dateOptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    };

    const data = new FormData(event.currentTarget);

    const currentDay = new Date();
    const surveyDay = currentDay.toLocaleDateString("ru-RU", dateOptions);
    const survey = new Map([
        ["survey2", answers],
        ["surveyDay", `${surveyDay}`],
    ]);

    const compressString = Object.fromEntries([...survey, ...data]);
    const compressedUrl = LZString.compressToEncodedURIComponent(
        JSON.stringify(compressString)
    );

    const modal = document.getElementById("modalEnd");
    const modalError = document.getElementById("modalError");

    const url = `./sendAnswers${answers}?` + `data=${compressedUrl}`;
    toggleLoader();
    await fetch(url)
        .then((result) => {
            if (!result.ok) {
                return fetch(url).then((result) => {
                    if (!result.ok) {
                        console.log(result);
                        return Promise.reject(
                            new Error(`${result.status} ${result.statusText}`)
                        );
                    }
                    if (result.ok) {
                        resultOK(modal);
                    }
                    return result;
                });
            }
            if (result.ok) {
                resultOK(modal);
            }
            return result;
        })
        .catch((error) => {
            console.error("Ошибка при получении schedule:", error.message);
            document.getElementById(
                "modalMessageError"
            ).innerHTML = `Ошибка при получении ответов: ${error.message}.</br> Пожалуйста попробуйте еще раз`;
            toggleLoader();
            openModal(modalError);
        });
}

function toggleLoader() {
    const button = document.getElementById("buttonSend");
    button.ariaBusy = button.ariaBusy === "true" ? "false" : "true";
    console.log("toggle сработал");
}

function changeBackground(radio, firstHeader, hexColorBackgroundEntries) {
    const value = radio.value;
    const jsonHexBackground = JSON.parse(
        LZString.decompressFromEncodedURIComponent(hexColorBackgroundEntries)
    );
    if (+radio.name === +firstHeader) {
        document.body.style.background = jsonHexBackground[value];
    }
    // console.log(+radio.name === +firstHeader)
}

/* === Modal === */
// Config modal
const isOpenClass = "modal-is-open";
const openingClass = "modal-is-opening";
const closingClass = "modal-is-closing";
const scrollbarWidthCssVar = "--pico-scrollbar-width";
const animationDuration = 400; // ms
let visibleModal = null;

// Open modal
const openModal = async (modal) => {
    const { documentElement: html } = document;
    const scrollbarWidth = getScrollbarWidth();
    if (scrollbarWidth) {
        html.style.setProperty(scrollbarWidthCssVar, `${scrollbarWidth}px`);
    }
    html.classList.add(isOpenClass, openingClass);
    setTimeout(() => {
        visibleModal = modal;
        html.classList.remove(openingClass);
    }, animationDuration);
    modal.showModal();
};

// Close modal
const closeModal = async (modalId) => {
    visibleModal = null;
    const modal = document.getElementById(modalId);
    const { documentElement: html } = document;
    html.classList.add(closingClass);
    setTimeout(() => {
        html.classList.remove(closingClass, isOpenClass);
        html.style.removeProperty(scrollbarWidthCssVar);
        modal.close();
    }, animationDuration);
};

// Close with Esc key
document.addEventListener("keydown", (event) => {
    console.log(visibleModal);
    if (event.key === "Escape") {
        closeModal(visibleModal);
    }
});

// Get scrollbar width
const getScrollbarWidth = () => {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
    return scrollbarWidth;
};

// Is scrollbar visible
const isScrollbarVisible = () => {
    return document.body.scrollHeight > screen.height;
};

const resultOK = (modal) => {
    toggleLoader();
    openModal(modal);
    setTimeout(() => {
        section.classList.toggle("hidden");
        document.body.style.background = "rgba(0, 0, 0, 0)";
    }, 1000);
};
