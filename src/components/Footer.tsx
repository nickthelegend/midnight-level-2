import { useUmbra } from '../state/context';

export function Footer() {
  const { contractAddress, networkId } = useUmbra();
  return (
    <footer className="footer">
      <span>Umbra · Waxing Crescent — Midnight Academy, Level 2. Compact + Midnight.js.</span>
      <span style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {contractAddress ? <span className="mono">◑ {networkId}</span> : null}
        <a href="https://github.com/nickthelegend/midnight-level-2" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="https://docs.midnight.network" target="_blank" rel="noreferrer">
          Midnight docs
        </a>
      </span>
    </footer>
  );
}
