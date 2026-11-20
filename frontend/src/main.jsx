import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const initial = () => ({phase: 'idle', workers: {}, answer: '', error: '', meta: null});
const parseEvents = (reader, onEvent) => {
  const decoder = new TextDecoder(); let buffer = ''; let name = 'message';
  const pump = () => reader.read().then(({done, value}) => {
    if (done) return; buffer += decoder.decode(value, {stream: true});
    const chunks = buffer.split('\n\n'); buffer = chunks.pop();
    chunks.forEach(chunk => { let data = ''; name = 'message'; chunk.split('\n').forEach(line => {
      if (line.startsWith('event:')) name = line.slice(6).trim();
      if (line.startsWith('data:')) data += line.slice(5).trim();
    }); if (data) onEvent(name, JSON.parse(data)); }); return pump();
  }); return pump();
};

function App() {
  const [file, setFile] = useState(null); const [question, setQuestion] = useState('');
  const [count, setCount] = useState(4); const [state, setState] = useState(initial());
  const run = async event => {
    event.preventDefault(); if (!file || !question.trim()) return;
    setState({...initial(), phase: 'reading'}); const data = new FormData();
    data.set('document', file); data.set('question', question); data.set('workers', count);
    try { const response = await fetch('/api/search', {method: 'POST', body: data});
      if (!response.ok) throw new Error((await response.json()).detail || 'Request failed');
      await parseEvents(response.body.getReader(), (type, payload) => setState(previous => {
        const workers = {...previous.workers};
        if (type === 'session') return {...previous, phase: 'workers', meta: payload};
        if (type === 'worker_started') workers[payload.worker] = {...payload, status: 'reading'};
        if (type === 'worker_complete') workers[payload.worker] = {...payload, status: 'done'};
        if (type === 'worker_error') workers[`error-${Object.keys(workers).length}`] = {status: 'error', pages: 'unavailable', answer: payload.message};
        if (type === 'coordinator_started') return {...previous, workers, phase: 'coordinating'};
        if (type === 'coordinator_complete') return {...previous, workers, phase: 'complete', answer: payload.answer};
        if (type === 'coordinator_error' || type === 'fatal') return {...previous, workers, phase: 'error', error: payload.message};
        return {...previous, workers};
      }));
    } catch (error) { setState(previous => ({...previous, phase: 'error', error: error.message})); }
  };
  const active = state.phase !== 'idle' && state.phase !== 'complete' && state.phase !== 'error';
  return <main><header><span className="spark">✦</span><div><p className="kicker">PARALLEL PDF RESEARCH</p><h1>Make a small<br/><em>agent swarm.</em></h1></div><p className="model">Vertex AI<br/>Gemini Flash-Lite</p></header>
    <section className="intro"><p>Each agent studies a different page range. Watch their evidence arrive live, then let the coordinator turn it into one answer.</p><div className="orbit">{[1,2,3,4,5,6].map(x=><i key={x}/>)}</div></section>
    <form onSubmit={run}><label className="file">{file ? <><b>{file.name}</b><small>{(file.size/1024/1024).toFixed(1)} MB ready</small></> : <><b>Drop in a PDF</b><small>Text-based documents work best</small></>}<input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files[0])}/></label>
      <label className="question">Research question<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What does this document say about the main risks?" maxLength="1000"/></label>
      <div className="slider"><div><b>Agents to summon</b><span>{count} agents</span></div><input type="range" min="2" max="10" value={count} onChange={e=>setCount(+e.target.value)}/><div className="ticks"><span>2</span><span>10</span></div></div>
      <button disabled={active || !file || !question.trim()}>{active ? 'Research in progress…' : 'Launch research team'} <span>→</span></button></form>
    {state.phase !== 'idle' && <section className="mission"><div className="mission-head"><div><p className="kicker">LIVE MISSION CONTROL</p><h2>{state.phase === 'coordinating' ? 'Coordinator is synthesizing' : state.phase === 'complete' ? 'Research complete' : state.phase === 'error' ? 'Mission needs attention' : 'Agents are reading'}</h2></div>{state.meta && <span className="chip">{state.meta.pages} pages · {state.meta.workers} agents</span>}</div>
      <div className="progress"><i style={{width: state.phase === 'complete' ? '100%' : state.phase === 'coordinating' ? '86%' : `${Math.max(8, Object.values(state.workers).filter(w=>w.status==='done').length / Math.max(count, 1) * 72)}%`}}/></div>
      <div className="agent-grid">{Object.entries(state.workers).map(([key, agent]) => <article className={`agent ${agent.status}`} key={key}><div className="agent-top"><span className="avatar">{agent.status === 'done' ? '✓' : agent.status === 'error' ? '!' : '◌'}</span><b>{key.startsWith('error') ? 'Agent error' : `Agent ${agent.worker}`}</b><small>{agent.status === 'reading' ? 'reading…' : agent.status}</small></div><p className="pages">Pages {agent.pages}</p>{agent.status === 'reading' ? <div className="shimmer"/> : <p className="finding">{agent.answer}</p>}{agent.truncated && <small className="note">Text capped to protect token budget.</small>}</article>)}</div>
      {state.answer && <article className="coordinator"><p className="kicker">✦ COORDINATOR REPORT</p><div>{state.answer.split('\n').map((line, i)=><p key={i}>{line || <br/>}</p>)}</div></article>}
      {state.error && <div className="error"><b>What happened</b><p>{state.error}</p><small>For `403` billing errors: in Google Cloud, attach an eligible billing account to this project; then retry with fewer agents or a shorter document.</small></div>}
    </section>}</main>;
}
createRoot(document.getElementById('root')).render(<App/>);
