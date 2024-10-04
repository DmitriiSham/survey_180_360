const { Sample } = require("./sample.umd.cjs");
const ENV = require("../ENV");

const sample = new Sample();

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const questionChoice = (item, firstHeader, hexColorBackgroundEntries) => {
    const testSelectedIndex = getRandomInt(0, item.options.length - 1); // предварительно выбранный пункт
    const options = item.options.map((option, index) => {
        // const input = sample.element({
        //     tag: "input",
        //     type: item.type,
        //     required: option.required,
        //     name: item.id,
        //     value: option.id,
        //     onchange: `changeBackground(this,${firstHeader},'${hexColorBackgroundEntries}')`,
        // });
        const input =
            index === testSelectedIndex
                ? sample.element({
                      tag: "input",
                      type: item.type,
                      required: option.required,
                      name: item.id,
                      value: option.id,
                      checked: "checked",
                      onchange: `changeBackground(this,${firstHeader},'${hexColorBackgroundEntries}')`,
                  })
                : sample.element({
                      tag: "input",
                      type: item.type,
                      required: option.required,
                      name: item.id,
                      value: option.id,
                      onchange: `changeBackground(this,${firstHeader},'${hexColorBackgroundEntries}')`,
                  });
        return sample.element({
            tag: "label",
            content: `${input}${option.text}`,
        });
    });
    const header = sample.strong(item.text);
    const legend = sample.element({ tag: "legend", content: header });
    const fieldset = sample.element({
        tag: "fieldset",
        content: `${legend}${options.join("")}`,
        id: item.id,
    });
    return sample.element({
        tag: "article",
        content: fieldset,
        className: "afterSelect hidden",
    });
};

const questionText = (item) => {
    const header = sample.strong(item.text);
    const input = sample.element({
        tag: "textarea",
        type: item.type,
        required: item.required,
        name: item.id,
        rows: 3,
        spellcheck: "true",
    });
    const label = sample.element({
        tag: "label",
        for: item.id,
        content: header,
    });
    const div = sample.div(`${label}${input}</textarea>`);
    return sample.element({
        tag: "article",
        content: div,
        className: "afterSelect hidden",
    });
};

const questionSelect = (userItems, item, options) => {
    const header = sample.strong(item.text);
    const firstItem = [{ id: "firstItem", text: "Выберите сотрудника" }];
    const items = [...firstItem, ...userItems].map((item, index) =>
        sample.option(item.text, {
            value: index === 0 ? "placeholder" : `${item.id}`,
            selected: index === 0 ? "selected" : undefined,
            disabled: index === 0 ? "disabled" : undefined,
            hidden: index === 0 ? "hidden" : undefined,
            // required: "required",
        })
    );
    const itemsSelect = sample.select(items.join(""), {
        ...options,
        className: "employee-select",
        required: "required",
        onchange: "showQuestions()",
    });
    const label = sample.element({
        tag: "label",
        for: item.id,
        content: header,
    });
    const div = sample.div(`${label}${itemsSelect}`);
    return sample.element({ tag: "article", content: div });
};

const lastProperty = (array) => {
    //индекс последнего элемента массива
    const settingsArr = Object.keys(array); //возвращает массив строк, представляющих индексы элементов массива
    const property = settingsArr[settingsArr.length - 1];
    return property;
};

const rbStyle = (rgbaColor, hexColorRadio) => {
    return sample.element({
        tag: "style",
        content: `\n[data-theme=light], :root:not([data-theme=dark]) {
        --pico-primary-focus: ${rgbaColor};
        --pico-primary-background: ${hexColorRadio};
        }
        [type=radio]:checked, [type=radio]:checked:active, [type=radio]:checked:focus {
        --pico-border-color: ${hexColorRadio};
        accent-color: ${hexColorRadio}; 
        };\n`,
    });
};

function redirectToSign(params) {
    const { appId, path } = params;
    const script = sample.element({
        tag: "script",
        content: `const params = JSON.parse('${JSON.stringify({
            appId,
            path,
        })}');\n`,
    });
    const html = sample.html({
        lang: "ru",
        title: "Auth Redirect",
        scripts: ["redirect.js"],
        content: script,
    });

    return {
        headers: {
            contentType: "text/html",
        },
        body: html,
    };
}

function hexToRgba(hex, alpha) {
    // Убираем символ '#', если он есть
    if (hex) {
        hex = hex.replace(/^#/, "");
    } else {
        hex = "8068BC";
    }
    // Разбиваем HEX на составляющие: R, G, B
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    // Если указано значение альфа-канала, используем его, иначе 1 (непрозрачность)
    alpha = alpha || 1;
    // Возвращаем строку в формате RGBA
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

module.exports = {
    questionChoice,
    questionText,
    questionSelect,
    lastProperty,
    rbStyle,
    redirectToSign,
    hexToRgba,
};
