import { useUmbra } from '../state/context';
import { truncate } from '../lib/format';

export function TopBar() {
  const { phase, networkId, walletName, address, disconnect } = useUmbra();
  const connected = phase === 'connected';
  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand__mark" src="/moon.svg" alt="" />
        <span className="brand__name">
          Umbra <em>·</em> <span className="muted" style={{ fontSize: '14px' }}>Waxing Crescent</span>
        </span>
      </div>
      <div className="stack" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="pill">
          <span className={`dot ${connected ? 'dot--on' : 'dot--warn'}`} />
          {connected ? networkId : 'testnet'}
        </span>
        {connected && address ? (
          <>
            <span className="chip-addr" title={address}>
              {walletName ? `${walletName} · ` : ''}
              {truncate(address, 10, 6)}
            </span>
            <button className="btn btn--ghost btn--sm" onClick={disconnect}>
              Disconnect
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
