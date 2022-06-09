// ==UserScript==
// @name        [Discord] Periodic Message Writer
// @namespace   Discord Scripts
// @match       https://discord.com/channels/*
// @grant       none
// @version     0.0.0.1
// @author      slhad
// @description Adds a message to a channel periodically
// ==/UserScript==

var baseTypeSpeed = 450
var randomInterval = 50
const ke = new KeyboardEvent('keypress', { key: "Enter" });

const getKeyboardEvent = (letter) => {
    return new KeyboardEvent('keypress', { key: letter })
}

const getTextArea = () => {
    // const ta = document.getElementsByTagName("textarea")
    const dta = document.querySelectorAll("[class*=textArea]")
    if (dta.length === 0) {
        return undefined
    }
    const de = dta[0].querySelectorAll("[role=textbox]")
    if (de.length === 0) {
        return undefined
    }
    return de[0]
}

const writeText = (letter) => {
    const ta = getTextArea()
    if (ta) {
        ta.dispatchEvent(getKeyboardEvent(letter))
    }
}

const typeEnter = () => {
    const ta = getTextArea()
    if (ta) {
        ta.dispatchEvent(ke);
    }
}

const getRandomTimingKey = () => {
    const val = (Math.random() - 0.5) * randomInterval
    return baseTypeSpeed + val
}

const typeText = (text) => {

    var lessTyping
    if (text && text !== "") {
        writeText(text[0])
        lessTyping = typeText.bind(this, text.substring(1))
    } else {
        lessTyping = typeEnter
    }
    setTimeout(lessTyping, getRandomTimingKey())
}