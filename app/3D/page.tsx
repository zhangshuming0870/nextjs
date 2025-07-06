"use client"


export default function ThreeD() {
    return <>
        <div className="three-d" onClick={handleClick}>
            3D
        </div>
    </>

}
function handleClick() {
    console.log('clickDiv');
}