import { Window, MenuBar, Marquee, Transport } from "./chrome";
import { Tabs } from "./Tabs";
import { StatusBar } from "./StatusBar";
import { BeatsPanel, KitsPanel, ChannelsPanel, AboutPanel } from "./panels";
import { marqueeItems, nowPlaying } from "@/data/content";

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
      <Transport
        title={nowPlaying.title}
        artist={nowPlaying.artist}
        elapsed={nowPlaying.elapsed}
        total={nowPlaying.total}
      />
      <StatusBar beats={24} kits={3} />
    </Window>
  );
}
