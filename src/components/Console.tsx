import { useEffect, useRef } from 'react';
import { useUmbra } from '../state/context';

export function Console() {
  const { log } = useUmbra();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [log.length]);

  return (
    <section className="card" style={{ marginTop: 20 }}>
      <p className="card__eyebrow">
        <span className="dot" /> Activity
      </p>
      <div className="console" ref={ref}>
        {log.length === 0 ? (
          <div className="log">
            <span className="log__m muted">Waiting — connect your wallet to begin.</span>
          </div>
        ) : (
          log.map((e) => (
            <div key={e.id} className={`log log--${e.kind}`}>
              <span className="log__t">{e.t}</span>
              <span className="log__m">{e.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
