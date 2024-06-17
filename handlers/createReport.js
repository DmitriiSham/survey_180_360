const ENV = require("../ENV");
const { Sample } = require("../modules/sample.umd.cjs");
const { redirectToSign } = require("../modules/html.js");
const { getEmployee, getTextFields, rowsCollectFromRaw, rowsArrayTexts, listPivotCreateRaw, getReportData, createChartData, createTableData, userTable, sortedSelect, reportNav  } = require("../modules/om.js");
const sample = new Sample();

const htmlPage = (content, userName) => {
    const html = sample.html({
        lang: "ru",
        title: (userName ? `${userName} - Отчет` : "Отчет"),
        // scripts: ["https://cdn.jsdelivr.net/npm/chart.js", "report.js"],
        scripts: ["chart.js", "report.js"],
        css: ["pico.min.css", "container.css", "report.css"],
        content: `${content}`,
    });

    return {
        headers: {
            contentType: "text/html",
        },
        body: html,
    };
}

OM.web("createReport", async (request) => {
    const om = await OM.connectAsync(
        ENV.HOST,
        ENV.WSS,
        ENV.TOKEN,
        ENV.MODEL_ID
    );

    const { user, params, query } = request;

    if (!user) {
        return redirectToSign(params);
    }

    const { report } = query; // id из селектора

    const userMail = user && user.email ? user.email : null;
    const listUsers = await getEmployee(om, userMail, ENV.MULTICUBE_EMPLOYEES_REPORT, ENV.MAIN_LIST_USERS, ENV.MAIN_LIST_USERS_FILTERPROPERTY);
    const reportUser = listUsers.find(({ id }) => +id === +report);
    // return JSON.stringify(reportUser);

    const pivotListEmployees = await listPivotCreateRaw(om, ENV.MAIN_LIST_EMPLOYEES, ENV.MAIN_LIST_EMPLOYEES_VIEW);// Справочник сотрудники
    const rowsLabelsEmployees = await rowsCollectFromRaw(pivotListEmployees);
    const rowsParamsEmployees = await rowsArrayTexts(pivotListEmployees);
    const labelsEmployees = rowsLabelsEmployees.map(item => item[0])
    let employeesEntries = {};
    labelsEmployees.forEach((key, index) => {
        employeesEntries[key.longId] = rowsParamsEmployees[index];
    });

    // return JSON.stringify(employeesEntries);
    const paramsReportUser = employeesEntries[report] || null;

    const header = sample.element({ tag: "header", content: reportNav(sortedSelect(listUsers, reportUser), reportUser, paramsReportUser), style: { "padding-bottom": "20px" } });
    let content = [];
    // return JSON.stringify(header);

    if (reportUser) {
        const reportData = await getReportData(om, ENV.MULTICUBE_COMMON_MARKS, ENV.MULTICUBE_FEEDBACK_REPORT, ENV.MULTICUBE_FEEDBACK_COUNT, ENV.MULTICUBE_SETTING_CHART, reportUser.id);
        const chartData = createChartData(reportData);
        const tableData = createTableData(reportData);
        const {
            headerLabels,
            rowsValuesFeedback,
            rowsHeaderFeedback,
            filteredRowsCountLabels,
            filteredRowsCountMarks,
        } = tableData;

        // return JSON.stringify(chartData);

        // console.log(JSON.stringify(tableData));

        // chart data as json
        const dataScript = sample.element({
            tag: "script",
            content: `const chartData = JSON.parse('${JSON.stringify(chartData)}');\n`,
        });
        content.push(dataScript);
        // chart headerheader
        const textFields = await getTextFields(om, ENV.MULTICUBE_TEXT_180);
        if (textFields[3] && textFields[3][0]) {
            content.push(sample.element({ tag: 'h4', content: textFields[3][0], id: 'h4header' }));
        }
        // chart container
        const chartCanvas = sample.element({ tag: "canvas", id: "radarChart", style: {"background-color": "rgba(255, 255, 255, 0)"}});
        const chartDiv = sample.div(chartCanvas, { id: "chartContainer" });
        content.push(chartDiv);

        // tables
        const firstColumnHeader = "Я оцениваю";
        const totalRowHeader = "Общее количество";
        const table_3Header = "Сколько человек приняли участие в оценке";
        const resultTable_1 = userTable(
            rowsHeaderFeedback[0],
            rowsValuesFeedback[0],
            headerLabels[0],
            "",
            firstColumnHeader,
        );
        const tableDiv_1 = sample.div(resultTable_1, { id: "table_1", style: { "margin-top": "-220px;" } });
        content.push(tableDiv_1);

        const resultTable_2 = userTable(
            rowsHeaderFeedback[1],
            rowsValuesFeedback[1],
            headerLabels[1],
            "",
            firstColumnHeader,
        );
        const tableDiv_2 = sample.div(resultTable_2, { id: "table_2" });
        content.push(tableDiv_2);

        const tableCountMarks = userTable(
            filteredRowsCountLabels,
            filteredRowsCountMarks,
            table_3Header,
            "",
            firstColumnHeader,
            totalRowHeader,
        );
        const tableDiv_3 = sample.div(tableCountMarks, { id: "table_3" });
        content.push(tableDiv_3);

    }
    const main = sample.element({ tag: "main", className: 'container', content: content.join('\n') });

    return (reportUser) ? htmlPage(`${header}${main}`, reportUser.text) : htmlPage(`${header}${main}`, null);
});



