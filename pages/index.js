import Head from "next/head"
import styles from "../styles/Home.module.css"
import Sound from "../components/sound"
import { useState } from "react"

export default function Home() {
  const [song, setSong] = useState("idgaf")
  const [songs, setSongs] = useState([
    {
      title: "IDGAF",
      file: "idgaf",
    },
    {
      title: "Burn Up The Moon",
      file: "burnUpTheMoon",
    },
  ])

  return (
    <div className={styles.container}>
      <Head>
        <title>Bucket Audio Visualizer</title>
        <meta name="description" content="Such visuals, much audios" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Sound song={song} />

        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "50%",
          }}
        >
          {songs.map((onesong, idx) => (
            <div
              className="song-select"
              key={idx}
              onClick={() => setSong(onesong.file)}
              style={{
                padding: "1rem",
                border: "1px solid white",
                width: "50%",
                color: "white",
              }}
            >
              {onesong.title}{" "}
              {song === onesong.file ? "(Playing)" : "(Click to play)"}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
