import { UmbraProvider, useUmbra } from './state/context';
import { TopBar } from './components/TopBar';
import { Hero } from './components/Hero';
import { BoardPanel } from './components/BoardPanel';
import { PrivacyPanel } from './components/PrivacyPanel';
import { Console } from './components/Console';
import { Footer } from './components/Footer';

function Shell() {
  const { phase, contractAddress, board } = useUmbra();
  const moonPhase: 0 | 1 | 2 | 3 =
    phase !== 'connected' ? 0 : !contractAddress ? 1 : board?.occupied ? 3 : 2;

  return (
    <>
      <div className="sky" />
      <div className="shell">
        <TopBar />
        <Hero phase={moonPhase} />
        <div className="grid">
          <BoardPanel />
          <PrivacyPanel />
        </div>
        <Console />
        <Footer />
      </div>
    </>
  );
}

export function App() {
  return (
    <UmbraProvider>
      <Shell />
    </UmbraProvider>
  );
}
