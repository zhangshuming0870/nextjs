'use client';

import { useState } from 'react';
import TimePlan from "../components/work/TimePlan";
import WhiteVoice from "../components/work/WhiteVoice";
import TomatoTimer from "../components/work/tomatoTimer";

const Work = () => {

    return (
        <div className="work-page">
            <div className="work-main-content">
                <WhiteVoice />
                <div className='work-main-right'>
                    <TomatoTimer />
                </div>
            </div>
            <TimePlan />
        </div>
    );
};

export default Work; 