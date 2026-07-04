import { useState } from 'react';
import { useUmbra } from '../state/context';
import { truncate } from '../lib/format';

export function PrivacyPanel() {
  const u = useUmbra();
  const [reveal, setReveal] = useState(false);
  const posterHex = u.board?.posterHex ?? '';

  return (
    <section className="card">
      <p className="card__eyebrow">
        <span className="dot" /> The privacy claim
      </p>
      <h2 className="card__title">Proven, not shown</h2>
      <p className="muted" style={{ margin: '8px 0 16px', fontSize: 13.5 }}>
        Two states run at once. You decide, with <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet-bright)' }}>disclose()</code>,
        exactly what crosses from private to public.
      </p>

      <div className="duality">
        <div className="face face--public">
          <p className="face__tag">◐ In the light · on-chain</p>
          <div className="kv">
            <div className="kv__row">
              <span className="kv__k">notice</span>
              <span className="kv__v" style={{ fontSize: 13 }}>
                {u.board?.message ? `“${truncate(u.board.message, 14, 4)}”` : '—'}
              </span>
            </div>
            <div className="kv__row">
              <span className="kv__k">poster</span>
              <span className="kv__v hash" title={posterHex}>
                {posterHex ? truncate(posterHex, 8, 6) : '—'}
              </span>
            </div>
            <div className="kv__row">
              <span className="kv__k">count</span>
              <span className="kv__v mono">{u.board?.noticeCount ?? 0}</span>
            </div>
          </div>
          <p className="face__body" style={{ marginTop: 10 }}>
            A one-way hash of your key — not your key.
          </p>
        </div>

        <div className="gate">
          <code>disclose()</code>
        </div>

        <div className="face face--private">
          <p className="face__tag">● In shadow · this device only</p>
          <div className="kv">
            <div className="kv__row">
              <span className="kv__k">secret key</span>
              <span className="kv__v masked">
                {reveal ? truncate(u.secretHex, 10, 8) : '•••• •••• •••• ••••'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setReveal((r) => !r)}>
              {reveal ? 'Hide' : 'Reveal to me'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={u.regenerateSecret} disabled={u.busy !== null}>
              New identity
            </button>
          </div>
          <p className="face__body" style={{ marginTop: 10 }}>
            Never sent — not to connect, post, or take down.
          </p>
        </div>
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        <b>Take-down is the proof.</b> Only the original poster can remove a notice: the contract checks
        that the stored pseudonym re-derives from your secret, in zero knowledge. The chain learns only
        pass or fail.
      </p>
    </section>
  );
}
