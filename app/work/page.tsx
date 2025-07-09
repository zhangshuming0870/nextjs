'use client';

import { useState } from 'react';
import TimePlan from "@/app/components/work/TimePlan";
import WhiteVoice from "@/app/components/work/WhiteVoice";
import TomatoTimer from "@/app/components/work/tomatoTimer";

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