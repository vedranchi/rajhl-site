import { Window, MenuBar, Marquee } from "./chrome";
import { Player } from "./Player";
import { Tabs } from "./Tabs";
import { StatusBar } from "./StatusBar";
import { BeatsPanel, KitsPanel, ChannelsPanel, AboutPanel } from "./panels";
import { marqueeItems, catalogueTotals } from "@/data/content";

export function PlayerWindow() {
  return (
    <Window title="LUKA_RAJHL — MediaPlayer" ariaLabel="Luka Rajhl retro media player">
      <MenuBar />
      <Marquee items={marqueeItems} />
      <Tabs
        tabs={[
          { id: "beats", label: "▶ Beats", content: <BeatsPanel /> },
          { id: "kits", label: "◆ Kits", content: <KitsPanel /> },
          { id: "ch", label: "✦ Channels", content: <ChannelsPanel /> },
          { id: "about", label: "☺ About", content: <AboutPanel /> },
        ]}
      />
      <Player />
      <StatusBar beats={catalogueTotals.beats} kits={catalogueTotals.kits} />
    </Window>
  );
}
