'use client';

import { useState, useEffect } from 'react';

/**
 * 时间计划组件
 * 根据时间段跨度动态分配每个时间块的宽度占比
 */
const TimePlan = () => {

    // 当前时间状态
    const [currentTime, setCurrentTime] = useState(new Date());

    // 时间计划数据 - 添加图标
    const timePlan = [
        { time: '06:30 - 07:30', content: '弹钢琴', icon: 'bi-music-note' },
        { time: '07:30 - 08:30', content: '学英语', icon: 'bi-translate' },
        { time: '08:30 - 12:00', content: '学习办公', icon: 'bi-laptop' },
        { time: '12:00 - 13:30', content: '午餐、午休', icon: 'bi-cup-hot' },
        { time: '13:30 - 17:00', content: '创意办公', icon: 'bi-lightbulb' },
        { time: '17:00 - 18:00', content: '钢琴', icon: 'bi-music-note-beamed' },
        { time: '18:00 - 19:00', content: '休息', icon: 'bi-cup-straw' },
        { time: '19:00 - 20:30', content: '骑自行车', icon: 'bi-bicycle' },
        { time: '20:30 - 21:30', content: '英语', icon: 'bi-book' },
        { time: '21:30 - 22:30', content: '休息', icon: 'bi-moon' }
    ];

    /**
     * 计算时间段的持续时间（分钟）
     */
    const calculateDuration = (timeStr: string) => {
        const [start, end] = timeStr.split(' - ');
        const startTime = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);
        return (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    };

    /**
     * 获取当前时间段索引
     */
    const getCurrentTimeIndex = () => {
        const now = currentTime;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let i = 0; i < timePlan.length; i++) {
            const [start, end] = timePlan[i].time.split(' - ');
            const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
            const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                return i;
            }
        }
        return -1;
    };

    // 每10秒更新当前时间
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const currentIndex = getCurrentTimeIndex();
    const currentTimeStr = currentTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className='time-plan'>
            {/* 时间轴 */}
            <ul style={{ display: 'flex', width: '100%' }}>
                {timePlan.map((item, index) => {
                    const duration = calculateDuration(item.time);

                    return (
                        <li
                            key={index}
                            style={{
                                flex: `${duration} 0 0`,
                            }}
                        >
                            <p>{item.time}</p>
                            <p className='content'>
                                <i className={`bi ${item.icon}`} style={{ marginRight: '4px' }}></i>
                                {item.content}
                            </p>
                            {
                                index === currentIndex &&
                                (<div className='active' />)
                            }
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default TimePlan; 