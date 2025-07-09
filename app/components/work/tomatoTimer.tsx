'use client';

import { useState, useEffect, useCallback } from 'react';

interface TomatoTimerProps {
    onClose?: () => void;
}

const TomatoTimer = ({ onClose }: TomatoTimerProps) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟，以秒为单位
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [cycles, setCycles] = useState(0);

    const WORK_TIME = 25 * 60; // 25分钟
    const BREAK_TIME = 5 * 60; // 5分钟

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pauseTimer = useCallback(() => {
        setIsRunning(false);
    }, []);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(WORK_TIME);
        setCycles(0);
    }, []);

    const skipTimer = useCallback(() => {
        if (isBreak) {
            // 跳过休息时间，开始工作时间
            setIsBreak(false);
            setTimeLeft(WORK_TIME);
        } else {
            // 跳过工作时间，开始休息时间
            setIsBreak(true);
            setTimeLeft(BREAK_TIME);
            setCycles(prev => prev + 1);
        }
    }, [isBreak]);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // 时间结束
                        if (isBreak) {
                            // 休息结束，开始工作
                            setIsBreak(false);
                            return WORK_TIME;
                        } else {
                            // 工作结束，开始休息
                            setIsBreak(true);
                            setCycles(prev => prev + 1);
                            return BREAK_TIME;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRunning, timeLeft, isBreak]);

    const getProgressPercentage = () => {
        const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
        const elapsed = totalTime - timeLeft;
        return (elapsed / totalTime) * 100;
    };

    return (
        <div className="tomato-timer-page">
            <div className="tomato-timer-content">
                <div className="timer-header">
                    <div className="header-title">
                        <h2>番茄工作法</h2>
                    </div>
                </div>

                <div className="timer-container">
                    <div className="timer-display">
                        <div className="timer-time">{formatTime(timeLeft)}</div>
                        <div className="timer-status">
                            {isBreak ? '休息时间' : '工作时间'}
                        </div>
                        <div className="timer-cycles">
                            完成周期: {cycles}
                        </div>
                    </div>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                    </div>

                    <div className="timer-controls">
                        {!isRunning ? (

                            <i className="bi bi-play-fill"
                                onClick={startTimer}></i>
                        ) : (
                            <i className="bi bi-pause-fill" onClick={pauseTimer}></i>

                        )}


                        <i className="bi bi-skip-forward-fill" onClick={skipTimer}></i>

                        <i className="bi bi-arrow-clockwise"
                            onClick={resetTimer}></i>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TomatoTimer; 