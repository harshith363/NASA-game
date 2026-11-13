import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, Lightbulb } from 'lucide-react';
import { Media, SourcesDrawer } from '../components/Media';
import {
  artifactChoices, descentReasons, evidence, museumCaptions, slots, waterChoices, type EvidenceId,
} from '../content/investigations';

type PuzzleProps = { onComplete: () => void };

function useAssistance() {
  const [attempts, setAttempts] = useState(0);
  const [idle, setIdle] = useState(false);
  const [activity, setActivity] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setIdle(true), 30_000);
    return () => window.clearTimeout(timer);
  }, [activity]);
  function interact() { setActivity(value => value + 1); }
  function miss() { setAttempts(count => count + 1); interact(); }
  return { miss, interact, attempts, available: idle || attempts >= 2 };
}

export function Choices({ options, onChoose }: { options: readonly string[]; onChoose: (index: number) => void }) {
  return <div className="choices">{options.map((option, index) =>
    <button className="choice" key={option} onClick={() => onChoose(index)}>
      <span className="option-index" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
      <span>{option}</span><ArrowRight size={17} aria-hidden="true" />
    </button>)}</div>;
}

function PuzzlePanel({ name, prompt, feedback, children, assist }: {
  name: string; prompt: string; feedback?: string; children: ReactNode; assist?: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) heading.current?.focus();
    first.current = false;
  }, [prompt]);
  return <section className="panel puzzle-panel">
    <p className="eyebrow"><BookOpen size={15} /> {name}</p>
    <h2 ref={heading} tabIndex={-1}>{prompt}</h2>
    {children}
    <p className="feedback" role="status">{feedback}</p>
    {assist && <button className="button secondary" onClick={assist}><Lightbulb size={17} /> Show me the explanation</button>}
  </section>;
}

function Result({ children, onComplete }: PuzzleProps & { children: ReactNode }) {
  return <div className="puzzle-result"><p>{children}</p><button className="button primary" onClick={onComplete}>Restore the record <ArrowRight size={17} /></button></div>;
}

export function ApolloModuleDiagram({ seen, onInspect }: { seen: string[]; onInspect: (part: string) => void }) {
  return <figure className={`module-diagram ${seen.includes('ascent') ? 'departing' : ''}`}>
    <div className="module-map">
    <svg viewBox="0 0 360 228" role="img" aria-label="Two-stage diagram. The upper cabin and engine lift off, leaving the lower platform and legs.">
      <path d="M30 198h300M45 211h270" stroke="#536477" strokeDasharray="4 8" />
      <g className="module-ascent">
        <path d="M123 117 112 87 132 58 204 58 229 84 220 117Z" fill="#183441" stroke="#9cdce4" strokeWidth="2" />
        <path d="m136 77 30-6-8 22-22-5zm53-6 24 12-4 10-21-3z" fill="#82cad9" />
        <path d="M159 116h37l8 14h-54Z" fill="#2f535d" stroke="#9cdce4" />
        <path d="M199 57l20-24m-9 6 20 13" stroke="#9cdce4" fill="none" />
      </g>
      <g className="module-descent">
        <path d="M110 131h123l-9 37H120Z" fill="#3e2e1f" stroke="#e7b66b" strokeWidth="2" />
        <path d="m126 164-29 29m123-29 29 29m-170 0h35m119 0h33M137 135v29m27-29v29m27-29v29" fill="none" stroke="#e7b66b" strokeWidth="2" />
      </g>
      <path d="M256 116V61m-8 9 8-9 8 9" fill="none" stroke="#9cdce4" strokeDasharray="3 4" />
    </svg>
    <div className="diagram-actions">
      {(['ascent', 'descent'] as const).map(part => <button key={part} className={`button secondary hotspot hotspot-${part}`} onClick={() => onInspect(part)} aria-pressed={seen.includes(part)}>
        {seen.includes(part) && <Check size={16} />}
        {part === 'ascent' ? (seen.includes(part) ? 'Ascent stage departed' : 'Inspect upper stage') : (seen.includes(part) ? 'Descent stage stayed' : 'Inspect lower stage')}
      </button>)}
    </div>
    </div>
    <figcaption>Original educational schematic · Two stages of Eagle</figcaption>
  </figure>;
}

export function ApolloPuzzle({ onComplete }: PuzzleProps) {
  const [step, setStep] = useState<'identify' | 'reveal' | 'reason' | 'result'>('identify');
  const [seen, setSeen] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const assistance = useAssistance();
  const prompt = { identify: 'Which major component remained at Tranquility Base?', reveal: 'Inspect both stages of Eagle', reason: 'Why did it stay?', result: 'A platform for departure' }[step];
  const identifyHint = 'The astronauts needed an engine and cabin to leave the Moon. Which part served as the platform they launched from?';
  return <PuzzlePanel name="Apollo 11 investigation" prompt={prompt} feedback={feedback}
    assist={assistance.available && (step === 'identify' || step === 'reason') ? () => { setFeedback(''); setStep(step === 'identify' ? 'reveal' : 'result'); } : undefined}>
    {step === 'identify' && <>
      <Choices options={artifactChoices} onChoose={index => {
        if (index === 0) { setFeedback(''); setStep('reveal'); assistance.interact(); }
        else { assistance.miss(); setFeedback(identifyHint); }
      }} />
      <details className="hint"><summary>Get a clue</summary><p>{identifyHint}</p></details>
    </>}
    {step === 'reveal' && <>
      <div className="gallery investigation-gallery">
        <Media id="apollo" />
        <ApolloModuleDiagram seen={seen} onInspect={part => { setSeen(previous => [...new Set([...previous, part])]); assistance.interact(); }} />
      </div>
      <p>Look for the cabin above and the landing platform below.</p>
      <button className="button primary" disabled={seen.length < 2} onClick={() => { setStep('reason'); assistance.interact(); }}>Continue to the explanation question <ArrowRight size={17} /></button>
    </>}
    {step === 'reason' && <Choices options={descentReasons} onChoose={index => {
      if (index === 0) { setFeedback(''); setStep('result'); }
      else { assistance.miss(); setFeedback('The descent stage did its job at landing. Look for the answer that describes how the two stages worked together.'); }
    }} />}
    {step === 'result' && <>
      <Media id="hardware" className="inline-evidence" />
      <Result onComplete={onComplete}>The descent stage landed Eagle and provided a stable launch platform. The ascent stage carried the astronauts off the Moon, leaving the descent stage in place by design.</Result>
    </>}
    <SourcesDrawer ids={['N1', 'N2', 'N3']} media={['apollo', 'hardware']} />
  </PuzzlePanel>;
}

export function OpportunityEvidencePuzzle({ onComplete }: PuzzleProps) {
  const [step, setStep] = useState<'arrange' | 'interpret' | 'result'>('arrange');
  const [arranged, setArranged] = useState<(EvidenceId | null)[]>([null, null, null]);
  const [picked, setPicked] = useState<EvidenceId | null>(null);
  const [feedback, setFeedback] = useState('');
  const assistance = useAssistance();
  function place(index: number) {
    if (!picked) return;
    const from = arranged.indexOf(picked);
    const updated = [...arranged];
    if (from >= 0) updated[from] = arranged[index];
    updated[index] = picked;
    setArranged(updated);
    setPicked(null);
    setFeedback('');
    assistance.interact();
  }
  const prompt = { arrange: 'Build Opportunity’s evidence trail', interpret: 'What did Opportunity find evidence for?', result: 'Rocks record a wetter past' }[step];
  return <PuzzlePanel name="Opportunity science investigation" prompt={prompt} feedback={feedback}
    assist={assistance.available && step !== 'result' ? () => {
      setFeedback('');
      if (step === 'arrange') { setArranged(evidence.map(card => card.id)); setStep('interpret'); }
      else setStep('result');
    } : undefined}>
    {step === 'arrange' && <>
      <p>Select an evidence card, then choose a slot. Select a card again to move it.</p>
      <div className="evidence-deck">{[evidence[2], evidence[0], evidence[1]].map(card => <article key={card.id} className="evidence-card">
        <Media id={card.assetId} /><h3>{card.title}</h3><p>{card.subtitle}</p>
        <button className="button secondary" aria-pressed={picked === card.id} onClick={() => { setPicked(card.id); assistance.interact(); }}>
          Select {card.title}
        </button>
      </article>)}</div>
      <div className="evidence-slots">{slots.map((slot, index) =>
        <button key={slot} className="slot" aria-label={`Slot ${index + 1}: ${slot}${arranged[index] ? ', ' + evidence.find(card => card.id === arranged[index])?.title : ', empty'}`} onClick={() => place(index)} disabled={!picked}>
          <span>{index + 1} · {slot}</span><strong>{evidence.find(card => card.id === arranged[index])?.title ?? 'Choose a card'}</strong>
        </button>)}</div>
      <button className="button primary" disabled={arranged.includes(null)} onClick={() => {
        if (evidence.every((card, index) => arranged[index] === card.id)) {
          setStep('interpret'); setFeedback(''); assistance.interact();
        } else {
          assistance.miss();
          setFeedback(assistance.attempts >= 1 ? 'Hint: Start with the landing; finish with the final mission route.' : 'The trail is out of order. The same cards can be moved to new slots.');
        }
      }}>Check the trail <ArrowRight size={17} /></button>
    </>}
    {step !== 'arrange' && <ol className="ordered-trail">{evidence.map(card => <li key={card.id}><strong>{card.title}</strong> <span>{card.subtitle}</span></li>)}</ol>}
    {step === 'interpret' && <Choices options={waterChoices} onChoose={index => {
      if (index === 0) { setFeedback(''); setStep('result'); }
      else { assistance.miss(); setFeedback('The rover measured minerals and rock textures. Those observations tell us about ancient environments.'); }
    }} />}
    {step === 'result' && <Result onComplete={onComplete}>The rock evidence shows that water once shaped these environments. It does not establish that living organisms were found.</Result>}
    <details className="hint"><summary>Dig deeper</summary><p>A sol is a Martian day, slightly longer than an Earth day. Opportunity was designed for about 90 sols. At El Capitan, Opportunity used its rock abrasion tool and instruments to examine layered rocks and measure minerals such as jarosite, which helped scientists identify past water-related conditions.</p></details>
    <SourcesDrawer ids={['N4', 'N7', 'ROCK', 'CRATER']} media={['rock', 'traverse', 'eagle-crater']} />
  </PuzzlePanel>;
}

export function OpportunityCaptionPuzzle({ onComplete }: PuzzleProps) {
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const assistance = useAssistance();
  function finish() { setFeedback(''); setComplete(true); }
  return <PuzzlePanel name="Opportunity final record" prompt={complete ? 'The caption is ready' : 'Choose the museum caption'} feedback={feedback}
    assist={assistance.available && !complete ? finish : undefined}>
    {!complete && <Choices options={museumCaptions} onChoose={index => {
      if (index === 2) finish();
      else {
        assistance.miss();
        setFeedback(index === 0 ? '90 sols was the planned mission. Opportunity explored for nearly 15 Earth years.' : 'The rover found evidence of environments shaped by water. The mission did not discover life.');
      }
    }} />}
    {complete && <Result onComplete={onComplete}>{museumCaptions[2]} Its original design life was 90 sols.</Result>}
    <SourcesDrawer ids={['N4', 'N5', 'N6', 'N7']} media={['last-image']} />
  </PuzzlePanel>;
}
