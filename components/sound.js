import dynamic from 'next/dynamic'
import {useEffect} from 'react'
//import Slider from './Slider'

const Sketch = dynamic(
 () => import('react-p5').then((mod) => {
  require('p5/lib/addons/p5.sound')   
  return mod.default
}),
 {ssr: false}
)

const Slider = dynamic(() => import('./Slider'), {ssr: false})

class Particle {
    constructor(p5, deleteParticle){
        this.x = p5.width / 2 + p5.random(-p5.width, p5.width)
        this.y = p5.height / 2 + p5.random(-p5.height, p5.height)
        this.r = p5.random(2,8)
        this.xSpeed = p5.random(-0.4,0.4);
        this.ySpeed = p5.random(-0.15,0.15);

        this.p5 = p5
        this.deleteParticle = deleteParticle
    }

    createParticle(){
        this.p5.noStroke()
        
        this.p5.circle(this.x, this.y, this.r)
    }

    
    moveParticle(index, amp) {
        this.p5.fill(`rgba(200,200,200,${0.5 + amp * 10})`)
        if(amp > 0.3){
            this.p5.fill(`rgba(255,100,100,${0.5 + amp * 10})`) 
        }

        this.x+=this.xSpeed > 0 ? this.xSpeed + amp * 27 : this.xSpeed - amp * 27;
        this.y+=this.ySpeed > 0 ? this.ySpeed + amp * 27 : this.ySpeed - amp * 27;

        // Recycle Particle
        if(this.x < 0 || this.x > this.p5.width || this.y < 0 || this.y > this.p5.height){
            this.deleteParticle(index)
        }
    }
    
}

let x = 50
let y = 50
let rotate=0
let song
let amp
let fft
let ogbg
let bg
let particles = []


const Sound = (props) => {

    // useEffect(() => {
    //     if(song){
    //         //song.setVolume(volume / 100)
    //     }
    //     console.log(volume)
        
    // }, [volume])


    const setVolumeForSong = (volume) => {
        song.setVolume(volume)
    }
    
    const preload = (p5) => {
        song = p5.loadSound(`/songs/${props.song}.mp3`)
        song.setVolume(0.5)
        bg = p5.loadImage('/bg.jpg')


    }

    const setup = (p5, canvasParentRef) => {
        const deleteParticle = (index) => {
            particles.splice(index, 1)
            particles.push(new Particle(p5, deleteParticle))
        }

		p5.createCanvas(window.innerWidth, window.innerHeight / 2, p5.WEBGL).parent(canvasParentRef);
        
        // BG Resize
        
        

        // Set up amp
        amp = new window.p5.Amplitude(0.9)
        amp.setInput(song)
        
        // Set up FFT
        fft = new window.p5.FFT(0.9, 512)
        fft.setInput(song)

        
        for(let i = 0; i < p5.width/7; i++){
            particles.push(new Particle(p5, deleteParticle))
        }


        document.querySelector('canvas').addEventListener('mousedown', () => {
            song.isPlaying() ? song.pause() : song.play()
        })

        p5.text('Play audio')

	};

	const draw = (p5) => {
        p5.translate(-(p5.width / 2), -(p5.height / 2))

        if(p5.width > 600){
            bg.resize(p5.width, 0)
        }else{
            bg.resize(0, p5.height)
        }
        
        p5.image(bg, 0, 0)


        
        let level = song.isPlaying() ? amp.getLevel() : 0
        let c1 = p5.color(`rgba(0,0,0,0.5)`)
        let c2 = p5.color(`rgba(63, 191, 191, 1)`)
        
        
        
        for(let y=0; y<p5.height / 2; y++){
            let n = p5.map(y * 2, 0, p5.height, 0, (level * 5) - 0.02);
            let newc = p5.lerpColor(c1,c2,n);
            p5.stroke(newc);
            p5.line(2,y * 2, p5.width, y * 2);
        }

        p5.translate(0,0,1)
        
        
        
        particles.forEach((p, idx) => {
            particles[idx].createParticle()
            particles[idx].moveParticle(idx, level)
        })

        
        
        p5.translate(0,0,1)
        let spectrum = fft.analyze()
        p5.noStroke()
        p5.fill(0,0,0)
        spectrum.forEach((spec, idx) => {
            let x = p5.map(idx, 0, spectrum.length, 0, p5.width)
            let h = -p5.height + p5.map(spectrum[idx], 0, 300, p5.height, 0);
            p5.rect(x, p5.height, p5.width / spectrum.length + 2, h )
        })

		//p5.ellipse(x, y, 70, 70);
        //console.log(p5.width)
		//x > p5.width - 70 / 2 ? x = 50 : x++;

        let bass_power = fft.getEnergy('lowMid')

        let geometry_power = 20
        let geomerty_size = 45
        let geometry_color = 'rgba(255,255,255,0)'
        if(bass_power > 200){
            geometry_power = 4
            geomerty_size = 68
            geometry_color = 'rgba(255,40,60,1)'
        }else if(bass_power > 170 && bass_power < 200){
            geometry_power = 8
            geomerty_size = 58
            geometry_color = 'rgba(150,200,255,0.9)'
        }else if(bass_power > 120 && bass_power < 170){
            geometry_power = 11
            geomerty_size = 50
            geometry_color = 'rgba(255,255,255,0.5)'
        }
        //planets
        p5.translate(p5.width / 1.4, p5.height / 2.5, 200)
        p5.rotateY(p5.millis() / 8000)
        p5.fill('rgba(50,50,150,0.2)')
        p5.stroke(geometry_color);
        p5.sphere(Math.floor(geomerty_size + (level * 100)), geometry_power, geometry_power)

        
        //planets
        p5.rotateY(p5.millis() / 1000)
        p5.translate(-(p5.width / 15), -8)
        p5.fill('rgba(50,50,150,0.2)')
        p5.stroke(geometry_color);
        p5.sphere(Math.floor((geomerty_size / 4) + (level * 100)), geometry_power, geometry_power)
	};

    const windowResized = (p5) => {
        p5.resizeCanvas(window.innerWidth, window.innerHeight / 2)        
    }

// Will only render on client-side
	return (<>
    <div style={{position: 'relative', minHeight: '50vh', display: 'block'}}>
    <Sketch windowResized={windowResized} preload={preload} setup={setup} draw={draw} />

    </div>
    <div className="slider-container">
        <Slider setVolumeForSong={setVolumeForSong} />
    </div>
    
    </>)
};

export default Sound


