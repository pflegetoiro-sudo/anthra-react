import { useEffect, useRef, useState } from 'react'
import { initWatch } from './engine/watch-engine'

const PLATES = [
  { id: 'p0', label: 'Cover' },
  { id: 'p1', label: 'Thesis' },
  { id: 'p2', label: 'Case' },
  { id: 'p3', label: 'Dial' },
  { id: 'p4', label: 'Calibre' },
  { id: 'p5', label: 'Bracelet' },
  { id: 'p6', label: 'Finishes' },
  { id: 'p7', label: 'Data' },
  { id: 'p8', label: 'End' },
]
const METAL_NAMES = ['Titanium', 'Onyx', 'Bronze', 'Slate']
const METAL_KEYS = ['titanium', 'onyx', 'bronze', 'slate']

const SPEC_ROWS = [
  ['Reference', 'A-40/01'], ['Case', 'Grade-5 titanium, brushed'], ['Diameter', '40 mm'],
  ['Height', '9.6 mm'], ['Crystal', 'Sapphire, AR-coated inside'], ['Dial', 'Anthracite sunburst'],
  ['Calibre', 'AC-01, automatic'], ['Reserve', '41 hours'], ['Jewels', '26'],
  ['Bracelet', 'Three-link, screwed pins'], ['Weight', '96 g'],
] as const

export default function App() {
  const bgRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLCanvasElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const pnumRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef<HTMLElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const platesRef = useRef<HTMLElement[]>([])

  const [booted, setBooted] = useState(false)
  const [activePlate, setActivePlate] = useState(0)
  const [metal, setMetal] = useState({ name: 'Titanium', model: 'A-40/01' })

  useEffect(() => {
    if (!bgRef.current || !stageRef.current) return

    const api = initWatch(bgRef.current, stageRef.current, {
      onBoot: () => {
        loaderRef.current?.classList.add('done')
        topRef.current?.classList.add('in')
        idxRef.current?.classList.add('in')
        pnumRef.current?.classList.add('in')
        setBooted(true)
      },
      onPlateChange: (i: number) => {
        setActivePlate(i)
        if (pnumRef.current) pnumRef.current.textContent = String(i).padStart(2, '0')
        if (cueRef.current) cueRef.current.style.opacity = i === 0 ? '' : '0'
      },
      onMetalChange: (m: any) => setMetal({ name: m.name, model: m.model }),
      getIndexLinks: () => idxRef.current ? Array.from(idxRef.current.querySelectorAll('a')) : [],
      getChips: () => chipsRef.current ? Array.from(chipsRef.current.querySelectorAll('button')) : [],
      getPlates: () => platesRef.current.filter(Boolean),
    })

    return () => { /* engine runs rAF loop; cleanup is implicit on unmount */ }
  }, [])

  return (
    <>
      {/* Loader */}
      <div id="loader" ref={loaderRef}>
        <div className="w">Anthra</div>
        <i></i>
      </div>

      {/* Chrome */}
      <header id="top" ref={topRef}>
        <b>Anthra</b>
        <span>A-40 · The titanium automatic</span>
      </header>
      <div id="pnum" ref={pnumRef}>00</div>
      <nav id="idx" ref={idxRef}>
        {PLATES.map((p, i) => (
          <a href="#" key={p.id} data-go={i} className={activePlate === i ? 'on' : ''}>
            <span className="t">{p.label}</span>
            <i></i>
          </a>
        ))}
      </nav>
      <div id="cue" ref={cueRef}>Scroll</div>

      {/* Canvases */}
      <canvas id="bg" ref={bgRef}></canvas>
      <canvas id="stage" ref={stageRef}></canvas>

      {/* Plates */}
      <main id="deck">
        {/* 00 Cover */}
        <section className="plate" id="p0" ref={el => { if (el) platesRef.current[0] = el }}>
          <div className="panel">
            <div className="kicker rv">Anthra — instrument watches</div>
            <h1 className="mark rv d1">A-40</h1>
            <div className="subrow rv d2">
              <span>The titanium automatic</span>
              <span>40&nbsp;mm</span>
              <span>Ref. {metal.model}</span>
              <span>{metal.name}</span>
            </div>
          </div>
        </section>

        {/* 01 Thesis */}
        <section className="plate" id="p1" ref={el => { if (el) platesRef.current[1] = el }}>
          <div className="panel">
            <div className="kicker rv">01 — Thesis</div>
            <h2 className="rv d1">Built to be looked at<br />through a lens.</h2>
            <p className="lead rv d2">The A-40 is machined from grade-5 titanium, brushed in one direction,
              then every edge is cut back and <b>polished to a mirror line</b>. Under macro you find
              the finishing; at arm's length you simply see it hold the light.</p>
          </div>
        </section>

        {/* 02 Case */}
        <section className="plate" id="p2" ref={el => { if (el) platesRef.current[2] = el }}>
          <div className="panel">
            <div className="kicker rv">02 — Case</div>
            <h2 className="rv d1">Brushed flanks,<br />mirror chamfers.</h2>
            <p className="lead rv d2">Forty millimetres of grade-5 titanium. The flanks carry one straight
              brush; every edge between them is chamfered and polished until it draws a white line of
              light. The crown sits recessed; the bezel meets the crystal without a step.</p>
            <div className="duo rv d3">
              <div><div className="k">Height</div><div className="v">9.6 mm</div></div>
              <div><div className="k">Water</div><div className="v">100 m, screwed crown</div></div>
            </div>
          </div>
        </section>

        {/* 03 Dial */}
        <section className="plate flip" id="p3" ref={el => { if (el) platesRef.current[3] = el }}>
          <div className="panel">
            <div className="kicker rv">03 — Dial</div>
            <h2 className="rv d1">Anthracite,<br />edge to edge.</h2>
            <p className="lead rv d2">An anthracite sunburst under sapphire coated on its inner face, so the
              residual reflection is a faint violet ring rather than a white sheet. Moonphase at
              twelve, the escapement open at six, the date at three.</p>
          </div>
        </section>

        {/* 04 Calibre */}
        <section className="plate" id="p4" ref={el => { if (el) platesRef.current[4] = el }}>
          <div className="panel">
            <div className="kicker rv">04 — Calibre</div>
            <h2 className="rv d1">AC-01,<br />taken apart.</h2>
            <p className="lead rv d2">Twenty-six jewels, forty-one hours from a full wind, adjusted in five
              positions. Shown here the honest way — in pieces.</p>
          </div>
          <div className="bignum rv d3">41<em>h</em></div>
        </section>
        
        {/* 05 Bracelet */}
        <section className="plate" id="p5" ref={el => { if (el) platesRef.current[5] = el }}>
          <div className="panel">
            <div className="kicker rv">05 — Bracelet</div>
            <h2 className="rv d1">The same light,<br />again.</h2>
            <p className="lead rv d2">Outer links brushed with the case, centre links polished with the
              chamfers, so the bracelet carries the same two finishes down the wrist. Screwed pins,
              a twenty-to-sixteen taper, and a clasp with nothing written on it.</p>
          </div>
        </section>

        {/* 06 Finishes */}
        <section className="plate center" id="p6" ref={el => { if (el) platesRef.current[6] = el }}>
          <div className="panel">
            <div className="kicker rv">06 — Finishes</div>
            <h2 className="rv d1">Four metals.</h2>
            <p className="lead rv d2" style={{ margin: '0 auto' }}>One case, four treatments.
              Titanium is the reference.</p>
            <div id="chips" ref={chipsRef} className="rv d2">
              {METAL_KEYS.map((k, i) => (
                <button key={k} data-k={k} className={k === 'titanium' ? 'on' : ''}>{METAL_NAMES[i]}</button>
              ))}
            </div>
            <div className="finlab rv d3">
              <b>{metal.name}</b>
              <span>{metal.model}</span>
            </div>
          </div>
        </section>

        {/* 07 Data */}
        <section className="plate" id="p7" ref={el => { if (el) platesRef.current[7] = el }}>
          <div className="panel" style={{ gridColumn: '1/7' }}>
            <div className="kicker rv">07 — Data</div>
            <div className="table rv d1">
              {SPEC_ROWS.map(([label, value]) => (
                <div className="tr" key={label}>
                  <span>{label}</span>
                  <b>{label === 'Reference' ? metal.model : value}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 08 End */}
        <section className="plate center" id="p8" ref={el => { if (el) platesRef.current[8] = el }}>
          <div className="panel">
            <h2 className="mark rv" style={{ fontSize: '9vw' }}>Anthra</h2>
            <div className="endmeta rv d1">
              <span>© 2026 Anthra</span>
              <span>The titanium automatic</span>
              <span>A-40</span>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
