import { InternalRequest, RequestData, RequestMethod, REST } from "@discordjs/rest"
import { Permissions } from "discord-api-types/globals"
import { APIGuildChannel, APIPartialChannel, APIUser, PermissionFlagsBits, RESTGetAPICurrentUserGuildsResult, Routes } from "discord-api-types/v10"
import { stringify } from "querystring"

import yargs, { ArgumentsCamelCase } from "yargs"
import { hideBin } from "yargs/helpers"

import { token, client_id, client_secret } from "../config.json"


const rest = new REST({ version: "10" })
const opts: RequestData = {}
let tokenData: { access_token: string, token_type: string, expires_in: number, scope: string }
const tokenAuthGrantScope = stringify({ "grant_type": "client_credentials", "scope": "identify connections guilds" })

let me: APIUser
let guilds: RESTGetAPICurrentUserGuildsResult
const channels: { [key: string]: APIPartialChannel } = {}

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

const getTokenUser = async () => {
    const authEnc = Buffer.from(`${client_id}:${client_secret}`).toString("base64")
    const tokenOpts = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authEnc}`
        },
        body: tokenAuthGrantScope,
        auth: false,
        passThroughBody: true
    }
    const resp = await rest.post(Routes.oauth2TokenExchange(), tokenOpts)
    if (resp) {
        tokenData = resp as typeof tokenData
    }
    console.log(`Token info : ${tokenData.scope} expire ${tokenData.expires_in}`)
    return tokenData.access_token
}

const getTokenBot = async () => {

    const tokenOpts = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: stringify({ client_id, scope: "bot", permission: "" + (PermissionFlagsBits.SendMessages) })
    }
    const resp = await rest.post(Routes.oauth2Authorization(), tokenOpts)
    return resp
}

const setupCredentials = async () => {
    if (client_id && client_secret) {
        //using https://discord.com/developers/docs/topics/oauth2#bot-vs-user-accounts

        const accessToken = await getTokenUser()
        rest.setToken(accessToken)
        opts.authPrefix = "Bearer"
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


const queryApi = async <T>(method: RequestMethod, fullRoute: `/${string}`, options?: RequestData) => {
    const iRequest: InternalRequest = { ...opts, ...options, ...{ method: method, fullRoute } }
    console.log(`querying ${iRequest.method} ${iRequest.fullRoute}`)
    return rest.request(iRequest) as Promise<T>
}

const refreshUserInfo = async (verbose?: boolean) => {
    me = await queryApi<APIUser>(RequestMethod.Get, Routes.user())
    if (verbose || !me) {
        console.log(`username:${me.username}, locale:${me.locale}, mfa:${me.mfa_enabled}`)
    }

    guilds = await queryApi<RESTGetAPICurrentUserGuildsResult>(RequestMethod.Get, Routes.userGuilds())
    if (verbose || !guilds || Object.keys(channels).length === 0) {
        for (const guild of guilds) {
            if (verbose || !guild) {
                console.log(`guild:${guild.name},${guild.id}`)
            }
            // const channelsApi = await queryApi<APIPartialChannel[]>(RequestMethod.Get, Routes.guildChannels(guild.id))
            // for (const channel of channelsApi) {
            //     if (!channels[guild.id]) {
            //         channels[guild.id] = channel
            //     }
            // }
        }
    }
}

const run = async (args: ArgumentsCamelCase<{ f: boolean }>) => {

    if (!isRunnable(args.f)) {
        return
    }

    await setupCredentials()
    await refreshUserInfo(true)

    const channelTest = "875271326913417278"
    await queryApi(RequestMethod.Post, Routes.channelMessages(channelTest), { body: JSON.stringify({ content: "Coucou" }) })
    // await queryApi(RequestMethod.Post,Routes.channelMessages("875047156719968256"))


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