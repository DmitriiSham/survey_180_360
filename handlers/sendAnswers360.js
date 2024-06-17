const ENV = require("../ENV");
const LZString = require("../static/lz-string.min.js");
const {addTicketElement, sendAnswer} = require("../modules/om.js");

OM.web("sendAnswers360", async (request) => {
    if (!request.query.data) {
        return 432;
    }

    const om = await OM.connectAsync(
        ENV.HOST,
        ENV.WSS,
        ENV.TOKEN,
        ENV.MODEL_ID
    );
    const addedElement = await addTicketElement(om, ENV.MAIN_LIST_ANSWER);
    const decompressedJson = LZString.decompressFromEncodedURIComponent(
        request.query.data
    );
    const listEntries = Object.entries(JSON.parse(decompressedJson));
    const userMail = request.user.email;
    const data = await sendAnswer(
        om,
        listEntries,
        addedElement,
        userMail,
        ENV.MAIN_LIST_QUESTIONS_360,
        ENV.MULTICUBE_SETTINGS_360,
        ENV.MULTICUBE_INPUT_ANSWERS_1_360,
        ENV.MULTICUBE_INPUT_ANSWERS_2_360,
        ENV.MULTICUBE_INPUT_ANSWERS_3_360,
        ENV.MULTICUBE_INPUT_ANSWERS_4_360,
        ENV.MAIN_LIST_FEEDBACK,
        ENV.MULTICUBE_FILTER_EMPLOYEES,
        ENV.MAIN_LIST_USERS,
    );
    return JSON.stringify(data);
});