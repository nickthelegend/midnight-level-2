import { useUmbra } from '../state/context';
import { truncate } from '../lib/format';

export function BoardPanel() {
  const u = useUmbra();
  const connected = u.phase === 'connected';

  if (!connected) {
    return (
      <section id="board" className="card">
        <p className="card__eyebrow">
          <span className="dot" /> The board
        </p>
        <h2 className="card__title">Connect to open a board</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          Umbra runs on Midnight&rsquo;s public testnet. Connect Lace above, then deploy a new board or
          join one that already exists.
        </p>
      </section>
    );
  }

  if (!u.contractAddress) {
    return (
      <section id="board" className="card">
        <p className="card__eyebrow">
          <span className="dot dot--on" /> The board
        </p>
        <h2 className="card__title">Open a board</h2>
        <p className="muted" style={{ margin: '8px 0 18px' }}>
          Deploy a fresh board to the testnet, or join one that&rsquo;s already out there.
        </p>
        <button className="btn btn--lit" onClick={u.deployBoard} disabled={u.busy !== null}>
          {u.busy === 'deploying' ? (
            <>
              <span className="spin" /> Deploying &amp; proving&hellip;
            </>
          ) : (
            'Deploy a new board'
          )}
        </button>
        <div className="muted" style={{ margin: '18px 0', textAlign: 'center' }}>
          or
        </div>
        <div className="field">
          <label htmlFor="join">Join by contract address</label>
          <input
            id="join"
            className="input input--mono"
            placeholder="0100abc…"
            value={u.joinInput}
            onChange={(e) => u.setJoinInput(e.target.value)}
          />
        </div>
        <button
          className="btn btn--ghost"
          style={{ marginTop: 12 }}
          onClick={u.joinBoard}
          disabled={u.busy !== null || !u.joinInput.trim()}
        >
          {u.busy === 'joining' ? (
            <>
              <span className="spin" /> Joining&hellip;
            </>
          ) : (
            'Join board'
          )}
        </button>
      </section>
    );
  }

  const board = u.board;
  const occupied = board?.occupied ?? false;
  return (
    <section id="board" className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <p className="card__eyebrow" style={{ margin: 0 }}>
          <span className={`dot ${occupied ? 'dot--warn' : 'dot--on'}`} /> {occupied ? 'Board occupied' : 'Board vacant'}
        </p>
        <button className="btn btn--ghost btn--sm" onClick={u.refresh} disabled={u.busy !== null}>
          {u.busy === 'refreshing' ? <span className="spin" /> : 'Refresh'}
        </button>
      </div>

      <div className={`board ${occupied ? 'board--occupied' : ''}`} style={{ marginTop: 14 }}>
        {occupied ? (
          <p className="board__msg">&ldquo;{board?.message}&rdquo;</p>
        ) : (
          <p className="board__empty">The board is dark. Post the first notice.</p>
        )}
      </div>

      {occupied ? (
        <button className="btn btn--danger" style={{ marginTop: 16 }} onClick={u.takeDown} disabled={u.busy !== null}>
          {u.busy === 'takingDown' ? (
            <>
              <span className="spin" /> Proving authorship&hellip;
            </>
          ) : (
            'Take it down — prove I posted it'
          )}
        </button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="msg">Your notice — public once posted</label>
            <input
              id="msg"
              className="input"
              maxLength={120}
              placeholder="e.g. The vote passes at midnight."
              value={u.postInput}
              onChange={(e) => u.setPostInput(e.target.value)}
            />
          </div>
          <button
            className="btn"
            style={{ marginTop: 12 }}
            onClick={u.post}
            disabled={u.busy !== null || !u.postInput.trim()}
          >
            {u.busy === 'posting' ? (
              <>
                <span className="spin" /> Proving &amp; posting&hellip;
              </>
            ) : (
              'Post notice'
            )}
          </button>
        </div>
      )}

      <div className="kv" style={{ marginTop: 20, borderTop: '1px solid var(--edge)', paddingTop: 16 }}>
        <div className="kv__row">
          <span className="kv__k">Contract address</span>
          <button
            className="kv__v hash"
            title={`${u.contractAddress} — click to copy`}
            style={{ background: 'none', border: 'none', cursor: 'copy', textAlign: 'right' }}
            onClick={() => navigator.clipboard?.writeText(u.contractAddress ?? '')}
          >
            {truncate(u.contractAddress, 12, 10)}
          </button>
        </div>
        <div className="kv__row">
          <span className="kv__k">Notices ever posted</span>
          <span className="kv__v mono">{board?.noticeCount ?? 0}</span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
        This address is live on-chain. Share it and others can join the same board.
      </p>
    </section>
  );
}
