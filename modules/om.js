const { lastProperty } = require("../modules/html.js");
const { Sample } = require("../modules/sample.umd.cjs");

const sample = new Sample();

// === RAW DATA ===

const rowsCollect = async (rawQuestionsArray, questionsArray) => {
    for await (const chunk of rawQuestionsArray) {
        const raw = await chunk.rawDataAsync();
        questionsArray.push(raw.rowsHeaders());
    }
};

const rowsCollectFromRaw = async (rawData) => {
    const questionsArray = rawData.rowsHeaders();
    return questionsArray;
};

const rowsArray = async (rawQuestionsArray, questionsArray) => {
    for await (const chunk of rawQuestionsArray) {
        const raw = await chunk.rawDataAsync();
        questionsArray.push(raw.getRowsAsArray());
    }
};

const rowsArrayFromRaw = async (rawData) => {
    const questionsArray = rawData.getRowsAsArray();
    return questionsArray;
};

const rowsArrayValues = async (rawData) => {
    const questionsArray = rawData.getRawNativeValues();
    return questionsArray;
};

const rowsArrayTexts = async (rawData) => {
    const questionsArray = rawData.getRawTexts();
    return questionsArray;
};

// === COMMON ===

const getTextFields = async (om, mc) => {
    const pivotCommonMarks = await pivotCreateRaw(om, mc);
    const rowsRequired = await rowsArrayFromRaw(pivotCommonMarks);
    return rowsRequired;
};

const pivotCreateGenerator = async (om, mc, view) => {
    const pivot = om.multicubes.multicubesTab().open(mc).pivot(view);
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    return generator;
};

const pivotCreateRaw = async (om, mc, view) => {
    const pivot = om.multicubes.multicubesTab().open(mc).pivot(view);
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    for await (const chunk of generator) {
        const raw = await chunk.rawDataAsync();
        return raw;
    }
};

const pivotCreateMulticubesRaw = async (om) => {
    const pivot = om.multicubes.multicubesTab().pivot();
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    for await (const chunk of generator) {
        const raw = await chunk.rawDataAsync();
        return raw;
    }
};

const filteredMcGenerator = async (om, mc, filter, view) => {
    const pivot = om.multicubes
        .multicubesTab()
        .open(mc)
        .pivot(view)
        .addDependentContext(Number(filter));
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    return generator;
};

const filteredMcRaw = async (om, mc, filter, view) => {
    const pivot = om.multicubes
        .multicubesTab()
        .open(mc)
        .pivot(view)
        .addDependentContext(Number(filter));
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    for await (const chunk of generator) {
        const raw = await chunk.rawDataAsync();
        return raw;
    }
};

const listPivotCreate = async (om, list, view) => {
    const listTab = om.lists.listsTab().open(list).pivot(view);
    const listGrid = await listTab.createAsync();
    const listGenerator = listGrid.range().generator();
    const listLabels = await listGenerator[0].rowsAsync();
    return listLabels;
};

const listPivotCreateRaw = async (om, list, view) => {
    const listTab = om.lists.listsTab().open(list).pivot(view);
    const listGrid = await listTab.createAsync();
    const listGenerator = listGrid.range().generator();
    for await (const chunk of listGenerator) {
        const raw = await chunk.rawDataAsync();
        return raw;
    }
};

// === EMPLOYEE ===

const getEmployee = async (om, userMail, multicube, list, filterProperty) => {
    // забрать longId User
    const userMailCorrect = !!userMail ? userMail : "";
    const pivotEmployees = await listPivotCreateRaw(om, list);
    const usersRaw = await rowsArrayFromRaw(pivotEmployees);
    const users = await rowsCollectFromRaw(pivotEmployees);
    const filteredUsers = users.filter((item, index) => {
        const usersfilter = usersRaw[index];
        return (
            !filterProperty ||
            (usersfilter && usersfilter[filterProperty] === "true")
        );
    });
    // return [userMailCorrect, pivotEmployees, usersRaw, users, filteredUsers, filterProperty]
    let userFilterId = 0;
    let usersItems = [];
    if (!!users) {
        filteredUsers.forEach((userItem) => {
            userFilterId =
                userItem[0].label === userMailCorrect
                    ? userItem[0].longId
                    : userFilterId;
        });
    }
    // return filteredUsers;
    if (!userFilterId) {
        return usersItems;
    }
    //забрать список сотрудников (id и label) из МК
    const pivotListEmployees = await filteredMcRaw(om, multicube, userFilterId);
    const listEmployees = !pivotListEmployees
        ? []
        : await rowsCollectFromRaw(pivotListEmployees);
    // return [pivotListEmployees.length];
    if (!!userFilterId && listEmployees.length) {
        usersItems = listEmployees.map((item) => {
            const userItem = {};
            userItem.id = item[0].longId;
            userItem.text = item[0].label;
            return userItem;
        });
    }
    return usersItems;
};

// === SURVEY ===

const getDataSurvey = async (om, mc1, mc2, mc3, mc4) => {
    const questions = [];
    const rowsLabelsQuestions = [];
    const rowsRequired = [];

    for (const item of [mc1, mc2, mc3, mc4]) {
        const pivot = await pivotCreateGenerator(om, item);
        await rowsCollect(pivot, rowsLabelsQuestions);
        await rowsArray(pivot, rowsRequired);
    }

    // return rowsLabelsQuestions
    rowsLabelsQuestions.forEach((rawQuersions, index1) => {
        rawQuersions.forEach((row, index2) => {
            if (row.length > 1) {
                let firstHeader = row[row.length - 2];
                let secondHeader = row[row.length - 1];
                let questionId = firstHeader.longId;
                let questionText = firstHeader.label;
                let optionId = secondHeader.longId;
                let optionText = secondHeader.label;
                let optionRequired = rowsRequired[index1][index2].required;
                let questionIndex = questions.findIndex(
                    (question) => question.text === questionText
                );
                if (questionIndex !== -1) {
                    questions[questionIndex].options.push({
                        id: optionId,
                        text: optionText,
                        required: optionRequired,
                    });
                } else {
                    let newQuestion = {
                        id: questionId,
                        text: questionText,
                        type: "radio",
                        options: [
                            {
                                id: optionId,
                                text: optionText,
                                required: optionRequired,
                            },
                        ],
                    };
                    questions.push(newQuestion);
                }
            } else {
                let firstHeader = row[row.length - 1];
                let questionId = firstHeader.longId;
                let questionText = firstHeader.label;
                let optionRequired = rowsRequired[index1][index2].required;
                let newQuestion = {
                    id: questionId,
                    text: questionText,
                    type: "input",
                    required: optionRequired,
                };
                questions.push(newQuestion);
            }
        });
    });
    return questions;
};

// === ANSWERS ===

const addTicketElement = async (om, list) => {
    const addElementToList = om.lists
        .listsTab()
        .open(list)
        .elementsCreator()
        .numeric()
        .setCount(1);

    return await addElementToList.createAsync();
};

const sendAnswer = async (
    om,
    text,
    filter,
    userMail,
    listSurveyQuestions,
    listSurveySettings,
    mcAnswers1,
    mcAnswers2,
    mcAnswers3,
    mcAnswers4,
    listFB,
    mcFilterEmployees,
    listEmployees
) => {
    const pivotListLabels = await listPivotCreateRaw(om, listSurveyQuestions);
    const listLabels = await rowsCollectFromRaw(pivotListLabels);
    const listQuestionsValues = listLabels.map((item) => item[0].longId);

    const pivotListFeedback = await listPivotCreateRaw(om, listFB);
    const listFeedback = await rowsCollectFromRaw(pivotListFeedback);

    const listFeedbackItems = listFeedback.map((item) => {
        const feedbackItem = {};
        feedbackItem.id = item[0].longId;
        feedbackItem.text = item[0].label;
        return feedbackItem;
    });

    const pivotSettings = await pivotCreateRaw(om, listSurveySettings);
    const settingCubeId = await rowsCollectFromRaw(pivotSettings);

    const listQuestions = {};
    const listSettings = [];
    const listTexts = [];
    const listFeedbacks = {};
    const employees = await getEmployee(
        om,
        userMail,
        mcFilterEmployees,
        listEmployees
    );
    // return employees;
    text.forEach((item) => {
        if (Number(item[0]) === settingCubeId[0][0].longId) {
            listSettings[0] = item[1];
        } else if (listQuestionsValues.includes(Number(item[0]))) {
            listQuestions[Number(item[0])] = item[1];
        } else if (
            !!employees.find((employee) => employee.id === Number(item[1]))
        ) {
            listSettings[1] = item[1];
        } else if (
            !!listFeedbackItems.find(
                (feedback) => feedback.id === Number(item[0])
            )
        ) {
            listFeedbacks[Number(item[0])] = item[1];
        } else {
            listTexts.push(item[1]);
        }
    });
    const generator1 = await filteredMcGenerator(om, mcAnswers1, filter);
    if (generator1.length) {
        const cb = om.common.createCellBuffer().canLoadCellsValues(false);
        const label = await generator1[0].cellsAsync();
        const labelGroup = label.all();
        labelGroup.forEach((label, index) => {
            if (!label.getValue() && !!listTexts[index]) {
                cb.set(label, listTexts[index]);
            }
        });
        await cb.applyAsync();
    }

    const generator2 = await filteredMcGenerator(om, mcAnswers2, filter);
    if (generator2.length) {
        const cb = om.common.createCellBuffer().canLoadCellsValues(false);
        const label = await generator2[0].cellsAsync();
        const labelGroup = label.all();
        labelGroup.forEach((label, index) => {
            if (!label.getValue() && !!listSettings[index]) {
                cb.set(label, listSettings[index]);
            }
        });
        await cb.applyAsync();
    }

    const generator3 = await filteredMcGenerator(om, mcAnswers3, filter);
    if (generator3.length) {
        const cb = om.common.createCellBuffer().canLoadCellsValues(false);
        const label = await generator3[0].rowsAsync();
        const labelGroup = await label.allAsync();
        labelGroup.forEach((label) => {
            let cell = label.cells().first();
            if (
                !cell.getValue() &&
                cell.isEditable() &&
                !!listQuestions[label.first().longId()]
            ) {
                cb.set(cell, listQuestions[label.first().longId()]);
            }
        });
        await cb.applyAsync();
    }

    const generator4 = await filteredMcGenerator(om, mcAnswers4, filter);
    if (generator4.length) {
        const cb = om.common.createCellBuffer().canLoadCellsValues(false);
        const label = await generator4[0].rowsAsync();
        const labelGroup = await label.allAsync();
        labelGroup.forEach((label) => {
            let cell = label.cells().first();
            if (
                !cell.getValue() &&
                cell.isEditable() &&
                !!listFeedbacks[label.first().longId()]
            ) {
                cb.set(cell, listFeedbacks[label.first().longId()]);
            }
        });
        await cb.applyAsync();
        return !cb.count();
    }
};

// === REPORT ===

const getReportData = async (
    om,
    mcMarks,
    mcFeedback,
    mcFeedbackCount,
    mcSettingsChart,
    selectedEmployee
) => {
    const pivotCommonMarks = await filteredMcRaw(
        om,
        mcMarks, //ENV.MULTICUBE_COMMON_MARKS,
        Number(selectedEmployee)
    );
    const pivotCommonFeedback = await filteredMcRaw(
        om,
        mcFeedback, //ENV.MULTICUBE_FEEDBACK_REPORT,
        Number(selectedEmployee)
    );
    const pivotFeedbackCount = await filteredMcRaw(
        om,
        mcFeedbackCount, //ENV.MULTICUBE_FEEDBACK_COUNT,
        Number(selectedEmployee)
    );
    const pivotSettingsChart = await pivotCreateRaw(
        om,
        mcSettingsChart //ENV.MULTICUBE_SETTING_CHART
    );

    const rowsLabelsChart = await rowsCollectFromRaw(pivotCommonMarks);
    const rowsMarksChart = await rowsArrayTexts(pivotCommonMarks);
    const rowsSettings = await rowsArrayFromRaw(pivotSettingsChart);
    const rowsLabelsFeedback = await rowsCollectFromRaw(pivotCommonFeedback);
    const rowsTextFeedback = await rowsArrayTexts(pivotCommonFeedback);
    const rowsLabelsCountMarks = await rowsCollectFromRaw(pivotFeedbackCount);
    const rowsTextCountMarks = await rowsArrayTexts(pivotFeedbackCount);

    return {
        rowsLabelsChart,
        rowsMarksChart,
        rowsSettings,
        rowsLabelsFeedback,
        rowsTextFeedback,
        rowsLabelsCountMarks,
        rowsTextCountMarks,
    };
};

const createChartData = (reportData) => {
    const { rowsMarksChart, rowsLabelsChart, rowsSettings } = reportData;

    const filteredRowsMarks = rowsMarksChart.filter((item) =>
        item.includes("true")
    );
    const filteredRowsLabels = rowsLabelsChart.filter((item, index) =>
        rowsMarksChart[index].includes("true")
    );
    const datasetLabels = [
        ...new Set(filteredRowsLabels.map((item) => item[0].label)),
    ];
    const labels = [
        ...new Set(filteredRowsLabels.map((item) => item[1].label)),
    ];
    const datasets = datasetLabels.map((itemDataset) => {
        let itemLabel = {};
        itemLabel.label = itemDataset;
        itemLabel.data = filteredRowsMarks
            .map((itemRowsMarks) => {
                if (itemRowsMarks[itemRowsMarks.length - 1] === itemDataset) {
                    return Number(itemRowsMarks[0].toFixed(2));
                }
            })
            .filter((itemRowsMarks) => itemRowsMarks > 0);
        const settingsObjLp = lastProperty(rowsSettings[0]);
        //находим объект с itemDataset в кубе ITEM('L4.4 Виды оценки') (последнем)
        const settingsObj = rowsSettings.find(
            (item) => item[settingsObjLp] === itemDataset
        );
        const settingsArrLp = lastProperty(settingsObj);
        //выделяем свойство последнее (куб ITEM('L4.4 Виды оценки')) и все оставшиеся свойства
        const { [settingsArrLp]: lastPropertyValue, ...restObj } = settingsObj;
        //добавляем настройки цветов и заполнения
        const itemFinalLabel = { ...itemLabel, ...restObj };
        return itemFinalLabel;
    });

    return {
        labels,
        datasets,
    };
};

const createTableData = (reportData) => {
    const {
        rowsLabelsFeedback,
        rowsTextFeedback,
        rowsLabelsCountMarks,
        rowsTextCountMarks,
    } = reportData;

    /* === Данные для таблицы с отзывами === */
    const headerLabels = [
        // шапки таблиц
        ...new Set(rowsLabelsFeedback.map((item) => item[0].label)),
    ];
    const rawLabelsFeedback = rowsLabelsFeedback.map((item) => item[1].label);
    const filteredLabelsFeedback = [...new Set(rawLabelsFeedback)];
    const flatRowLabelsFeedback = rowsTextFeedback.map((item) => item[0]);
    let rowsValuesFeedback = []; // итоговый массив значений строк разбитый по chunk
    let rowsHeaderFeedback = []; // итоговый массив заголовков строк разбитый по chunk
    const chunkFeedback = filteredLabelsFeedback.length;
    for (let i = 0; i < flatRowLabelsFeedback.length; i += chunkFeedback) {
        const feedbackText = Array.from(
            flatRowLabelsFeedback.slice(i, i + chunkFeedback)
        );
        const feedbackTextFiltered = feedbackText.filter((item) => !!item);
        const feedbackTextFilteredSet = feedbackTextFiltered.map((item) =>
            [...new Set(item.split("\n\n"))].join(";\n")
        );
        const feedbackLabel = Array.from(
            rawLabelsFeedback.slice(i, i + chunkFeedback)
        ).filter((item, index) => !!feedbackText[index]);
        rowsValuesFeedback.push(feedbackTextFilteredSet);
        rowsHeaderFeedback.push(feedbackLabel);
    }
    /* === Данные для таблицы с кол-ом оценок === */
    const filteredRowsCountLabels = rowsLabelsCountMarks
        .filter((item, index) => rowsTextCountMarks[index].includes("true"))
        .map((item) => item[0].label);
    const filteredRowsCountMarks = rowsTextCountMarks
        .filter((item) => item.includes("true"))
        .map((item) => item[0]);
    // const rowsValuesFeedbackSet = [...new Set(rowsValuesFeedback)];
    return {
        headerLabels,
        rowsValuesFeedback,
        rowsHeaderFeedback,
        filteredRowsCountLabels,
        filteredRowsCountMarks,
    };
};

// просто функция для того, чтобы предлоги не отрывались от следующего слова
const fixText = (text) => {
    text = text.replace(/(\s)([\а-я]{1,3})(\s)/gim, "$1$2&nbsp;");

    return text;
};

// формируем таблицу по переданным данным
const userTable = (
    rowsLabels,
    rowsArray,
    columnsLabels,
    caption,
    headerFirstColumn,
    total
) => {
    // название (caption) таблицы
    const captionElement = sample.element({
        tag: "caption",
        content: sample.element({ tag: "h4", content: caption }),
    });

    // заголовок таблицы
    const headerCells = [headerFirstColumn, columnsLabels].map((item) =>
        sample.element({
            tag: "th",
            content: sample.element({ tag: "em", content: fixText(item) }),
        })
    );
    const headerRow = sample.element({
        tag: "tr",
        content: headerCells.join(""),
    });
    const thead = sample.element({
        tag: "thead",
        content: headerRow,
        style: { "--pico-background-color": "#dfe4ec" },
    });
    const rows = rowsLabels.map((item, index) => {
        return [item, rowsArray[index]];
    });

    // добавляет total строку
    let tfoot;
    if (total) {
        const sumMarks = rowsArray.reduce((acc, item) => acc + item, 0);
        const totalLabel = sample.element({ tag: "th", content: total });
        const totalValue = sample.element({
            tag: "td",
            content: sumMarks,
            className: "tdValue",
        });
        tfoot = sample.element({
            tag: "tfoot",
            content: `${totalLabel}${totalValue}`,
        });
    }

    // формируем построчно содержимое таблицы
    const tableRows = rows.map((item) => {
        const row = item.map((value, index) => {
            if (index) {
                return sample.element({
                    tag: "td",
                    content: value,
                    className: "tdValue",
                });
            }
            return sample.element({
                tag: "td",
                content: sample.strong(value),
                className: "tdRow",
            });
        });
        return sample.element({ tag: "tr", content: row.join("") });
    });

    // формируем тело таблицы из строк
    const tbody = sample.element({ tag: "tbody", content: tableRows.join("") });

    // собираем контент таблицы и возвращаем ее
    const tableContent = tfoot
        ? `${captionElement}${thead}${tbody}${tfoot}`
        : `${captionElement}${thead}${tbody}`;

    return sample.element({
        tag: "table",
        content: tableContent,
        className: "striped", // полосатая
    });
};

const sortedSelect = (data, selectedUser) => {
    const sortedData = data.sort((a, b) => {
        if (a.text.toLocaleLowerCase() > b.text.toLocaleLowerCase()) {
            return 1;
        }
        if (a.text.toLocaleLowerCase() < b.text.toLocaleLowerCase()) {
            return -1;
        }
        return 0;
    });

    const options = [
        sample.option("Выберите пользователя", {
            selected: !selectedUser,
            disabled: "disabled",
            value: "",
            hidden: "hidden",
        }),
    ];
    let optGrp = [];
    let optLabel = "";

    sortedData.forEach((item, index, data) => {
        if (!index || data[index].text[0] !== data[index - 1].text[0]) {
            if (optGrp.length && optLabel) {
                options.push(
                    sample.element({
                        tag: "optgroup",
                        content: optGrp.join("\n"),
                        label: optLabel,
                    })
                );
            }
            optGrp = [];
            optLabel = data[index].text[0];
        }
        const selected =
            selectedUser && selectedUser.id && +item.id === +selectedUser.id;
        optGrp.push(sample.option(item.text, { selected, value: item.id }));
    });
    options.push(
        sample.element({
            tag: "optgroup",
            content: optGrp.join("\n"),
            label: optLabel,
        })
    );

    return sample.select(options.join("\n"), { id: "report", name: "report" });
};

const reportNav = (select, selectedUser, paramsReportUser) => {
    const loader = `<div id="loader" aria-busy="true" style="display: none;"></div>`;
    const printButton = sample.button("Print/PDF", { onClick: "print();" });
    const user = sample.strong(
        selectedUser && !!selectedUser.text
            ? selectedUser.text
            : "Выберите пользователя"
    );
    const userUl = sample.ul(
        sample.li(
            sample.element({
                tag: "h4",
                content: user,
                style: { "margin-bottom": 0 },
            })
        )
    );
    const paramsUser = !!paramsReportUser
        ? sample.div(`${paramsReportUser[0]}, ${paramsReportUser[1]}`)
        : "";
    const userDiv = sample.div(`${userUl}${paramsUser}`);
    const selectUl = sample.ul(
        `${sample.li(loader)}${sample.li(select)}${sample.li(printButton)}`,
        { id: "userform" }
    );

    return sample.element({ tag: "nav", content: `${userDiv}${selectUl}` });
};

module.exports = {
    rowsCollect,
    rowsCollectFromRaw,
    rowsArray,
    rowsArrayFromRaw,
    rowsArrayValues,
    rowsArrayTexts,
    getTextFields,
    pivotCreateGenerator,
    pivotCreateRaw,
    filteredMcGenerator,
    filteredMcRaw,
    listPivotCreate,
    listPivotCreateRaw,
    getEmployee,
    getDataSurvey,
    addTicketElement,
    sendAnswer,
    pivotCreateMulticubesRaw,
    getReportData,
    createChartData,
    createTableData,
    userTable,
    sortedSelect,
    reportNav,
};
