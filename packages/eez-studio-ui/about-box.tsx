import React, { ReactNode } from "react";
import { observable, computed, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";

import { formatDateTimeLong, compareVersions } from "eez-studio-shared/util";
import { showDialog, Dialog } from "eez-studio-ui/dialog";
import { Loader } from "eez-studio-ui/loader";

import { isArray } from "eez-studio-shared/util";
import { settingsController } from "home/settings";

const STUDIO_RELEASES_URL =
    "https://api.github.com/repos/eez-open/studio/releases";
const STUDIO_SPECIFIC_RELEASE_URL =
    "https://github.com/eez-open/studio/releases/tag/v";
const STUDIO_HOME_PAGE_URL =
    "https://www.envox.hr/eez/studio/studio-introduction.html";
const STUDIO_GITHUB_PAGE_URL = "https://github.com/eez-open/studio";

const GET_LATEST_VERSION_MIN_DURATION = 1000;

function openLink(url: string) {
    const { shell } = require("electron");
    shell.openExternal(url);
}

async function getLatestVersion() {
    const startTime = new Date().getTime();
    return new Promise<string>((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.responseType = "json";
        req.open("GET", STUDIO_RELEASES_URL);

        req.addEventListener("load", async () => {
            if (isArray(req.response)) {
                let latestReleaseVersion: string | undefined = undefined;
                for (const release of req.response) {
                    if (typeof release.tag_name == "string") {
                        if (
                            release.tag_name !== "nightly-build" &&
                            (!latestReleaseVersion ||
                                compareVersions(
                                    release.tag_name,
                                    latestReleaseVersion
                                ) > 1)
                        ) {
                            latestReleaseVersion = release.tag_name;
                        }
                    }
                }

                if (latestReleaseVersion) {
                    const endTime = new Date().getTime();
                    const duration = endTime - startTime;
                    if (duration >= GET_LATEST_VERSION_MIN_DURATION) {
                        resolve(latestReleaseVersion);
                    } else {
                        setTimeout(
                            () => resolve(latestReleaseVersion!),
                            1000 - duration
                        );
                    }
                } else {
                    reject();
                }
            }
        });

        req.addEventListener("error", error => {
            console.error(error);
            reject();
        });

        req.send();
    });
}

const AboutBox = observer(
    class AboutBox extends React.Component {
        packageJSON: {
            version: string;
        };

        checkingForUpdates: boolean = false;
        latestVersion: string | undefined = undefined;

        constructor(props: any) {
            super(props);

            makeObservable(this, {
                checkingForUpdates: observable,
                latestVersion: observable,
                versionInfo: computed
            });

            this.packageJSON = require("../../package.json");
        }

        checkForUpdates = async (event: React.MouseEvent) => {
            event.preventDefault();

            if (this.checkingForUpdates) {
                return;
            }

            runInAction(() => {
                this.checkingForUpdates = true;
            });

            let latestVersion = await getLatestVersion();
            if (
                latestVersion.startsWith("v") ||
                latestVersion.startsWith("V")
            ) {
                latestVersion = latestVersion.slice(1);
            }

            runInAction(() => {
                this.checkingForUpdates = false;
                this.latestVersion = latestVersion;
            });
        };

        get versionInfo() {
            let versionInfo: ReactNode;

            if (this.checkingForUpdates) {
                versionInfo = (
                    <>
                        <Loader size={20} />
                        <span>正在检查更新...</span>
                    </>
                );
            } else {
                if (this.latestVersion) {
                    if (
                        compareVersions(
                            this.latestVersion,
                            this.packageJSON.version
                        ) > 0
                    ) {
                        versionInfo = (
                            <>
                                存在新版本 {this.latestVersion}（
                                <a
                                    href="#"
                                    onClick={event => {
                                        event.preventDefault();
                                        openLink(
                                            STUDIO_SPECIFIC_RELEASE_URL +
                                                this.latestVersion
                                        );
                                    }}
                                >
                                    下载
                                </a>
                                ）
                            </>
                        );
                    } else {
                        versionInfo = "您已是最新版本";
                    }
                } else {
                    versionInfo = "";
                }
            }

            return <div className="EezStudio_VersionInfo">{versionInfo}</div>;
        }

        render() {
            var fs = require("fs");
            var stats = fs.statSync(process.execPath);
            var mtime = new Date(stats.mtime);
            var buildDate = mtime.toString();

            return (
                <Dialog cancelButtonText="关闭">
                    <div className="EezStudio_AboutBox">
                        <div className="EezStudio_Logo">
                            <img
                                src={
                                    settingsController.isDarkTheme
                                        ? "../eez-studio-ui/_images/eez_studio_logo_with_title_dark.png"
                                        : "../eez-studio-ui/_images/eez_studio_logo_with_title.png"
                                }
                            ></img>
                        </div>

                        <div className="EezStudio_Version">
                            版本 {this.packageJSON.version}（
                            <a
                                href="#"
                                onClick={event => {
                                    event.preventDefault();
                                    openLink(
                                        STUDIO_SPECIFIC_RELEASE_URL +
                                            this.packageJSON.version
                                    );
                                }}
                            >
                                发布说明
                            </a>
                            ）
                        </div>

                        <div className="EezStudio_BuildDate">
                            构建日期 {formatDateTimeLong(new Date(buildDate))}
                        </div>

                        {this.versionInfo}

                        <button
                            className="EezStudio_CheckForUpdate btn btn-sm btn-secondary"
                            onClick={this.checkForUpdates}
                            disabled={this.checkingForUpdates}
                        >
                            检查更新
                        </button>

                        <div className="EezStudio_Links">
                            <a
                                href="#"
                                onClick={event => {
                                    event.preventDefault();
                                    openLink(STUDIO_HOME_PAGE_URL);
                                }}
                            >
                                主页
                            </a>
                            {" | "}
                            <a
                                href="#"
                                onClick={event => {
                                    event.preventDefault();
                                    openLink(STUDIO_GITHUB_PAGE_URL);
                                }}
                            >
                                GitHub
                            </a>
                        </div>
                    </div>
                </Dialog>
            );
        }
    }
);

export function showAboutBox() {
    showDialog(<AboutBox />);
}
