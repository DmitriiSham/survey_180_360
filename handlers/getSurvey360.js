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
    rowsArrayValues,
} = require("../modules/om.js");

const LZString = require("../static/lz-string.min.js");
const sample = new Sample();

OM.web("getSurvey360", async (request) => {
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

    const userMail = user && user.email ? user.email : null;

    const getData = async (om) =>
        getDataSurvey(
            om,
            ENV.MULTICUBE_FIRST,
            ENV.MULTICUBE_SETTINGS_360,
            ENV.MULTICUBE_QUESTIONS_360,
            ENV.MULTICUBE_COMMON_TEXTAREA
        );

    const getListUsers = async (om) =>
        getEmployee(
            om,
            userMail,
            ENV.MULTICUBE_FILTER_EMPLOYEES,
            ENV.MAIN_LIST_USERS
        );
    // return JSON.stringify(listUsers);
    const getText360Model = async (om) =>
        getTextFields(om, ENV.MULTICUBE_TEXT_360);

    const getText180Model = async (om) =>
        getTextFields(om, ENV.MULTICUBE_TEXT_180);

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
        pivotCreateRaw(om, ENV.MULTICUBE_SETTINGS_360).then(
            (pivotHeadersSettings180) => {
                return rowsCollectFromRaw(pivotHeadersSettings180);
            }
        ); // Цвета

    const getCommonResults = await Promise.all([
        getData(om),
        getListUsers(om),
        getText360Model(om),
        getText180Model(om),
        getBackgroundRoot(om),
        getRowsCubesColors(om),
        getRowLabelFirst(om),
    ]);

    const [
        data,
        listUsers,
        getText360,
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
        getCommonResults[6],
    ];
    // return JSON.stringify([data, listUsers, getText180, backgroundRoot, hexColorBackground, rowLabelFirst])

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
    const header1 = sample.element({ tag: "h1", content: getText360[0][0] });
    const header2 = sample.div(getText360[1][0]);
    const header = `${header1}${header2}`;
    const button = sample.button("Отправить", {
        type: "submit",
        id: "buttonSend",
        ariaBusy: "false",
        style: {
            "--pico-background-color": hexColorButton,
            "--pico-border-color": hexColorButton,
        },
    });
    const form = sample.form(`${formContent.join("")}${button}`, {
        id: "form360",
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
    const lastHeader = sample.element({ tag: "header", content: lastHeaderH });
    const modalText = sample.p(getText180[5][0]);
    const articleLast = sample.element({
        tag: "article",
        content: `${lastHeader}${modalText}`,
        // className: "hidden",
        id: "lastArticle",
    });
    const dialog = sample.element({
        tag: "dialog",
        content: articleLast,
        // className: "hidden",
        id: "modalEnd",
    });
    const styleRadio = rbStyle(rgbaColor, hexColorRadio);
    const container = sample.element({
        tag: "main",
        content: `${section}${dialog}`,
        className: "container",
        "data-theme": "light",
    });
    const html = sample.html({
        lang: "ru",
        title: "Опрос 360",
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
