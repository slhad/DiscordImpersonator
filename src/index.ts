import { RequestData, REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"

import yargs, { ArgumentsCamelCase } from "yargs"
import { hideBin } from "yargs/helpers"

import { token, client_id, client_secret } from "../config.json"


const rest = new REST({ version: "10" })
const opts: RequestData = {}
let tokenData: { access_token: string, token_type: string, expire_in: number, scope: string }
const tokenAuthGrantScope = encodeURIComponent("grant_type=client_credentials&scope=identify connections")

const isRunnable = (force: boolean) => {
    switch (true) {
        case (client_id !== "" && client_secret !== ""):
            {
                return true
            }
        case (token !== "true" && force): {
            return true
        }
        default: {
            console.log("No credential detected, exiting")
            return false
        }
    }
}

const getToken = async () => {
    const authEnc = Buffer.from(`${client_id}:${client_secret}`).toString("base64")
    const resp = await rest.post(Routes.oauth2TokenExchange(), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authEnc}`
        },
        body: tokenAuthGrantScope,
        auth: false,
        passThroughBody: true
    })
    if (resp) {
        tokenData = resp as typeof tokenData
    }
    return tokenData.access_token
}

const setupCredentials = async () => {
    if (client_id && client_secret) {
        //using https://discord.com/developers/docs/topics/oauth2#bot-vs-user-accounts

        const accessToken = await getToken()
        rest.setToken(accessToken)
    } else if (token) {
        //using https://discord.com/developers/docs/topics/oauth2#client-credentials-grant

        console.log("You can get your discord account \"terminated\" by automating normal user accounts (generally called \"self-bots\") outside of the OAuth2/bot API" +
            "See https://discord.com/developers/docs/topics/oauth2#bot-vs-user-accounts")
        opts.auth = false
        opts.headers = {
            "authorization": token
        }
    }
}



const run = async (args: ArgumentsCamelCase<{ f: boolean }>) => {

    if (!isRunnable(args.f)) {
        return
    }

    await setupCredentials()

    const channels = await rest.get(Routes.channelMessages("875047156719968259"), opts)
    console.log(JSON.stringify(channels))
}

const argv = yargs(hideBin(process.argv))
    .option("f", {
        alias: "force",
        boolean: true,
        default: false
    })
    .parseSync()

run(argv).catch(({ message, stack }) => {
    console.log(`${message} : ${stack}`)
})