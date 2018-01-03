import * as path from "path";
import * as url from "url";

import * as Commander from "commander";
import { app, BrowserWindow, ipcMain, screen } from "electron";
import * as inversify from "inversify";
import "reflect-metadata";
import * as Twitter from "twitter";

import ipcMessage from "../ipcMessage";
import ITwitterClient from "./ITwitterClient";
import StubTwitterClient from "./stub/stubTwitterClient";
import TYPES from "./types";

Commander
    .option("--use-stub")
    .parse(process.argv);

let window: BrowserWindow | null;

function createWindow() {
    window = new BrowserWindow({ width: 800, height: 600 });

    const loadUrl = url.format({
        pathname: path.join(__dirname, "../../static/index.html"),
        protocol: "file:",
        slashes: true
    });

    console.log(loadUrl);

    window.loadURL(loadUrl);

    window.webContents.openDevTools();

    window.on("closed", () => {
       window = null;
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (window === null) {
        createWindow();
    }
});

ipcMain.on(ipcMessage.analyze, (event, screenName) => {
    event.sender.send(ipcMessage.analyzeStart);

    setTimeout(() => {
        event.sender.send(ipcMessage.analyzeProgress, `Analyzing (1/3) ...`);
    }, 1000);

    setTimeout(() => {
        event.sender.send(ipcMessage.analyzeProgress, `Analyzing (2/3) ...`);
    }, 2000);

    setTimeout(() => {
        event.sender.send(ipcMessage.analyzeProgress, `Analyzing (3/3) ...`);
    }, 3000);

    setTimeout(() => {
        event.sender.send(ipcMessage.analyzeProgress, `Analyzing finish!!`);
    }, 4000);

    setTimeout(() => {
        /* tslint:disable:object-literal-sort-keys */
        const dummyData = {
            screenName: "hajimepg",
            profileImageUrl: "./hajimepg.jpg",
            twitterHomeUrl: "https://twitter.com/hajimepg",
        };

        const result = {
            followEachOther: [dummyData],
            followedOnly: [dummyData, dummyData],
            followOnly: [dummyData, dummyData, dummyData]
        };
        /* tslint:enable:object-literal-sort-keys */

        event.sender.send(ipcMessage.analyzeFinish, result);
    }, 4500);
});

const container = new inversify.Container();

if (Commander.useStub) {
    container.bind<ITwitterClient>(TYPES.TwitterClient).to(StubTwitterClient);
}
else {
    container.bind<ITwitterClient>(TYPES.TwitterClient).toConstantValue(new Twitter({
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    }));
}

const twitterClient = container.get<ITwitterClient>(TYPES.TwitterClient);
