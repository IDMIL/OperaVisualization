import {ScoreTime, TimeManager, UpdateSource} from "./TimeManager";
import {text} from "./data/text";
import {globals} from "./globals";
import {recordingTimestamps} from "./data/recording_timestamps";
import {SectionManager, SectionRect} from "./SectionManager";

declare global {
    interface Window { onYouTubeIframeAPIReady: () => void; YT: any; }
}

export class VideoPlayerManager extends SectionManager {
    timeManager: TimeManager;

    private videos: Array<{ id: string, name: string }> = [
        { id: "jVmWimEX1gw", name: "Alban Berg – Wozzeck" },
        { id: "rHFFPyU41_0", name: "Wozzeck (1970 film)" },
        { id: "ALrEeDWSBXQ", name: "Sung in English"}
    ];

    constructor(tm : TimeManager, rect: SectionRect) {
        super("video-player-section", rect);
        this.timeManager = tm;

        const videoPlayer = this.element;
        if (videoPlayer) {
            const headerRow = document.createElement("div");
            headerRow.id = "video-player-header";

            const header = document.createElement("h2");
            header.innerText = text.VIDEO_PLAYER[globals.language];
            headerRow.appendChild(header);

                const videoSelect = document.createElement("select");
            videoSelect.id = "video-select";
            videoSelect.className = "video-select";
            this.videos.forEach((video) => {
                const option = document.createElement("option");
                option.value = video.id;
                option.innerText = video.name;
                videoSelect.appendChild(option);
            });
            videoSelect.addEventListener("change", () => {
                this.selectedVideoId = videoSelect.value;
                const scoreTime = this.timeManager.scoreTime;
                const seconds = recordingTimestamps[this.selectedVideoId]?.[scoreTime.act]?.[scoreTime.bar] ?? 0;
                if (this.player?.getPlayerState?.() !== 1) {
                    this.pendingPause = true;
                }
                this.player?.loadVideoById?.(videoSelect.value, seconds);
            });
            headerRow.appendChild(videoSelect);

            videoPlayer.appendChild(headerRow);

            const playerDiv = document.createElement("div");
            playerDiv.id = "yt-player";
            videoPlayer.appendChild(playerDiv);

            this.initResizeHandles();
        }

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            this.player = new window.YT.Player("yt-player", {
                videoId: this.videos[0].id,
                playerVars: { playsinline: 1 },
                events: {
                    onStateChange: (event: any) => this.onPlayerStateChange(event),
                },
            });
        };
        setInterval(() => this.navigateToCurrentTime(), 100)
    }

    private pendingPause: boolean = false;
    private pendingSeekSeconds: number | null = null;
    private selectedVideoId: string = this.videos[0].id;

    onPlayerStateChange(event: any) {
        if (event.data === 1 && this.pendingPause) {
            this.pendingPause = false;
            if (this.pendingSeekSeconds !== null) {
                this.player.seekTo(this.pendingSeekSeconds, true);
                this.pendingSeekSeconds = null;
            }
            this.player.pauseVideo?.();
        }
    }

    navigateToCurrentTime() {
        if (this.player?.getPlayerState?.() === 1) {
            const time : number | null =  this.player?.getCurrentTime() ?? null;
            let gotoAct = 1;
            let gotoBar = 1;
            const timestamps = recordingTimestamps[this.selectedVideoId];
            if (time !== null && timestamps) {
                for (const act in timestamps) {
                    for (const bar in timestamps[act]) {
                        if (timestamps[act][bar] > time) {
                            this.timeManager.goToTime(gotoAct, gotoBar, "video-playhead");
                            return;
                        }
                        gotoAct = Number(act);
                        gotoBar = Number(bar);
                    }
                }
            }
            this.timeManager.goToTime(gotoAct, gotoBar, "video-playhead");
        }
    }

    seekTo(seconds: number) {
        if (!this.player) return;
        const state = this.player.getPlayerState?.();
        if (state === 1 || state === 2) {
            this.player.seekTo(seconds, true);
        } else {
            // Video is unstarted — play first so a frame is decoded, then pause.
            this.pendingPause = true;
            this.pendingSeekSeconds = seconds;
            this.player.playVideo?.();
        }
    }

    // Seeking a closed panel's player is pointless (and, since seekTo has to
    // briefly play an unstarted video to decode a frame, audible) — so while
    // hidden the player just stays where it was, and onVisibilityChanged
    // catches it up to the score whenever the panel is reopened.
    async timeUpdated(scoreTime: ScoreTime, updateSource: UpdateSource) {
        if (updateSource !== "video-playhead" && this.isVisible()) {
            this.seekToScoreTime(scoreTime);
        }
    }

    protected onVisibilityChanged(visible: boolean) {
        if (visible) {
            this.seekToScoreTime(this.timeManager.scoreTime);
        } else {
            this.player?.pauseVideo?.();
        }
    }

    private seekToScoreTime(scoreTime: ScoreTime) {
        const seconds = recordingTimestamps[this.selectedVideoId]?.[scoreTime.act]?.[scoreTime.bar];
        if (seconds !== undefined) {
            this.seekTo(seconds);
        }
    }
    private player: any = null;
}