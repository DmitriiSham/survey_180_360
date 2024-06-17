const ENV = require("../ENV");
const { Sample } = require("../modules/sample.umd.cjs");
const { questionChoice, questionSelect, questionText, redirectToSign, rbStyle, hexToRgba } = require("../modules/html.js");
const { getDataSurvey, getEmployee, getTextFields, pivotCreateRaw, rowsCollectFromRaw, rowsArrayTexts, pivotCreateMulticubesRaw } = require("../modules/om.js");

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

    const data = await getDataSurvey(
        om,
        ENV.MULTICUBE_FIRST,
        ENV.MULTICUBE_SETTINGS_180,
        ENV.MULTICUBE_QUESTIONS_180,
        ENV.MULTICUBE_COMMON_TEXTAREA
    );
    // return JSON.stringify(om.modelInfo().name());

    const userMail = user && user.email ? user.email : null;

    const listUsers = await getEmployee(
        om,
        userMail,
        ENV.MULTICUBE_FILTER_EMPLOYEES,
        ENV.MAIN_LIST_USERS
    );
    // return JSON.stringify(listUsers);
    const getText180 = await getTextFields(om, ENV.MULTICUBE_TEXT_180);

    const pivotStyleScheme = await pivotCreateRaw(om, ENV.MULTICUBE_COLOR_SCHEME);// Цвета
    const rowsLabelsColors = await rowsCollectFromRaw(pivotStyleScheme);
    const rowsCubesColors = await rowsArrayTexts(pivotStyleScheme);
    const backgroundRoot = rowsLabelsColors.map(item => item[0])
    const hexColorBackground = rowsCubesColors.map(item => item[0]);
    let hexColorBackgroundEntries = {};
    backgroundRoot.forEach((key, index) => {
        hexColorBackgroundEntries[key.longId] = hexColorBackground[index];
    });
    const jsonHexBackground = LZString.compressToEncodedURIComponent(JSON.stringify(hexColorBackgroundEntries));
    const hexColorButton = rowsCubesColors[0][1];
    const hexColorRadio = rowsCubesColors[0][2];
    const rgbaColor = hexToRgba(hexColorRadio, 0.5); // Прозрачность 50%

    const pivotHeadersSettings180 = await pivotCreateRaw(om, ENV.MULTICUBE_SETTINGS_180);// Цвета
    const rowLabelFirst = await rowsCollectFromRaw(pivotHeadersSettings180);
    const firstHeader = rowLabelFirst[0][0].longId; // longId fieldset

    const pivotMulticubes = await pivotCreateMulticubesRaw(om)
    const rawColor = await rowsCollectFromRaw(pivotMulticubes)
    const findMcLongId = rawColor.find((item) => item[0].label === ENV.MULTICUBE_SETTINGS_180)[0].longId // longId мультикуба по названию
    // return JSON.stringify(jsonHexBackground)

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
        ariaBusy: "false",
        style: { '--pico-background-color': hexColorButton, '--pico-border-color': hexColorButton },
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
    const lastHeaderH = sample.element({ tag: "h3", content: getText180[2][0] });
    const lastHeader = sample.element({ tag: "header", content: lastHeaderH });
    const modalText = sample.p(getText180[5][0]);
    const articleLast = sample.element({
        tag: "article",
        content: `${lastHeader}${modalText}`,
        id: "lastArticle",
    });
    // return JSON.stringify(lastHeaderH)
    const dialog = sample.element({
        tag: "dialog",
        content: articleLast,
        id: "modalEnd",
    });
    const styleRadio = rbStyle(rgbaColor, hexColorRadio);
    const container = sample.element({
        tag: "main",
        content: `${section}${dialog}`,
        className: "container",
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