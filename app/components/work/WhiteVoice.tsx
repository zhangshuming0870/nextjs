import { useRef, useState } from "react";

const audioList = [
    {
        name: "机场大厅人声",
        file: "/work/whiteVoice/404961__kyles__airport-zurich-terminal-busy-large-waiting-crowd-of-passengers1-pa-voice-echo-and-irate-passenger-end.flac",
    },
    {
        name: "太空氛围",
        file: "/work/whiteVoice/815021__universfield__space-30s.mp3",
    },
    {
        name: "森林环境（波兰）",
        file: "/work/whiteVoice/814943__audiopapkin__forest-atmosphere-013-localization-poland.wav",
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
        // 由于设置了 loop 属性，音频会自动循环播放，不需要重置状态
        // 只有在手动停止时才重置状态
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
                                loop
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WhiteVoice; 