import { useRef, useState } from "react";

const audioList = [
    {
        name: "机场大厅人声",
        file: "/work/whiteVoice/404961__kyles__airport-zurich-terminal-busy-large-waiting-crowd-of-passengers1-pa-voice-echo-and-irate-passenger-end.flac",
    },
    {
        name: "桥上汽车行驶",
        file: "/work/whiteVoice/808209__the_25_times__cars-driving-over-bridge.mp3",
    },
    {
        name: "太空氛围",
        file: "/work/whiteVoice/815021__universfield__space-30s.mp3",
    },
    {
        name: "吃薯片（沙沙声）",
        file: "/work/whiteVoice/365682__mr_alden__eating-potato-chips.wav",
    },
    {
        name: "中国收音机",
        file: "/work/whiteVoice/251534__kwahmah_02__radiochina1.wav",
    },
    {
        name: "雷暴雨（意大利）",
        file: "/work/whiteVoice/813233__nicola_ariutti__thunderstorm-pt.flac",
    },
    {
        name: "度假村清晨氛围",
        file: "/work/whiteVoice/815372__kevp888__004a_091112_2234_sp_calm_resort_atmosphere_morning.mp3",
    },
    {
        name: "森林环境（波兰）",
        file: "/work/whiteVoice/814943__audiopapkin__forest-atmosphere-013-localization-poland.wav",
    },
    {
        name: "雷暴雨（阳台/小区）",
        file: "/work/whiteVoice/815258__newlocknew__storm_thunderstormresidential-areabalconyheavy-rain.wav",
    },
];

const WhiteVoice = () => {
    const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);

    const handlePlay = (idx: number) => {
        // 先暂停其他音频
        audioRefs.current.forEach((audio, i) => {
            if (audio && i !== idx) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        // 播放当前音频
        audioRefs.current[idx]?.play();
        setPlayingIndex(idx);
    };

    const handlePause = (idx: number) => {
        audioRefs.current[idx]?.pause();
        setPlayingIndex(null);
    };

    const handleEnded = () => {
        setPlayingIndex(null);
    };

    return (
        <div className="white-voice-page">
            <div className="white-voice-content">
                <h2 style={{ marginBottom: '1rem' }}>
                    <i className="bi bi-music-note"></i> 白噪音
                </h2>
                <ul className="white-voice-list">
                    {audioList.map((audio, idx) => (
                        <li key={audio.file}>
                            <span>
                                <i className="bi bi-soundwave"></i> 
                            </span>
                            <span className="white-voice-list-name">
                                {audio.name}
                            </span>
                            <span className={`white-voice-list-btn ${playingIndex === idx ? 'active' : ''}`}>
                                {playingIndex === idx ? (
                                    <i onClick={() => handlePause(idx)} className="bi bi-pause-fill"></i>
                                ) : (
                                    <i onClick={() => handlePlay(idx)} className="bi bi-play-fill"></i>
                                )}
                            </span>

                            <audio
                                ref={el => {
                                    audioRefs.current[idx] = el;
                                }}
                                src={audio.file}
                                onEnded={handleEnded}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WhiteVoice; 