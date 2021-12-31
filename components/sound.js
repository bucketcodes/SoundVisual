import dynamic from "next/dynamic"
import { useEffect } from "react"
//import Slider from './Slider'

const Sketch = dynamic(
  () =>
    import("react-p5").then((mod) => {
      require("p5/lib/addons/p5.sound")
      return mod.default
    }),
  { ssr: false }
)

const Slider = dynamic(() => import("./Slider"), { ssr: false })

class Particle {
  /**
   * Particle Class
   * Functions:
   * createParticle - Creates the particle
   * moveParticle - handles the movement in relationship to the amp.
   *      Will delete the particle if it goes off screen.
   */
  constructor(p5, deleteParticle) {
    // Set up default particle configuration
    this.x = p5.width / 2 + p5.random(-p5.width, p5.width)
    this.y = p5.height / 2 + p5.random(-p5.height, p5.height)
    this.r = p5.random(2, 8)
    this.xSpeed = p5.random(-0.4, 0.4)
    this.ySpeed = p5.random(-0.15, 0.15)

    // Pass P5 to all particles
    this.p5 = p5

    // Pass particle delete function to all particles
    this.deleteParticle = deleteParticle
  }

  createParticle() {
    this.p5.noStroke()
    this.p5.circle(this.x, this.y, this.r)
  }

  moveParticle(index, amp) {
    // Handle particle color
    this.p5.fill(`rgba(200,200,200,${0.5 + amp * 10})`)
    if (amp > 0.3) {
      this.p5.fill(`rgba(255,100,100,${0.5 + amp * 10})`)
    }

    // Handle particle speed
    this.x += this.xSpeed > 0 ? this.xSpeed + amp * 27 : this.xSpeed - amp * 27
    this.y += this.ySpeed > 0 ? this.ySpeed + amp * 27 : this.ySpeed - amp * 27

    // Recycle Particle
    if (
      this.x < 0 ||
      this.x > this.p5.width ||
      this.y < 0 ||
      this.y > this.p5.height
    ) {
      this.deleteParticle(index)
    }
  }
}

// Starting global variables
let song // Song itself
let amp // Aplitude or volume analyzer
let fft // Full frequency analyzer
let bg // Background
let particles = [] // Array of all particles
let curVolume = 0.5 // Remember current volume for song-switching

const Sound = (props) => {
  const preload = (p5) => {
    // Preload items are handled before the sketch trys to render.
    song = p5.loadSound(`/songs/${props.song}.mp3`)
    song.setVolume(0.5)
    bg = p5.loadImage("/bg.jpg")
  }

  const setup = (p5, canvasParentRef) => {
    const deleteParticle = (index) => {
      // Function to delete a specific particle by index.
      // This function gets sent to the moveParticle function.
      particles.splice(index, 1)
      particles.push(new Particle(p5, deleteParticle))
    }

    // Initialize our canvas
    p5.createCanvas(window.innerWidth, window.innerHeight / 2, p5.WEBGL).parent(
      canvasParentRef
    )

    // BG Resize
    if (bg.height < p5.height) {
      bg.resize(0, p5.height)
    } else {
      bg.resize(p5.width, 0)
    }

    // Set up amp
    amp = new window.p5.Amplitude(0.9)
    amp.setInput(song)

    // Set up FFT
    fft = new window.p5.FFT(0.9, 256)
    fft.setInput(song)

    // Create Particles
    for (let i = 0; i < p5.width / 7; i++) {
      particles.push(new Particle(p5, deleteParticle))
    }

    // Jank handling of the play/pause button
    document.querySelector(".play-pause").addEventListener("mousedown", () => {
      if (song.isPlaying()) {
        song.pause()
        document.querySelector(".play-pause").classList.add("paused")
        document.querySelector(".play-pause").classList.remove("playing")
        document.querySelector(".play-pause").innerHTML = "Play"
      } else {
        song.play()
        document.querySelector(".play-pause").classList.add("playing")
        document.querySelector(".play-pause").classList.remove("paused")
        document.querySelector(".play-pause").innerHTML = "Pause"
      }
    })
  }

  const draw = (p5) => {
    if (!song.file.includes(props.song)) {
      // Checks if the current selected song is the song we're playing.
      // If it's not, we reset our song, analyzers, and volume.
      let curStatus = song.isPlaying()
      song.pause()
      song = p5.loadSound(`/songs/${props.song}.mp3`, () => {
        // Set up amp
        amp = new window.p5.Amplitude(0.9)
        amp.setInput(song)

        // Set up FFT
        fft = new window.p5.FFT(0.9, 256)
        fft.setInput(song)

        // Set volume back to what it was
        song.setVolume(curVolume)

        if (curStatus) {
          // If song was playing, autoplay
          song.play()
        }
      })
    }

    // Audio Variables
    let level = song.isPlaying() ? amp.getLevel() : 0
    let spectrum = fft.analyze()
    let bass_power = fft.getEnergy("lowMid")

    // Center us to top-left
    p5.translate(-(p5.width / 2), -(p5.height / 2))

    // Create the background image
    p5.image(bg, 0, 0, p5.width, p5.height)

    // Create a gradient overlay
    let c1 = p5.color(`rgba(0,0,0,0.5)`)
    let c2 = p5.color(`rgba(63, 191, 191, 1)`)
    for (let y = 0; y < p5.height / 2; y++) {
      let n = p5.map(y * 2, 0, p5.height, 0, level * 5 - 0.02)
      let newc = p5.lerpColor(c1, c2, n)
      p5.stroke(newc)
      p5.line(2, y * 2, p5.width, y * 2)
    }

    // Move forward in Z by 1
    p5.translate(0, 0, 1)

    // Handle particles
    particles.forEach((p, idx) => {
      particles[idx].createParticle()
      particles[idx].moveParticle(idx, level)
    })

    // Move forward in Z by 1
    p5.translate(0, 0, 1)

    // Spectrum Visualizer
    p5.noStroke()
    p5.fill(0, 0, 0)
    spectrum.forEach((spec, idx) => {
      let x = p5.map(idx, 0, spectrum.length, 0, p5.width)
      let h = -p5.height + p5.map(spectrum[idx], 0, 300, p5.height, 0)
      p5.rect(x, p5.height, p5.width / spectrum.length + 2, h)
    })

    // Planet Visualizer
    let geometry_power = 20
    let geomerty_size = 45
    let geometry_color = "rgba(255,255,255,0)"
    if (bass_power > 200) {
      // Stepping for planet settings
      geometry_power = 4
      geomerty_size = 68
      geometry_color = "rgba(255,40,60,1)"
    } else if (bass_power > 170 && bass_power < 200) {
      geometry_power = 8
      geomerty_size = 58
      geometry_color = "rgba(150,200,255,0.9)"
    } else if (bass_power > 120 && bass_power < 170) {
      geometry_power = 11
      geomerty_size = 50
      geometry_color = "rgba(255,255,255,0.5)"
    }
    // Main big planet
    p5.translate(p5.width / 1.4, p5.height / 2.5, 200)
    p5.rotateY(p5.millis() / 8000)
    p5.fill("rgba(50,50,150,0.2)")
    p5.stroke(geometry_color)
    p5.sphere(
      Math.floor(geomerty_size + level * 100),
      geometry_power,
      geometry_power
    )

    // Moon
    if (bass_power > 170) {
      p5.rotateY(p5.millis() / 1000)
      p5.translate(-150, -8)
      p5.fill("rgba(50,50,150,0.2)")
      p5.stroke(geometry_color)
      p5.sphere(
        Math.floor(geomerty_size / 5 + level * 100),
        geometry_power,
        geometry_power
      )
    }
  }

  const windowResized = (p5) => {
    // Resized window
    p5.resizeCanvas(window.innerWidth, window.innerHeight / 2)

    // Reload the background image and scale it
    bg = p5.loadImage("/bg.jpg")
    if (bg.height < p5.height) {
      bg.resize(0, p5.height)
    } else {
      bg.resize(p5.width, 0)
    }
  }

  const setVolumeForSong = (volume) => {
    // Function that has access to control the volume
    // that we can pass outside of the Sketch component.

    song.setVolume(volume)
    curVolume = volume
  }

  return (
    <>
      <div
        style={{ position: "relative", minHeight: "50vh", display: "block" }}
      >
        <Sketch
          windowResized={windowResized}
          preload={preload}
          setup={setup}
          draw={draw}
        />
        <div className={`play-pause`}>Play</div>
      </div>
      <div className="slider-container">
        <Slider setVolumeForSong={setVolumeForSong} />
      </div>
    </>
  )
}

export default Sound
