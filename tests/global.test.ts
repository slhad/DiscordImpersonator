import { it, describe, expect } from "@jest/globals"

describe("Global tests", () => {
    it("Works", () => {
        expect("ok").toStrictEqual("ok")
    })
})