import { PlayerWindow } from "@/components/retro/PlayerWindow";
import { InviteWindow } from "@/components/retro/InviteWindow";
import { SpotifyWindow } from "@/components/retro/SpotifyWindow";

export default function Home() {
  return (
    <>
      <PlayerWindow />
      <div className="bottomrow">
        <InviteWindow />
        <SpotifyWindow />
      </div>
      <p className="tagline-under">★ best viewed with the sound on ★</p>
    </>
  );
}
