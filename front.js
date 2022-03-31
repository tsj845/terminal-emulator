/**@type {HTMLDivElement} */
const output = document.getElementById("output");
// /**@type {HTMLSpanElement} */
// const cursor_span = document.getElementById("cursor");
/**@type {HTMLPreElement} */
const keydisp = document.getElementById("keydisp");
/**@type {HTMLPreElement} */
const posdisp = document.getElementById("posdisp");

/**
 * console logging
 * @param  {...any} args - what to log
 */
const mlog = (...args) => {
    window.electronAPI.mlog(args);
}

/**@type {String} */
let input = "";

/**
 * @property {String} text - text to display
 * @property {{r : Number, g : Number, b : Number}} color - color data
 * @property {Number} styles - flags for boolean styling
 * @readonly {Number} length - length of text
 */
class TextData {
    /**
     * stores data on text
     * @param {String} text - text to display
     * @param {{r : Number, g : Number, b : Number}} color - color data
     * @param {Number} styles - flags for boolean styling
     * @constructor
     */
    constructor (text, color, styles) {
        // {text : String, color : {r : Number, g : Number, b : Number}, styles : Number}
        this.text = text || "";
        this.color = color || {r:255,g:255,b:255};
        this.styles = styles || 0;
    }
    /**
     * checks if two text data objects have the same properties
     * @method
     * @param {{r : Number, g : Number, b : Number}} color - color to check against
     * @param {Number} styles - styles to check against
     * @returns {Boolean}
     */
    style_match (color, styles) {
        return (this.color === color && this.styles === styles)
    }
    get length () {
        return this.text.length;
    }
}

/**@type {Array<Array<TextData>>} */
let lines = [];

function update_cursor () {
    // cursor_span.style.setProperty("--x", cursor.x);
    // cursor_span.style.setProperty("--y", cursor._y);
    if (output.children.length <= cursor.y) {
        mlog("not enough lines");
        return;
    }
    /**@type {HTMLPreElement} */
    const target = output.children[cursor.y];
    let c = "";
    for (const i in target.children) {
        // mlog(Object.getPrototypeOf(target.children[i]));
        // mlog(Object.getPrototypeOf(target.children[i]).toString());
        c += target.children[i].textContent || "";
    }
    c += " ";
    // mlog(c);
    if (c.length < cursor.x) {
        mlog("not enough chars", c, c.length, cursor.x);
        return;
    }
    target.replaceChildren();
    // target.textContent = "";
    const s0 = document.createElement("span");
    s0.textContent = c.slice(0, cursor.x);
    target.appendChild(s0);
    /**@type {HTMLSpanElement} */
    const s = document.createElement("span");
    s.className = "cursor";
    s.textContent = c[cursor.x];
    target.appendChild(s);
    const s2 = document.createElement("span");
    s2.textContent = c.slice(cursor.x+1);
    target.appendChild(s2);
    // mlog(`"${s0.textContent}" "${s.textContent}" "${s2.textContent}" "${input}" "${c}"`);
}

/**@type {{x : Number, y : Number}} */
let cursor = {x : 0, y : 0};
// let cursor = {_x : 0, _y : 0, get x () {return this._x}, set x (v) {this._x = v}, get y () {return this._y}, set y (v) {this._y = v}};

update_cursor();

/**
 * processes a line
 * @param {String} line - line to process
 * @returns {void}
 */
function output_line (line) {
    lines.push([]);
    let color = undefined;
    let styles = undefined;
    for (let i = 0; i < line.length; i ++) {
        if (line[i] === "\x1b") {
            i += 1;
            if (line[i] === "[") {
                let ansi_exp = "";
                while (true) {
                    if (i >= line.length) {
                        return;
                    }
                    ansi_exp += line[i];
                    if (line[i].match(/[a-zA-Z]/)) {
                        break;
                    }
                    i += 1;
                }
            } else if (line[i] === "c") {
                lines = [[]];
            } else {
                lines[lines.length-1].push(new TextData(line[i], color, styles))
            }
            continue;
        } else {
            lines[lines.length-1].push(new TextData(line[i], color, styles));
        }
    }
}

/**
 * helper function that joins the characters in the stored lines
 * @returns {Array<Array<TextData>>}
 */
function combine_chars () {
    let lins = [];
    for (let y = 0; y < lines.length; y ++) {
        let l = [];
        let build = new TextData();
        for (let x = 0; x < lines[y].length; x ++) {
            if (build.length === 0) {
                build = lines[y][x];
                continue;
            }
            if (build.style_match(lines[y][x])) {
                build.text += lines[y][x].text;
            } else {
                l.push(build);
                l = lines[y][x];
            }
        }
        l.push(build);
        lins.push(l);
    }
    return lins;
}

/**
 * displays the lines
 * @returns {void}
 */
function display_lines () {
    let locallines = combine_chars();
}

/**
 * displays a string
 * @param {String} s - string to display
 * @returns {void}
 */
function do_output (s) {
    mlog(s);
    output.replaceChildren();
    s = s.split("\n");
    for (const i in s) {
        output_line(s[i]);
    }
    display_lines();
    
}

async function execute () {
    // output.textContent = "in progress";
    do_output(await window.electronAPI.termExec(input));
}

let ctrl = false;
let alt = false;
let meta = false;
let shift = false;

function kill_cursor () {
    const target = output.children[cursor.y];
    const s = document.createElement("span");
    s.textContent = target.children[0].textContent + target.children[1].textContent + target.children[2].textContent;
    target.replaceChildren(s);
}

function addin (c) {
    input = input.slice(0, cursor.x) + c + input.slice(cursor.x);
}

function handleKey (e) {
    const key = e.code.toString();
    if (key === "ShiftLeft" || key === "ShiftRight") {
        shift = true;
    } else if (key == "MetaLeft" || key === "MetaRight") {
        meta = true;
    } else if (key === "AltLeft" || key === "AltRight") {
        alt = true;
    } else if (key === "ControlLeft" || key === "ControlRight") {
        ctrl = true;
    } else if (key === "Backspace") {
        if (meta) {
            input = "";
            cursor.x = 0;
        } else if (input.length > 0) {
            cursor.x -= 1;
            input = input.slice(0, cursor.x) + input.slice(cursor.x+1);
        } else if (cursor.y > 0) {
            kill_cursor();
            output.removeChild(output.children[cursor.y]);
            cursor.y -= 1;
            const t = output.children[cursor.y].children[0].textContent;
            input = t.slice(0, t[t.length-1] === " " ? t.length-1 : t.length);
            cursor.x = input.length;
        }
    } else if (key === "Space") {
        addin(" ");
        cursor.x += 1;
    } else if (key === "Enter") {
        kill_cursor();
        cursor.y += 1;
        cursor.x = 0;
        output.children[cursor.y-1].insertAdjacentElement("afterend", document.createElement("pre"));
        if (shift) {
            execute();
        }
        input = "";
    } else if (key.indexOf("Arrow") === 0) {
        if (key === "ArrowUp" || key === "ArrowDown") {
            // set to false when a move fails
            let nrf = true;
            if (key === "ArrowUp") {
                if (meta) {
                    kill_cursor();
                    cursor.y = 0;
                    cursor.x = 0;
                } else if (cursor.y > 0) {
                    kill_cursor();
                    cursor.y -= 1;
                } else {
                    cursor.x = 0;
                    nrf = false;
                }
            } else {
                if (meta) {
                    kill_cursor();
                    cursor.y = output.children.length - 1;
                    cursor.x = -1;
                } else if (cursor.y < output.children.length - 1) {
                    kill_cursor();
                    cursor.y += 1;
                } else {
                    cursor.x = input.length;
                    nrf = false;
                }
            }
            if (nrf) {
                const t = output.children[cursor.y].children[0].textContent;
                input = t.slice(0, t[t.length-1] === " " ? t.length-1 : t.length);
                cursor.x = cursor.x === -1 ? input.length : Math.min(cursor.x, input.length);
            }
        } else {
            if (key === "ArrowRight") {
                if (meta) {
                    cursor.x = input.length;
                } else if (cursor.x < input.length) {
                    cursor.x += 1;
                }
            } else {
                if (meta) {
                    cursor.x = 0;
                } else if (cursor.x > 0) {
                    cursor.x -= 1;
                }
            }
        }
    } else {
        if (key.indexOf("Key") === 0) {
            addin(shift ? key[3] : key[3].toLowerCase());
            cursor.x += 1;
        } else if (key.indexOf("Digit") === 0) {
            const uppers = ")!@#$%^&*(";
            addin(shift ? uppers[key[5]] : key[5]);
            cursor.x += 1;
        } else {
            const lowers = "'`\\/;[].,-=";
            const uppers = "\"~|?:{}><_+";
            const tests = ["Quote", "Backquote", "Backslash", "Slash", "Semicolon", "BracketLeft", "BracketRight", "Period", "Comma", "Minus", "Equal"];
            for (const i in tests) {
                if (key === tests[i]) {
                    addin(shift ? uppers[i] : lowers[i]);
                    cursor.x += 1;
                    break;
                }
            }
        }
    }
    const cn = document.createElement("span");
    cn.textContent = input;
    output.children[cursor.y].replaceChildren(cn);
    keydisp.textContent = ` : ${key}`;
    posdisp.textContent = `(${cursor.x}, ${cursor.y})`;
    update_cursor();
    // mlog(output.children[0].children.length);
}

document.addEventListener("keydown", handleKey);

document.addEventListener("keyup", (e) => {
    const key = e.code.toString();
    if (key === "ShiftLeft" || key === "ShiftRight") {
        shift = false;
    } else if (key === "MetaLeft" || key === "MetaRight") {
        meta = false;
    } else if (key === "AltLeft" || key === "AltRight") {
        alt = false;
    } else if (key === "ControlLeft" || key === "ControlRight") {
        ctrl = false;
    }
    // if (key === "Enter") {
    //     // window.electronAPI.termExec(input);
    //     // input = "";
    // } else {
    //     input += key;
    // }
    // if (output.children.length > 0) {
    //     output.children[output.children.length-1].textContent = input;
    // } else {
    //     output.appendChild(document.createElement("br"));
    //     output.append(input);
    // }
});