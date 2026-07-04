import { useUmbra } from '../state/context';
import { Crescent } from './Crescent';

export function Hero({ phase }: { phase: 0 | 1 | 2 | 3 }) {
  const { phase: conn, busy, connect, walletError, address } = useUmbra();
  const connecting = busy === 'connecting';
  const proving = busy === 'deploying' || busy === 'posting' || busy === 'takingDown';
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Midnight Academy · Level 2 · Waxing Crescent</p>
        <h1>
          Post in the open.<br />
          Stay in <em>shadow.</em>
        </h1>
        <p className="hero__lead">
          Umbra is an anonymous notice board on Midnight. Anyone can read a notice and be sure a real
          key-holder wrote it — yet the chain only ever sees a <b>one-way pseudonym</b>. Taking a notice
          down means <b>proving you are its author in zero knowledge</b>, without revealing your secret.
        </p>
        <div className="hero__cta">
          {conn !== 'connected' ? (
            <button className="btn btn--lit" onClick={connect} disabled={connecting}>
              {connecting ? <span className="spin" /> : null}
              {connecting ? 'Check Lace…' : 'Connect Lace'}
            </button>
          ) : (
            <span className="pill pill--live">
              <span className="dot dot--on" /> Wallet connected
            </span>
          )}
          <a className="btn btn--ghost" href="#board">
            {conn === 'connected' ? 'Go to the board' : 'How it works'}
          </a>
        </div>
        {walletError ? (
          <p className="note" style={{ marginTop: 18, borderColor: 'var(--danger)' }}>
            {walletError}
          </p>
        ) : null}
        {conn === 'connected' && address ? (
          <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
            Your secret key never left this browser — not to connect, not to post.
          </p>
        ) : null}
      </div>
      <Crescent phase={phase} proving={proving} />
    </section>
  );
}
