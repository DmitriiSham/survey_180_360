const ENV = require("../ENV");
const { Sample } = require("../modules/sample.umd.cjs");
const {
    questionChoice,
    questionSelect,
    questionText,
    redirectToSign,
    rbStyle,
    hexToRgba,
} = require("../modules/html.js");
const {
    getDataSurvey,
    getEmployee,
    getTextFields,
    pivotCreateRaw,
    rowsCollectFromRaw,
    rowsArrayTexts,
    pivotCreateMulticubesRaw,
} = require("../modules/om.js");

const LZString = require("../static/lz-string.min.js");
const sample = new Sample();

OM.web("getSurvey180", async (request) => {
    const { user, params } = request;

    if (!user) {
        return redirectToSign(params);
    }

    const om = await OM.connectAsync(
        ENV.HOST,
        ENV.WSS,
        ENV.TOKEN,
        ENV.MODEL_ID
    );
    // return JSON.stringify(await om.common.modelInfo().nameAsync())

    const userMail = user && user.email ? user.email : null;
    // const userMail = "a.tomin@optimacros.com"

    const getData = async (om) =>
        getDataSurvey(
            om,
            ENV.MULTICUBE_FIRST,
            ENV.MULTICUBE_SETTINGS_180,
            ENV.MULTICUBE_QUESTIONS_180,
            ENV.MULTICUBE_COMMON_TEXTAREA
        );

    const getListUsers = async (om) =>
        getEmployee(
            om,
            userMail,
            ENV.MULTICUBE_FILTER_EMPLOYEES,
            ENV.MAIN_LIST_USERS
        );
    // return JSON.stringify(await getListUsers(om));
    const getText180Model = async (om) =>
        getTextFields(om, ENV.MULTICUBE_TEXT_180);
    // return JSON.stringify(await getText180Model(om));

    const getBackgroundRoot = async (om) =>
        pivotCreateRaw(om, ENV.MULTICUBE_COLOR_SCHEME)
            .then((styleScheme) => {
                return rowsCollectFromRaw(styleScheme);
            })
            .then((rowsLabelsColors) => {
                return rowsLabelsColors.map((item) => item[0]);
            }); // Цвета

    const getRowsCubesColors = async (om) =>
        pivotCreateRaw(om, ENV.MULTICUBE_COLOR_SCHEME).then((styleScheme) => {
            return rowsArrayTexts(styleScheme);
        });

    const getRowLabelFirst = async (om) =>
        pivotCreateRaw(om, ENV.MULTICUBE_SETTINGS_180).then(
            (pivotHeadersSettings180) => {
                return rowsCollectFromRaw(pivotHeadersSettings180);
            }
        ); // Цвета

    const getCommonResults = await Promise.all([
        getData(om),
        getListUsers(om),
        getText180Model(om),
        getBackgroundRoot(om),
        getRowsCubesColors(om),
        getRowLabelFirst(om),
    ]);

    const [
        data,
        listUsers,
        getText180,
        backgroundRoot,
        rowsCubesColors,
        rowLabelFirst,
    ] = [
        getCommonResults[0],
        getCommonResults[1],
        getCommonResults[2],
        getCommonResults[3],
        getCommonResults[4],
        getCommonResults[5],
    ];
    // return JSON.stringify([data, listUsers, getText180, backgroundRoot, rowsCubesColors,         rowLabelFirst])

    const hexColorBackground = rowsCubesColors.map((item) => item[0]);
    let hexColorBackgroundEntries = {};
    backgroundRoot.forEach((key, index) => {
        hexColorBackgroundEntries[key.longId] = hexColorBackground[index];
    });
    const jsonHexBackground = LZString.compressToEncodedURIComponent(
        JSON.stringify(hexColorBackgroundEntries)
    );
    const hexColorButton = rowsCubesColors[0][1];
    const hexColorRadio = rowsCubesColors[0][2];
    const rgbaColor = hexToRgba(hexColorRadio, 0.5); // Прозрачность 50%

    const firstHeader = rowLabelFirst[0][0].longId; // longId fieldset

    const formContent = data.map((item) => {
        if (item.options) {
            return questionChoice(item, firstHeader, jsonHexBackground);
        } else if (item.text === data[0].text) {
            return questionSelect(listUsers, item, {
                name: "Селектор пользователей",
                id: "employeesFilter",
            });
        } else {
            return questionText(item);
        }
    });
    /* === HTML Формы === */
    const header1 = sample.element({ tag: "h1", content: getText180[0][0] });
    const header2 = sample.div(getText180[1][0]);
    const header = `${header1}${header2}`;
    const button = sample.button("Отправить", {
        type: "submit",
        id: "buttonSend",
        "aria-busy": "false",
        style: {
            "--pico-background-color": hexColorButton,
            "--pico-border-color": hexColorButton,
        },
        className: "afterSelect hidden",
    });
    const form = sample.form(`${formContent.join("")}${button}`, {
        id: "form180",
    });
    const section = sample.element({
        tag: "section",
        content: `${header}${form}`,
        id: "section",
    });
    /* === Modal === */
    const lastHeaderH = sample.element({
        tag: "h3",
        content: getText180[2][0],
    });
    const headerErrorH = sample.element({
        tag: "h3",
        content: "⚠️ Ошибка!",
        style: {
            display: "flex",
            "justify-content": "center",
        },
    });
    const buttonCloseModal = sample.button("", {
        "data-target": "modalError",
        onclick: "closeModal(this.dataset.target)",
        rel: "prev",
    });
    const lastHeader = sample.element({
        tag: "header",
        content: `${lastHeaderH}`,
    });
    const modalHeaderError = sample.element({
        tag: "header",
        content: `${buttonCloseModal}</button>${headerErrorH}`,
    });
    const modalText = sample.p(getText180[5][0], { id: "modalMessage" });
    const modalTextError = sample.p("", { id: "modalMessageError" });
    const articleLast = sample.element({
        tag: "article",
        content: `${lastHeader}${modalText}`,
        id: "lastArticle",
    });
    const articleError = sample.element({
        tag: "article",
        content: `${modalHeaderError}${modalTextError}`,
        id: "articleError",
    });
    // return JSON.stringify(lastHeaderH)
    const dialog = sample.element({
        tag: "dialog",
        content: articleLast,
        id: "modalEnd",
    });
    const dialogError = sample.element({
        tag: "dialog",
        content: articleError,
        id: "modalError",
    });
    const styleRadio = rbStyle(rgbaColor, hexColorRadio);
    const container = sample.element({
        tag: "main",
        content: `${section}${dialog}${dialogError}`,
        className: "container",
        "data-theme": "light",
    });
    const html = sample.html({
        lang: "ru",
        title: "Опрос 180",
        scripts: ["lz-string.min.js", "app.js"],
        css: ["pico.min.css", "container.css"],
        content: `${styleRadio}${container}`,
    });
    return {
        headers: {
            contentType: "text/html",
        },
        body: html,
    };
});
