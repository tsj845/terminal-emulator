/**@type {HTMLInputElement} */
const input = document.getElementById("input");
/**@type {HTMLSpanElement} */
const output = document.getElementById("output");

function do_output (s) {
    output.replaceChildren();
    s = s.split("\n");
    for (const i in s) {
        output.append(s[i]);
        output.appendChild(document.createElement("br"));
    }
}

async function execute () {
    // output.textContent = "in progress";
    const v = input.value;
    input.value = "";
    do_output(await window.electronAPI.termExec(v));
}

input.addEventListener("keyup", (e) => {
    const key = e.code.toString();
    if (key === "Enter") {
        execute();
    }
});

document.addEventListener("click", () => {
    input.focus();
});

input.focus();