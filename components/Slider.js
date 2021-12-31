import {useState, useEffect} from 'react'

const Slider = ({setVolumeForSong}) => {
    const [volume, setVolume] = useState(50)

    return(
        <>
        <input type="range" min={0} max={100} value={volume} onChange={(e) => {
            e.preventDefault()
            setVolumeForSong(+e.target.value / 100)
            setVolume(e.target.value)
            }} className="slider"></input>
            {volume}
        </>
    )
    
}

export default Slider