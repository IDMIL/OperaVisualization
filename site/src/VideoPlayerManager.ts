import {ScoreTime, TimeManager, TimeManagerListener, UpdateSource} from "./TimeManager";
import {text} from "./data/text";
import {globals} from "./globals";
import {recordingTimestamps} from "./data/recording_timestamps";

declare global {
    interface Window { onYouTubeIframeAPIReady: () => void; YT: any; }
}

export class VideoPlayerManager extends TimeManagerListener {
    timeManager: TimeManager;

    constructor(tm : TimeManager) {
        super();
        this.timeManager = tm;

        const videoPlayer = document.getElementById("video-player-section");
        if (videoPlayer) {
            const header = document.createElement("h2");
            header.innerText = text[globals.language].VIDEO_PLAYER;
            videoPlayer.appendChild(header);

            const playerDiv = document.createElement("div");
            playerDiv.id = "yt-player";
            videoPlayer.appendChild(playerDiv);
        }

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            this.player = new window.YT.Player("yt-player", {
                videoId: "jVmWimEX1gw",
                playerVars: { playsinline: 1 },
            });
        };
        setInterval(() => this.navigateToCurrentTime(), 100)
    }

    navigateToCurrentTime() {
        const time : number | null =  this.player?.getCurrentTime() ?? null;
        let gotoAct = 1;
        let gotoBar = 1;
        if (time !== null) {
            for (const act in recordingTimestamps) {
                for (const bar in recordingTimestamps[act]) {
                    if (recordingTimestamps[act][bar] > time) {
                        this.timeManager.goToTime(gotoAct, gotoBar, 1, "video-playhead");
                        return;
                    }
                    gotoAct = Number(act);
                    gotoBar = Number(bar);
                }
            }
        }
        this.timeManager.goToTime(gotoAct, gotoBar, 1, "video-playhead");
    }

    seekTo(seconds: number) {
        this.player?.seekTo(seconds, true);
    }

    async timeUpdated(scoreTime: ScoreTime, updateSource: UpdateSource) {
        if (updateSource !== "video-playhead") {
            this.seekTo(recordingTimestamps[scoreTime.act]?.[scoreTime.bar]);
        }
    }
    private player: any = null;
}