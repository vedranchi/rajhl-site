import { PlayerWindow } from "@/components/retro/PlayerWindow";
import { InviteWindow } from "@/components/retro/InviteWindow";

export default function Home() {
  return (
    <>
      <PlayerWindow />
      <InviteWindow />
      <p className="tagline-under">★ best viewed with the sound on ★</p>
    </>
  );
}
